import { describe, expect, it } from 'vitest';
import { cellKey, generateWalls, mulberry32, stillLinked } from './maze';
import type { Cell, MazeInput } from './maze';

// the tower's first floor: 9 x 7 open tiles, a warp in each lower and upper corner, one NPC
const FLOOR: Cell[] = Array.from({ length: 63 }, (_, i) => ({ x: 87 + (i % 9), y: 3 + Math.floor(i / 9) }));
const WARPS: Cell[] = [
  { x: 87, y: 9 },
  { x: 88, y: 9 },
  { x: 95, y: 3 },
  { x: 95, y: 4 },
];
const NPCS: Cell[] = [{ x: 91, y: 3 }];

function layout(player: Cell, flag: Cell | null): MazeInput {
  const keep = [player, ...(flag ? [flag] : []), ...WARPS, ...NPCS];
  return { floor: FLOOR, keep, linked: keep };
}

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const pick = (rng: () => number) => FLOOR[Math.floor(rng() * FLOOR.length)]!;

describe('generateWalls', () => {
  it('is the same walls for the same seed', () => {
    const input = layout({ x: 90, y: 6 }, null);
    expect(generateWalls(input, mulberry32(7))).toEqual(generateWalls(input, mulberry32(7)));
  });

  it('really builds walls, and different seeds build different mazes', () => {
    const input = layout({ x: 90, y: 6 }, null);
    const mazes = SEEDS.slice(0, 20).map((seed) => generateWalls(input, mulberry32(seed)).map(cellKey).sort().join('|'));
    expect(new Set(mazes).size).toBeGreaterThan(10);
    expect(generateWalls(input, mulberry32(1)).length).toBeGreaterThan(8);
  });

  it('never walls the player, an NPC, a warp, a spawn or the flag, over 300 seeds and random positions', () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed * 31);
      const input = layout(pick(rng), pick(rng));
      const walls = new Set(generateWalls(input, mulberry32(seed)).map(cellKey));
      for (const cell of input.keep) expect(walls.has(cellKey(cell)), `seed ${seed} walled ${cellKey(cell)}`).toBe(false);
    }
  });

  it('keeps the player, the flag, the entrance and every warp mutually reachable, over 300 seeds', () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed * 17);
      const input = layout(pick(rng), pick(rng));
      const walls = new Set(generateWalls(input, mulberry32(seed)).map(cellKey));
      expect(stillLinked(FLOOR, walls, input.linked), `seed ${seed}`).toBe(true);
    }
  });

  it('survives repeated rewrites around one flag', () => {
    const flag = { x: 91, y: 6 };
    const rng = mulberry32(99);
    for (let rewrite = 0; rewrite < 200; rewrite++) {
      const input = layout({ x: 89, y: 5 }, flag);
      const walls = new Set(generateWalls(input, rng).map(cellKey));
      expect(walls.has(cellKey(flag))).toBe(false);
      expect(stillLinked(FLOOR, walls, input.linked)).toBe(true);
    }
  });

  it('builds nothing when every tile is protected', () => {
    expect(generateWalls({ floor: FLOOR, keep: FLOOR, linked: FLOOR }, mulberry32(3))).toEqual([]);
  });
});

describe('generateWalls around an NPC', () => {
  // the NPC tile is no floor (nobody walks through it), so the walls must keep its neighbours linked some other way
  const npc: Cell = { x: 91, y: 6 };
  const floor = FLOOR.filter((cell) => cellKey(cell) !== cellKey(npc));
  const beside = [{ x: 90, y: 6 }, { x: 92, y: 6 }, { x: 91, y: 5 }, { x: 91, y: 7 }];

  it('keeps everything linked without walking through the NPC, over 300 seeds', () => {
    for (const seed of SEEDS) {
      const keep = [{ x: 88, y: 9 }, { x: 95, y: 3 }, ...beside];
      const walls = new Set(generateWalls({ floor, keep, linked: keep }, mulberry32(seed)).map(cellKey));
      expect(walls.has(cellKey(npc)), `seed ${seed}`).toBe(false);
      expect(stillLinked(floor, walls, keep), `seed ${seed}`).toBe(true);
    }
  });
});

describe('stillLinked', () => {
  it('detects a wall that splits the floor', () => {
    const floor: Cell[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    expect(stillLinked(floor, new Set(['1,0']), [{ x: 0, y: 0 }, { x: 2, y: 0 }])).toBe(false);
    expect(stillLinked(floor, new Set(), [{ x: 0, y: 0 }, { x: 2, y: 0 }])).toBe(true);
  });
});
