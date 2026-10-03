export interface Cell {
  x: number;
  y: number;
}

export interface MazeInput {
  // every tile of the maze area the terrain leaves open
  floor: Cell[];
  // tiles that never take a wall: the player, NPCs, warps, spawns, objects and the planted flag
  keep: Cell[];
  // tiles that must stay mutually reachable once the walls stand
  linked: Cell[];
}

export type Rng = () => number;

const STEPS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];
// share of the free tiles that turn into wall
const DENSITY = 0.3;
const MAX_SEGMENT = 4;
const MAX_TRIES = 120;

export const cellKey = (cell: Cell) => `${cell.x},${cell.y}`;

// small seeded generator so a rewrite is reproducible in tests
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// true while every linked tile can walk to every other without crossing a wall
export function stillLinked(floor: Cell[], walls: ReadonlySet<string>, linked: Cell[]): boolean {
  const first = linked[0];
  if (!first) return true;
  const open = new Set(floor.map(cellKey).filter((id) => !walls.has(id)));
  const seen = new Set([cellKey(first)]);
  const queue = [first];
  for (let cell = queue.shift(); cell; cell = queue.shift()) {
    for (const step of STEPS) {
      const next = { x: cell.x + step.x, y: cell.y + step.y };
      const id = cellKey(next);
      if (!open.has(id) || seen.has(id)) continue;
      seen.add(id);
      queue.push(next);
    }
  }
  return linked.every((cell) => seen.has(cellKey(cell)));
}

// the "LLM rewrite": random wall segments, each tile kept only if the BFS says everything linked still connects, otherwise the tile is skipped and another segment is tried
export function generateWalls({ floor, keep, linked }: MazeInput, rng: Rng): Cell[] {
  const protectedIds = new Set(keep.map(cellKey));
  const free = floor.filter((cell) => !protectedIds.has(cellKey(cell)));
  const target = Math.floor(free.length * DENSITY);
  const walls = new Set<string>();
  const placed: Cell[] = [];
  const open = new Set(floor.map(cellKey));
  for (let tries = 0; tries < MAX_TRIES && placed.length < target && free.length > 0; tries++) {
    const start = free[Math.floor(rng() * free.length)]!;
    const step = STEPS[Math.floor(rng() * STEPS.length)]!;
    const length = 2 + Math.floor(rng() * (MAX_SEGMENT - 1));
    for (let i = 0; i < length && placed.length < target; i++) {
      const cell = { x: start.x + step.x * i, y: start.y + step.y * i };
      const id = cellKey(cell);
      if (!open.has(id) || protectedIds.has(id) || walls.has(id)) continue;
      walls.add(id);
      if (stillLinked(floor, walls, linked)) placed.push(cell);
      else walls.delete(id);
    }
  }
  return placed;
}
