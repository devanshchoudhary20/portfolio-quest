import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { BUILT_TOWNS } from '../src/game/world/towns';
import { standingSpot } from './world';
import type { MapObject, TownMap } from './world';

export const state = (page: Page) => page.evaluate(() => window.__pq!.state());
export const walk = (page: Page, dir: 'up' | 'down' | 'left' | 'right', tiles = 1) => page.evaluate(([d, n]) => window.__pq!.walk(d as 'up', n as number), [dir, tiles] as const);
export const interact = (page: Page) => page.evaluate(() => window.__pq!.interact());

// one press may only finish the typewriter, so press until the line actually changes
export async function nextLine(page: Page) {
  const line = page.getByTestId('dialog-text');
  const from = await line.textContent();
  await expect.poll(async () => {
    await interact(page);
    return line.textContent();
  }, { intervals: [150] }).not.toBe(from);
}

// a press may only finish the typewriter, so press again until no dialog is left
export const closeDialog = (page: Page) =>
  expect.poll(async () => {
    if ((await state(page)).dialog) await interact(page);
    return (await state(page)).dialog;
  }, { message: 'dialog closes', intervals: [120] }).toBeNull();

// a gym leader's fact ends in a fight; Esc runs from the move grid and Z reads the lines, until the map is back
export const runFromBattle = (page: Page) =>
  expect.poll(async () => {
    const { battle } = await state(page);
    if (battle) await page.keyboard.press(battle.pending ? 'z' : 'Escape', { delay: 70 });
    return battle;
  }, { message: 'battle ends', intervals: [120], timeout: 45_000 }).toBeNull();

export const TOWNS: readonly string[] = BUILT_TOWNS;
export const warpTo = (page: Page, town: string, spawn?: string) => page.evaluate(([t, sp]) => window.__pq!.warp(t!, sp), [town, spawn]);
export const waitAt = (page: Page, town: string, tile: { x: number; y: number }, timeout = 5000) =>
  expect.poll(async () => {
    const { town: at, pos } = await state(page);
    return { town: at, ...pos };
  }, { timeout }).toEqual({ town, ...tile });
export const startAt = async (page: Page, query: string) => {
  await page.goto(query);
  await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
};

export type Facing = 'up' | 'down' | 'left' | 'right';
export const standAt = (page: Page, tile: { x: number; y: number }, facing: Facing) =>
  page.evaluate(([x, y, f]) => window.__pq!.stand(x as number, y as number, f as 'up'), [tile.x, tile.y, facing] as const);
export const flagsOf = async (page: Page) => (await state(page)).flags as string[];
export const mazeInfo = (page: Page) => page.evaluate(() => window.__pq!.maze());
export const named = (map: TownMap, name: string): MapObject => {
  const found = map.objects.find((o) => o.name === name);
  if (!found) throw new Error(`no object ${name} in ${map.name}`);
  return found;
};

// every line of the dialog that is open now, pressing A until it closes
export async function readDialog(page: Page): Promise<string[]> {
  const lines: string[] = [];
  for (let open = (await state(page)).dialog; open; open = (await state(page)).dialog) {
    lines.push(open.text);
    await expect.poll(async () => {
      const now = (await state(page)).dialog;
      if (now?.text === open.text) await interact(page);
      return now?.text !== open.text;
    }, { intervals: [120] }).toBe(true);
  }
  return lines;
}

// stand beside an object, press A until its dialog opens, and return every line it said
export async function talkTo(page: Page, map: TownMap, name: string): Promise<string[]> {
  const { tile, facing } = standingSpot(map, named(map, name));
  await standAt(page, tile, facing);
  await expect.poll(async () => {
    const { dialog } = await state(page);
    if (!dialog) await interact(page);
    return dialog?.text;
  }, { message: `${map.name}/${name}`, intervals: [120] }).toBeTruthy();
  return readDialog(page);
}

export async function continueWith(page: Page, save: object) {
  await page.addInitScript((value) => localStorage.setItem('pq.save.v1', JSON.stringify(value)), save);
  await page.goto('/');
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
}

export const savedAt = (town: string, pos: { x: number; y: number }, facing: Facing, seen: string[] = []) => ({
  v: 1, town, pos, facing, flags: [], seen, mode: 'curious', savedAt: '2026-10-03T10:00:00.000Z',
});


type Rgb = [number, number, number];

// the average colour of a 4 x 4 patch of the canvas at the centre of a tile, read from a real screenshot
export async function tileColor(page: Page, tile: { x: number; y: number }): Promise<Rgb> {
  const at = await page.evaluate(([x, y]) => window.__pq!.tileToClient(x!, y!), [tile.x, tile.y]);
  const png = PNG.sync.read(await page.screenshot({ clip: { x: Math.round(at.x) - 2, y: Math.round(at.y) - 2, width: 4, height: 4 } }));
  const sum: Rgb = [0, 0, 0];
  for (let i = 0; i < png.data.length; i += 4) for (let c = 0; c < 3; c++) sum[c] = sum[c]! + png.data[i + c]!;
  const pixels = png.data.length / 4;
  return [sum[0]! / pixels, sum[1]! / pixels, sum[2]! / pixels];
}

export const colorGap = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const parseTile = (id: string) => {
  const [x = 0, y = 0] = id.split(',').map(Number);
  return { x, y };
};

// an open, decor-free floor tile of the maze room that no wall and no flag covers right now
const PLAIN_FLOOR = ['92,8', '93,8', '91,7', '92,6', '93,6', '91,5', '92,5'];
export const plainFloor = (info: { walls: string[]; flag: { x: number; y: number } | null }) => {
  const flag = info.flag ? `${info.flag.x},${info.flag.y}` : '';
  return parseTile(PLAIN_FLOOR.find((id) => !info.walls.includes(id) && id !== flag) ?? PLAIN_FLOOR[0]!);
};

export type Battle = NonNullable<Awaited<ReturnType<typeof state>>['battle']>;

// keys are held 70 ms so Phaser and React both see them
export const press = (page: Page, key: string) => page.keyboard.press(key, { delay: 70 });

// plays a battle with the keyboard: Z on every queued line and on the first move; returns every line shown and the last snapshot
export async function fight(page: Page, stop: (battle: Battle) => boolean = () => false) {
  const lines: string[] = [];
  let last: Battle | null = null;
  await expect
    .poll(
      async () => {
        const { battle } = await state(page);
        if (!battle) return 'closed';
        last = battle;
        if (lines.at(-1) !== battle.line) lines.push(battle.line);
        if (stop(battle)) return 'stopped';
        await press(page, 'z');
        return 'playing';
      },
      { intervals: [100], timeout: 60_000 },
    )
    .not.toBe('playing')
    .catch((error: Error) => {
      throw new Error(`${error.message}\nlast battle: ${JSON.stringify(last)}\nlines: ${JSON.stringify(lines)}`);
    });
  return { lines, last: last as Battle | null };
}

// presses Z until the opening lines are spent and the move grid is up
export const reachMoves = (page: Page) =>
  expect
    .poll(
      async () => {
        const { battle } = await state(page);
        if (battle?.pending) await press(page, 'z');
        return battle?.pending;
      },
      { intervals: [100] },
    )
    .toBe(false);

export const storedSave = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('pq.save.v1') ?? 'null') as { starter?: string; caught: string[]; flags: string[]; playSeconds?: number } | null);

// a save that holds flags and a starter, at a tile of a town
export const savedWith = (town: string, pos: { x: number; y: number }, facing: Facing, extra: object) => ({ ...savedAt(town, pos, facing), ...extra });

export type BattlePart = 'bg' | 'enemy' | 'player' | 'trainer';

// the share of a battle part's pixels that change when the part is hidden: proof the canvas really draws it
export async function drawnShare(page: Page, part: BattlePart) {
  const rect = await page.evaluate((p) => window.__pq!.battlePart(p), part);
  // the scene may not have built the part yet; callers poll
  if (!rect) return 0;
  // the top of the part: the message box covers the foot of the player's sprite and the info boxes cover the sides of the background
  const clip = part === 'bg'
    ? { x: rect.x + rect.width * 0.4, y: rect.y + rect.height * 0.02, width: rect.width * 0.2, height: rect.height * 0.12 }
    : { x: rect.x, y: rect.y, width: rect.width, height: rect.height * 0.6 };
  const shoot = async () => PNG.sync.read(await page.screenshot({ clip }));
  const on = await shoot();
  await page.evaluate((p) => window.__pq!.battlePart(p, false), part);
  const off = await shoot();
  await page.evaluate((p) => window.__pq!.battlePart(p, true), part);
  let changed = 0;
  for (let i = 0; i < on.data.length; i += 4) {
    if (Math.abs(on.data[i]! - off.data[i]!) + Math.abs(on.data[i + 1]! - off.data[i + 1]!) + Math.abs(on.data[i + 2]! - off.data[i + 2]!) > 40) changed++;
  }
  return changed / (on.data.length / 4);
}
