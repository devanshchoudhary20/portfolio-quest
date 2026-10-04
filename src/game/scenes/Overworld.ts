import Phaser from 'phaser';
import type { SpeciesId } from '../../content';
import { startBattle } from '../battle/controller';
import { isUiOpen, store } from '../../state/store';
import type { WorldRequest } from '../../state/store';
import { GridMover, OPPOSITE } from '../movement/GridMover';
import { Bump } from './Bump';
import { DayTint } from './DayTint';
import { Gates } from './Gates';
import { Maze } from './Maze';
import { Navigator } from './Navigator';
import { Travel } from './Travel';
import { Wild } from './Wild';
import type { Tile } from '../movement/GridMover';
import { isOpen } from '../world/conditions';
import { FLAGS } from '../world/flags';
import { interactWith, lockedLine } from '../world/interact';
import { objectAt, readObjects } from '../world/objects';
import type { WorldObject } from '../world/objects';
import { castVote } from '../../net/tally';
import { inRegion, parseRegions } from '../world/regions';
import type { Region } from '../world/regions';
import type { Dir } from '../world/save';
import { DEFAULT_SPAWN, isBuiltTown } from '../world/towns';

// 0.27 s per tile; holding B with the Running Shoes doubles it
const WALK_SPEED = 1 / 0.27;
const RUN_SPEED = WALK_SPEED * 2;
const FADE_MS = 220;
const QUEUE_AFTER = 0.6;
const TILE = 16;
const PLAYER = 'player';
// above the maze walls and the planted flag, which sit at depth 0
const ACTOR_DEPTH = 1;
const NPC_PREFIX = 'npc:';

export class Overworld extends Phaser.Scene {
  private request!: WorldRequest;
  private mover!: GridMover;
  private objects: WorldObject[] = [];
  private busy = true;
  private lastPulse = 0;
  private bump!: Bump;
  private speed = WALK_SPEED;
  private tint: DayTint | null = null;
  private indoor = false;
  private cleanups: (() => void)[] = [];
  private regions: Region[] = [];
  private lastRegion: Region | null = null;
  private tapping = false;
  private tile: Tile = { x: 0, y: 0 };
  private travel!: Travel;
  private maze: Maze | null = null;
  private navigator!: Navigator;
  private wild!: Wild;

  constructor() {
    super('Overworld');
  }

  init(request: WorldRequest) {
    this.request = request;
    this.busy = true;
    this.objects = [];
    this.tint = null;
    this.indoor = false;
    this.lastRegion = null;
    this.cleanups = [];
    this.tapping = false;
    this.speed = WALK_SPEED;
    this.maze = null;
    this.travel = new Travel(this, request, {
      fadeThen: (leave) => this.fadeThen(leave),
      walkTo: (name) => this.walkTo(name),
      busy: () => this.busy,
    });
  }

  preload() {
    const { town } = this.request;
    if (this.cache.tilemap.exists(`map-${town}`)) return;
    this.load.tilemapTiledJSON(`map-${town}`, `/maps/${town}.json`);
    this.load.image(`tiles-${town}`, `/assets/ninja-adventure/tiles-${town}.png`);
    this.travel.trackLoad();
  }

  create() {
    const { town } = this.request;
    this.travel.loaded();
    this.events.once('shutdown', () => {
      this.travel.loaded();
      this.cleanups.forEach((fn) => fn());
    });
    this.cleanups.push(this.travel.watchChoice());
    if (this.travel.failed || !this.cache.tilemap.exists(`map-${town}`) || !this.textures.exists(`tiles-${town}`)) {
      this.travel.error();
      return;
    }
    store.getState().actions.setTravel(null);

    const map = this.make.tilemap({ key: `map-${town}` });
    const tileset = map.addTilesetImage(town, `tiles-${town}`);
    if (!tileset) {
      this.travel.error();
      return;
    }
    map.createLayer('ground', tileset)?.setDepth(-2);
    const things = map.createLayer('things', tileset);
    things?.setDepth(-1);
    // the movement layer reads collision from a created tile layer
    map.createLayer('collide', tileset)?.setVisible(false);
    this.objects = readObjects(map);

    this.mover = new GridMover(this);
    this.mover.create(map);
    const start = this.resolveStart();
    if (!start) {
      this.travel.error();
      return;
    }
    const player = this.add.sprite(0, 0, PLAYER).setDepth(ACTOR_DEPTH);
    this.mover.addChar(PLAYER, player, start.tile, { speed: WALK_SPEED, facing: start.facing });
    this.addNpcs();
    this.bump = new Bump(this.mover, PLAYER);
    const gates = new Gates(this.mover, things ?? null, this.objects, store.getState().flags);

    this.wild = new Wild(town, this.mover, this.objects, PLAYER, () => this.busy, () => {
      this.navigator.cancel();
      this.tapping = false;
    });
    this.regions = parseRegions(map.properties);
    this.navigator = new Navigator(this.mover, this.objects, this.regions, town, PLAYER, gates, (goal) => this.faceTile(goal));
    const mazeRegion = this.regions.find((r) => r.maze);
    if (mazeRegion) this.maze = new Maze(this, this.mover, mazeRegion, this.objects, PLAYER);
    const camera = this.cameras.main;
    camera.startFollow(player, true);
    camera.setZoom(store.getState().stage.scale);
    this.clampCamera(start.tile);
    // a save that loads inside the Hall of Fame room does not reopen its panel
    this.enterRegion(start.tile, false);
    this.tint = new DayTint(this);
    this.input.on('pointerdown', this.onTap, this);

    this.cleanups.push(
      this.mover.onArrived((id, tile) => this.onArrived(id, tile)),
      this.watchStepBack(),
      this.watchBattle(),
      this.travel.watchNav(),
      store.subscribe((state, prev) => {
        if (state.flags !== prev.flags) gates.sync(state.flags);
        if (state.stage === prev.stage) return;
        camera.setZoom(state.stage.scale);
        this.clampCamera(this.tile);
      }),
    );
    const { actions } = store.getState();
    actions.setPlayer(this.request.town, start.tile, start.facing);
    actions.requestSave();

    if (!store.getState().reducedMotion) camera.fadeIn(FADE_MS);
    this.busy = false;
    this.maze?.enter(start.tile);
    this.travel.resumeNav();
  }

  update() {
    const state = store.getState();
    const pulsed = state.aPulse !== this.lastPulse;
    this.lastPulse = state.aPulse;
    this.tint?.sync(this.indoor);
    if (this.busy || isUiOpen(state)) return;

    const want = state.run && state.flags.includes(FLAGS.shoes) ? RUN_SPEED : WALK_SPEED;
    if (want !== this.speed) {
      this.speed = want;
      this.mover.setSpeed(PLAYER, want);
    }
    // a tap moves one tile; a held key queues the next tile once this one is mostly done
    const canQueue = !this.mover.isMoving(PLAYER) || this.mover.progress(PLAYER) > QUEUE_AFTER;
    if (state.held && this.navigator.active) this.navigator.cancel();
    if (state.held && this.tapping) {
      this.tapping = false;
      this.mover.stop(PLAYER);
    }
    if (state.held && canQueue) this.mover.move(PLAYER, state.held);
    if (state.held) this.bump.check(this.time.now);
    if (pulsed && !this.mover.isMoving(PLAYER)) this.interact();
  }

  private spawnTile(name: string | undefined) {
    const spawn = this.objects.find((o) => o.name === name && (o.kind === 'spawn' || o.kind === 'door'));
    return spawn ? { tile: { x: spawn.x, y: spawn.y }, facing: (spawn.props.face ?? 'down') as Dir } : null;
  }

  // null only when the map lacks its default spawn, which check-content rejects
  private resolveStart() {
    const { pos, facing, spawn } = this.request;
    if (pos) return { tile: pos, facing: facing ?? 'down' };
    return this.spawnTile(spawn) ?? this.spawnTile(DEFAULT_SPAWN);
  }

  private addNpcs() {
    for (const npc of this.objects.filter((o) => o.kind === 'npc')) {
      const sprite = this.add.sprite(0, 0, `npc-${npc.props.sprite ?? ''}`).setDepth(ACTOR_DEPTH);
      this.mover.addChar(`${NPC_PREFIX}${npc.name}`, sprite, { x: npc.x, y: npc.y }, { speed: WALK_SPEED, facing: (npc.props.face ?? 'down') as Dir });
    }
  }

  // the camera stays inside the region the player is in; bounds are padded to the view size, which centers a smaller room
  private clampCamera(tile: Tile) {
    this.tile = tile;
    const region = this.regions.find((r) => inRegion(r, tile));
    this.indoor = region?.indoor ?? false;
    if (!region) return;
    const camera = this.cameras.main;
    const width = Math.max(region.w * TILE, camera.width / camera.zoom);
    const height = Math.max(region.h * TILE, camera.height / camera.zoom);
    const centerX = (region.x + region.w / 2) * TILE;
    const centerY = (region.y + region.h / 2) * TILE;
    camera.setBounds(centerX - width / 2, centerY - height / 2, width, height);
  }

  // the HUD label follows the region; walking or warping into the Hall of Fame room opens its panel, once per entry
  private enterRegion(tile: Tile, announce = true) {
    const region = this.regions.find((r) => inRegion(r, tile)) ?? null;
    const { actions } = store.getState();
    if (announce && region?.hall && region !== this.lastRegion) actions.openPanel('hof');
    const fork = announce ? this.regions.find((r) => r.vote && inRegion(r, tile)) : undefined;
    if (fork?.vote) void castVote(fork.vote);
    this.lastRegion = region;
    actions.setPlace(region?.name || null);
  }

  private onTap(pointer: Phaser.Input.Pointer) {
    const state = store.getState();
    if (this.busy || isUiOpen(state)) return;
    this.navigator.cancel();
    const target = { x: Math.floor(pointer.worldX / TILE), y: Math.floor(pointer.worldY / TILE) };
    const here = this.mover.position(PLAYER);
    if (target.x === here.x && target.y === here.y) return;
    const interactive = Boolean(this.mover.charAt(target)) || Boolean(objectAt(this.objects, target, ['sign', 'item']));
    this.tapping = true;
    this.mover.moveTo(PLAYER, target, () => {
      this.tapping = false;
      if (interactive) this.faceTile(target);
    });
  }

  // after walking up to a tapped NPC or sign, turn to it when it is a neighbor
  private faceTile(target: Tile) {
    const here = this.mover.position(PLAYER);
    const dx = target.x - here.x;
    const dy = target.y - here.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    this.mover.turn(PLAYER, dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up');
  }

  private onArrived(id: string, tile: Tile) {
    if (id !== PLAYER) return;
    const { actions } = store.getState();
    const town = this.request.town;
    actions.setPlayer(town, tile, this.mover.facing(PLAYER));
    actions.tickStep();
    actions.requestSave();
    this.clampCamera(tile);
    this.enterRegion(tile);
    this.maze?.enter(tile);
    if (this.maze?.isFlag(tile)) this.maze.reportFlag();
    const warp = objectAt(this.objects, tile, ['warp']);
    if (!warp) this.wild.roll(tile);
    else if (!isOpen(warp.props, store.getState().flags)) this.lockedDoor(warp);
    // a panel left open by a tap walk must not be warped out from under
    else if (!this.busy && !isUiOpen(store.getState())) this.warp(warp);
  }

  // test API only: a wild fight from this town's first grass zone
  forceWild(species: SpeciesId, hp: { playerHp?: number; enemyHp?: number }) {
    this.wild.force(species, hp);
  }

  // test API only: what the maze floor is doing
  mazeInfo() {
    return this.maze?.info() ?? null;
  }

  private interact() {
    const front = this.mover.tileInFront(PLAYER);
    const charId = this.mover.charAt(front);
    const npc = charId?.startsWith(NPC_PREFIX) ? this.objects.find((o) => o.kind === 'npc' && `${NPC_PREFIX}${o.name}` === charId) : undefined;
    const target = npc ?? objectAt(this.objects, front, ['sign', 'item']);
    if (!target) {
      this.maze?.plantFlag(front);
      return;
    }
    if (npc && charId) this.mover.turn(charId, OPPOSITE[this.mover.facing(PLAYER)]);
    interactWith(target);
  }

  private warp(obj: WorldObject) {
    const to = obj.props.to ?? '';
    const spawn = obj.props.spawn;
    if (!isBuiltTown(to)) {
      this.travel.closedRoad(to, 'stepBack');
      return;
    }
    this.busy = true;
    store.getState().actions.playCue('warp');
    // a warp that fires only while a flag is missing is a while loop: the HUD counts the laps
    if (obj.props.unless !== undefined) store.getState().actions.bumpLoop();
    const from: WorldRequest = { town: this.request.town, pos: { x: obj.x, y: obj.y }, facing: this.mover.facing(PLAYER) };
    this.fadeThen(() => (to === this.request.town ? this.teleport(spawn) : this.travel.go({ town: to, spawn, from })));
  }

  private fadeThen(leave: () => void) {
    this.busy = true;
    const camera = this.cameras.main;
    if (store.getState().reducedMotion) leave();
    else {
      camera.fadeOut(FADE_MS);
      camera.once('camerafadeoutcomplete', leave);
    }
  }

  // test API only: put the player on a tile facing a direction, as a warp spawn does
  stand(tile: Tile, facing: Dir) {
    this.mover.place(PLAYER, tile, facing);
    this.clampCamera(tile);
    this.enterRegion(tile);
    this.maze?.enter(tile);
    store.getState().actions.setPlayer(this.request.town, tile, facing);
  }

  private teleport(spawn: string | undefined) {
    const dest = this.spawnTile(spawn);
    if (dest) {
      this.stand(dest.tile, dest.facing);
      store.getState().actions.requestSave();
    }
    if (!store.getState().reducedMotion) this.cameras.main.fadeIn(FADE_MS);
    this.busy = false;
    this.navigator.step();
  }

  // a door that needs a role names it instead of staying silent
  private lockedDoor(warp: WorldObject) {
    store.getState().actions.openDialog({ speaker: '', portrait: null, lines: [lockedLine(warp.props, store.getState().flags) ?? ''] });
  }

  private walkTo(name: string | undefined) {
    const at = this.objects.find((o) => o.name === name);
    if (at) this.navigator.begin({ x: at.x, y: at.y });
    return Boolean(at);
  }

  // a gym leader's fact ends with their fight
  private watchBattle() {
    return store.subscribe((state, prev) => {
      const closed = prev.dialog?.after === 'battle' && !state.dialog;
      if (closed && prev.dialog?.battle) startBattle(prev.dialog.battle);
    });
  }

  // the dialog says what should happen once it closes; the scene does it
  private watchStepBack() {
    return store.subscribe((state, prev) => {
      if (prev.dialog?.after === 'stepBack' && !state.dialog) this.mover.move(PLAYER, OPPOSITE[this.mover.facing(PLAYER)]);
    });
  }
}
