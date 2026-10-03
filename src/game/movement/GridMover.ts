import type Phaser from 'phaser';
import { Direction, GridEngine, NoPathFoundStrategy } from 'grid-engine';
import type { WalkingAnimationMapping } from 'grid-engine';
import type { Dir } from '../world/save';

export interface Tile {
  x: number;
  y: number;
}

export interface CharOptions {
  speed: number;
  facing: Dir;
}

const TO_DIRECTION: Record<Dir, Direction> = {
  up: Direction.UP,
  down: Direction.DOWN,
  left: Direction.LEFT,
  right: Direction.RIGHT,
};

const FROM_DIRECTION: Partial<Record<Direction, Dir>> = {
  [Direction.UP]: 'up',
  [Direction.DOWN]: 'down',
  [Direction.LEFT]: 'left',
  [Direction.RIGHT]: 'right',
};

export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

// 4x4 sheet: columns are down, up, left, right; rows are idle, step, idle, step
const walkFrames = (column: number) => ({ standing: column, leftFoot: 4 + column, rightFoot: 12 + column });
const WALKING: WalkingAnimationMapping = {
  down: walkFrames(0),
  up: walkFrames(1),
  left: walkFrames(2),
  right: walkFrames(3),
};

// Phaser config entry that installs the plugin; the scene then carries it as `gridEngine`
export const movementPlugin = { key: 'gridEngine', plugin: GridEngine, mapping: 'gridEngine' };

// the only folder that knows the movement library: swap it for BFS + tweens if the library breaks
export class GridMover {
  private readonly engine: GridEngine;

  constructor(scene: Phaser.Scene) {
    this.engine = (scene as Phaser.Scene & { gridEngine: GridEngine }).gridEngine;
  }

  create(map: Phaser.Tilemaps.Tilemap) {
    this.engine.create(map, { characters: [] });
  }

  addChar(id: string, sprite: Phaser.GameObjects.Sprite, tile: Tile, options: CharOptions) {
    this.engine.addCharacter({
      id,
      sprite,
      walkingAnimationMapping: WALKING,
      startPosition: tile,
      speed: options.speed,
      facingDirection: TO_DIRECTION[options.facing],
    });
  }

  move(id: string, dir: Dir) {
    this.engine.move(id, TO_DIRECTION[dir]);
  }

  // a blocked or unreachable target walks to the closest reachable tile, which is how a tapped NPC gets approached
  moveTo(id: string, tile: Tile, onDone?: () => void) {
    this.engine.moveTo(id, tile, { noPathFoundStrategy: NoPathFoundStrategy.CLOSEST_REACHABLE }).subscribe(() => onDone?.());
  }

  stop(id: string) {
    this.engine.stopMovement(id);
  }

  facing(id: string): Dir {
    return FROM_DIRECTION[this.engine.getFacingDirection(id)] ?? 'down';
  }

  tileInFront(id: string): Tile {
    const { x, y } = this.engine.getFacingPosition(id);
    return { x, y };
  }

  onArrived(callback: (id: string, tile: Tile) => void) {
    const sub = this.engine.positionChangeFinished().subscribe(({ charId, enterTile }) => callback(charId, enterTile));
    return () => sub.unsubscribe();
  }

  position(id: string): Tile {
    const { x, y } = this.engine.getPosition(id);
    return { x, y };
  }

  isMoving(id: string) {
    return this.engine.isMoving(id);
  }

  // 0 to 1 of the way to the next tile
  progress(id: string) {
    return this.engine.getMovementProgress(id) / 1000;
  }

  setSpeed(id: string, speed: number) {
    this.engine.setSpeed(id, speed);
  }

  turn(id: string, dir: Dir) {
    this.engine.turnTowards(id, TO_DIRECTION[dir]);
  }

  place(id: string, tile: Tile, dir: Dir) {
    this.engine.stopMovement(id);
    this.engine.setPosition(id, tile);
    this.turn(id, dir);
  }

  charAt(tile: Tile) {
    return this.engine.getCharactersAt(tile)[0];
  }
}
