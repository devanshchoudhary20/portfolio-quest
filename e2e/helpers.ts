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
