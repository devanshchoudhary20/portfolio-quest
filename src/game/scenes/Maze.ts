import type Phaser from 'phaser';
import type { GridMover, Tile } from '../movement/GridMover';
import { cellKey, generateWalls, mulberry32 } from '../world/maze';
import type { Cell } from '../world/maze';
import type { WorldObject } from '../world/objects';
import { inRegion } from '../world/regions';
import type { Region } from '../world/regions';
import { store } from '../../state/store';

const TILE = 16;
const REWRITE_MS = 3000;
const SHIMMER_MS = 220;
const WALL_FRAME = 0;
const FLAG_FRAME = 1;
// whole numbers only: a fractional depth drew the walls under the tile layers
const WALL_DEPTH = 0;
const NEIGHBORS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

// the authoring-cursor floor: an "LLM" rewrites the walls every few seconds while the player's flag stays put
export class Maze {
  private readonly rng = mulberry32(Date.now());
  private readonly walls = new Map<string, Phaser.GameObjects.Image>();
  private readonly floor: Cell[];
  private flag: { tile: Tile; sprite: Phaser.GameObjects.Image; since: number } | null = null;
  private total = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly mover: GridMover,
    private readonly region: Region,
    private readonly objects: WorldObject[],
    private readonly player: string,
  ) {
    const tiles: Cell[] = [];
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) if (!this.solid({ x, y })) tiles.push({ x, y });
    }
    // an NPC cannot be walked through, so its tile is no part of the floor the walls must keep connected
    this.floor = tiles;
    scene.time.addEvent({ delay: REWRITE_MS, loop: true, callback: () => this.rewrite() });
  }

  private solid(cell: Cell) {
    return this.mover.tileBlocked(cell) || this.objects.some((o) => o.kind === 'npc' && o.x === cell.x && o.y === cell.y);
  }

  // the first walls stand the moment the player walks in
  enter(tile: Tile) {
    if (this.total === 0 && inRegion(this.region, tile)) this.rewrite();
  }

  info() {
    return { rewrites: this.total, walls: [...this.walls.keys()].sort(), flag: this.flag?.tile ?? null, survived: this.survived() };
  }

  survived() {
    return this.flag ? this.total - this.flag.since : 0;
  }

  isFlag(tile: Tile) {
    return this.flag?.tile.x === tile.x && this.flag.tile.y === tile.y;
  }

  isWall(tile: Tile) {
    return this.walls.has(cellKey(tile));
  }

  // true when the tile in front was open maze floor and now holds the flag
  plant(tile: Tile): boolean {
    const id = cellKey(tile);
    const free = this.floor.some((cell) => cellKey(cell) === id) && !this.walls.has(id) && !this.objects.some((o) => cellKey(o) === id);
    const here = this.mover.position(this.player);
    if (!free || (here.x === tile.x && here.y === tile.y)) return false;
    this.flag?.sprite.destroy();
    const sprite = this.scene.add.image(tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2, 'maze', FLAG_FRAME).setDepth(WALL_DEPTH);
    this.flag = { tile: { x: tile.x, y: tile.y }, sprite, since: this.total };
    if (!store.getState().reducedMotion) this.scene.tweens.add({ targets: sprite, scale: { from: 0.2, to: 1 }, duration: SHIMMER_MS });
    return true;
  }

  // everything a wall must never cover: the player and the tile ahead, NPCs, warps, spawns, objects, the flag, and the open tiles beside an NPC or an object on solid terrain
  private keep(): Cell[] {
    const here = this.mover.position(this.player);
    const ahead = this.mover.tileInFront(this.player);
    const onObjects = this.objects.map((o): Cell => ({ x: o.x, y: o.y }));
    const beside = onObjects
      .filter((cell) => this.solid(cell))
      .flatMap((cell) => NEIGHBORS.map((n) => ({ x: cell.x + n.x, y: cell.y + n.y })));
    const all = [here, ahead, ...onObjects, ...beside, ...(this.flag ? [this.flag.tile] : [])];
    const open = new Set(this.floor.map(cellKey));
    return all.filter((cell) => open.has(cellKey(cell)));
  }

  private rewrite() {
    const here = this.mover.position(this.player);
    if (!inRegion(this.region, here)) return;
    const keep = this.keep();
    const next = generateWalls({ floor: this.floor, keep, linked: keep }, this.rng);
    const nextIds = new Set(next.map(cellKey));
    const calm = store.getState().reducedMotion;
    for (const [id, sprite] of this.walls) {
      if (nextIds.has(id)) continue;
      this.mover.remove(`wall:${id}`);
      this.fadeOut(sprite, calm);
      this.walls.delete(id);
    }
    for (const cell of next) {
      const id = cellKey(cell);
      if (this.walls.has(id)) continue;
      this.mover.addBlocker(`wall:${id}`, cell);
      const sprite = this.scene.add.image(cell.x * TILE + TILE / 2, cell.y * TILE + TILE / 2, 'maze', WALL_FRAME).setDepth(WALL_DEPTH);
      if (!calm) this.scene.tweens.add({ targets: sprite, alpha: { from: 0.2, to: 1 }, duration: SHIMMER_MS });
      this.walls.set(id, sprite);
    }
    this.total += 1;
  }

  private fadeOut(sprite: Phaser.GameObjects.Image, calm: boolean) {
    if (calm) sprite.destroy();
    else this.scene.tweens.add({ targets: sprite, alpha: 0, duration: SHIMMER_MS, onComplete: () => sprite.destroy() });
  }
}
