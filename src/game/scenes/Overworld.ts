import Phaser from 'phaser';
import { flagId } from '../../content';
import { isUiOpen, store } from '../../state/store';
import type { WorldRequest } from '../../state/store';
import { timeBand } from '../../state/timeBand';
import type { TimeBand } from '../../state/timeBand';
import { GridMover, OPPOSITE } from '../movement/GridMover';
import type { Tile } from '../movement/GridMover';
import { interactWith } from '../world/interact';
import { objectAt, readObjects } from '../world/objects';
import type { WorldObject } from '../world/objects';
import type { Dir } from '../world/save';
import { START, isBuiltTown, townName } from '../world/towns';

// 0.27 s per tile; holding B with the Running Shoes doubles it
const WALK_SPEED = 1 / 0.27;
const RUN_SPEED = WALK_SPEED * 2;
const FADE_MS = 220;
const QUEUE_AFTER = 0.6;
// a cached or quick load never flashes the travel card
const SLOW_LOAD_MS = 300;
const TILE = 16;
const PLAYER = 'player';
const NPC_PREFIX = 'npc:';
const SHOES = flagId('shoes');

const TINTS: Record<TimeBand, { color: number; alpha: number; blend: string } | null> = {
  day: null,
  dusk: { color: 0xe8793a, alpha: 0.2, blend: 'NORMAL' },
  night: { color: 0x1b2a6e, alpha: 0.55, blend: 'MULTIPLY' },
};

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

// the map's "regions" property: "x,y,w,h" tile rectangles joined by semicolons
function parseRegions(properties: unknown): Region[] {
  const raw = (Array.isArray(properties) ? (properties as { name: string; value: unknown }[]).find((p) => p.name === 'regions')?.value : '') ?? '';
  return String(raw)
    .split(';')
    .map((rect) => rect.split(',').map(Number))
    .filter((n) => n.length === 4 && n.every(Number.isFinite))
    .map(([x = 0, y = 0, w = 0, h = 0]) => ({ x, y, w, h }));
}

export class Overworld extends Phaser.Scene {
  private request!: WorldRequest;
  private mover!: GridMover;
  private objects: WorldObject[] = [];
  private busy = true;
  private lastPulse = 0;
  private speed = WALK_SPEED;
  private tint: Phaser.GameObjects.Rectangle | null = null;
  private cleanups: (() => void)[] = [];
  private regions: Region[] = [];
  private tapping = false;
  private tile: Tile = { x: 0, y: 0 };
  private loadFailed = false;
  private loadProgress = 0;
  private loadTimer: ReturnType<typeof setTimeout> | undefined;
  private cardShown = false;

  constructor() {
    super('Overworld');
  }

  init(request: WorldRequest) {
    this.request = request;
    this.busy = true;
    this.objects = [];
    this.tint = null;
    this.cleanups = [];
    this.tapping = false;
    this.speed = WALK_SPEED;
    this.loadFailed = false;
    this.loadProgress = 0;
    this.cardShown = false;
  }

  preload() {
    const { town } = this.request;
    if (this.cache.tilemap.exists(`map-${town}`)) return;
    this.load.tilemapTiledJSON(`map-${town}`, `/maps/${town}.json`);
    this.load.image(`tiles-${town}`, `/assets/ninja-adventure/tiles-${town}.png`);
    this.load.on('loaderror', () => {
      this.loadFailed = true;
    });
    this.load.on('progress', (value: number) => {
      this.loadProgress = value;
      if (this.cardShown) this.showTravelCard();
    });
    this.loadTimer = setTimeout(() => {
      this.cardShown = true;
      this.showTravelCard();
    }, SLOW_LOAD_MS);
  }

  create() {
    const { town } = this.request;
    clearTimeout(this.loadTimer);
    this.events.once('shutdown', () => {
      clearTimeout(this.loadTimer);
      this.cleanups.forEach((fn) => fn());
    });
    this.cleanups.push(this.watchTravel());
    if (this.loadFailed || !this.cache.tilemap.exists(`map-${town}`) || !this.textures.exists(`tiles-${town}`)) {
      this.showTravelError();
      return;
    }
    store.getState().actions.setTravel(null);

    const map = this.make.tilemap({ key: `map-${town}` });
    const tileset = map.addTilesetImage(town, `tiles-${town}`);
    if (!tileset) {
      this.showTravelError();
      return;
    }
    map.createLayer('ground', tileset)?.setDepth(-2);
    map.createLayer('things', tileset)?.setDepth(-1);
    // the movement layer reads collision from a created tile layer
    map.createLayer('collide', tileset)?.setVisible(false);
    this.objects = readObjects(map);

    this.mover = new GridMover(this);
    this.mover.create(map);
    const start = this.resolveStart();
    const player = this.add.sprite(0, 0, PLAYER);
    this.mover.addChar(PLAYER, player, start.tile, { speed: WALK_SPEED, facing: start.facing });
    this.addNpcs();

    this.regions = parseRegions(map.properties);
    const camera = this.cameras.main;
    camera.startFollow(player, true);
    camera.setZoom(store.getState().stage.scale);
    this.clampCamera(start.tile);
    this.addTint();
    this.input.on('pointerdown', this.onTap, this);

    this.cleanups.push(
      this.mover.onArrived((id, tile) => this.onArrived(id, tile)),
      this.watchStepBack(),
      store.subscribe((state, prev) => {
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
  }

  update() {
    const state = store.getState();
    const pulsed = state.aPulse !== this.lastPulse;
    this.lastPulse = state.aPulse;
    this.syncTint();
    if (this.busy || isUiOpen(state)) return;

    const want = state.run && state.flags.includes(SHOES) ? RUN_SPEED : WALK_SPEED;
    if (want !== this.speed) {
      this.speed = want;
      this.mover.setSpeed(PLAYER, want);
    }
    // a tap moves one tile; a held key queues the next tile once this one is mostly done
    const canQueue = !this.mover.isMoving(PLAYER) || this.mover.progress(PLAYER) > QUEUE_AFTER;
    if (state.held && this.tapping) {
      this.tapping = false;
      this.mover.stop(PLAYER);
    }
    if (state.held && canQueue) this.mover.move(PLAYER, state.held);
    if (pulsed && !this.mover.isMoving(PLAYER)) this.interact();
  }

  private spawnTile(name: string | undefined) {
    const spawn = this.objects.find((o) => o.name === name && (o.kind === 'spawn' || o.kind === 'door'));
    return spawn ? { tile: { x: spawn.x, y: spawn.y }, facing: (spawn.props.face ?? 'down') as Dir } : null;
  }

  private resolveStart(): { tile: Tile; facing: Dir } {
    const { pos, facing, spawn } = this.request;
    if (pos) return { tile: pos, facing: facing ?? 'down' };
    return this.spawnTile(spawn) ?? this.spawnTile(START.spawn) ?? { tile: { x: 0, y: 0 }, facing: 'down' };
  }

  private addNpcs() {
    for (const npc of this.objects.filter((o) => o.kind === 'npc')) {
      const sprite = this.add.sprite(0, 0, `npc-${npc.props.sprite ?? ''}`);
      this.mover.addChar(`${NPC_PREFIX}${npc.name}`, sprite, { x: npc.x, y: npc.y }, { speed: WALK_SPEED, facing: (npc.props.face ?? 'down') as Dir });
    }
  }

  // the camera stays inside the region the player is in; bounds are padded to the view size, which centers a smaller room
  private clampCamera(tile: Tile) {
    this.tile = tile;
    const region = this.regions.find((r) => tile.x >= r.x && tile.x < r.x + r.w && tile.y >= r.y && tile.y < r.y + r.h);
    if (!region) return;
    const camera = this.cameras.main;
    const width = Math.max(region.w * TILE, camera.width / camera.zoom);
    const height = Math.max(region.h * TILE, camera.height / camera.zoom);
    const centerX = (region.x + region.w / 2) * TILE;
    const centerY = (region.y + region.h / 2) * TILE;
    camera.setBounds(centerX - width / 2, centerY - height / 2, width, height);
  }

  private onTap(pointer: Phaser.Input.Pointer) {
    const state = store.getState();
    if (this.busy || isUiOpen(state)) return;
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

  private addTint() {
    const config = TINTS[timeBand()];
    if (!config) return;
    this.tint = this.add.rectangle(0, 0, 1, 1, config.color, config.alpha).setDepth(1_000_000).setBlendMode(config.blend);
  }

  private syncTint() {
    if (!this.tint) return;
    const view = this.cameras.main.worldView;
    this.tint.setPosition(view.centerX, view.centerY).setSize(view.width + 64, view.height + 64);
  }

  private onArrived(id: string, tile: Tile) {
    if (id !== PLAYER) return;
    const { actions } = store.getState();
    const town = this.request.town;
    actions.setPlayer(town, tile, this.mover.facing(PLAYER));
    actions.requestSave();
    this.clampCamera(tile);
    const warp = objectAt(this.objects, tile, ['warp']);
    if (warp && !this.busy) this.warp(warp);
  }

  private interact() {
    const front = this.mover.tileInFront(PLAYER);
    const charId = this.mover.charAt(front);
    const npc = charId?.startsWith(NPC_PREFIX) ? this.objects.find((o) => o.kind === 'npc' && `${NPC_PREFIX}${o.name}` === charId) : undefined;
    const target = npc ?? objectAt(this.objects, front, ['sign', 'item']);
    if (!target) return;
    if (npc && charId) this.mover.turn(charId, OPPOSITE[this.mover.facing(PLAYER)]);
    interactWith(target);
  }

  private warp(obj: WorldObject) {
    const to = obj.props.to ?? '';
    const spawn = obj.props.spawn;
    if (!isBuiltTown(to)) {
      this.closedRoad(to);
      return;
    }
    this.busy = true;
    const camera = this.cameras.main;
    const from: WorldRequest = { town: this.request.town, pos: { x: obj.x, y: obj.y }, facing: this.mover.facing(PLAYER) };
    const leave = () => (to === this.request.town ? this.teleport(spawn) : this.go({ town: to, spawn, from }));
    if (store.getState().reducedMotion) leave();
    else {
      camera.fadeOut(FADE_MS);
      camera.once('camerafadeoutcomplete', leave);
    }
  }

  // the one place a town (re)starts, so every caller passes a typed request
  private go(request: WorldRequest) {
    this.scene.restart(request);
  }

  private teleport(spawn: string | undefined) {
    const dest = this.spawnTile(spawn);
    if (dest) {
      this.mover.place(PLAYER, dest.tile, dest.facing);
      this.clampCamera(dest.tile);
      const { actions } = store.getState();
      actions.setPlayer(this.request.town, dest.tile, dest.facing);
      actions.requestSave();
    }
    if (!store.getState().reducedMotion) this.cameras.main.fadeIn(FADE_MS);
    this.busy = false;
  }

  private closedRoad(to: string) {
    store.getState().actions.openDialog({ speaker: '', portrait: null, lines: [`${townName(to) ?? 'That town'} is not open yet.`], after: 'stepBack' });
  }

  // the dialog says what should happen once it closes; the scene does it
  private watchStepBack() {
    return store.subscribe((state, prev) => {
      if (prev.dialog?.after === 'stepBack' && !state.dialog) this.mover.move(PLAYER, OPPOSITE[this.mover.facing(PLAYER)]);
    });
  }

  // the travel card only records a choice; the scene restarts the town
  private watchTravel() {
    return store.subscribe((state) => {
      const choice = state.travel?.choice;
      if (!choice) return;
      const { from } = this.request;
      store.getState().actions.setTravel(null);
      this.go(choice === 'back' && from ? from : this.request);
    });
  }

  private showTravelCard() {
    store.getState().actions.setTravel({ status: 'loading', town: this.request.town, progress: this.loadProgress, canGoBack: false, choice: null });
  }

  // drop the half-loaded keys so Retry fetches again; Back returns to the tile the player warped from
  private showTravelError() {
    const { town, from } = this.request;
    this.cache.tilemap.remove(`map-${town}`);
    if (this.textures.exists(`tiles-${town}`)) this.textures.remove(`tiles-${town}`);
    store.getState().actions.setTravel({ status: 'error', town, progress: 0, canGoBack: Boolean(from), choice: null });
  }
}
