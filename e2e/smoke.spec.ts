import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { factById, facts, factId, project, summaryFactId } from '../src/content';
import { BUILT_TOWNS } from '../src/game/world/towns';
import { factObjects, readTown, roadDirection, standingSpot } from './world';

const state = (page: Page) => page.evaluate(() => window.__pq!.state());
const walk = (page: Page, dir: 'up' | 'down' | 'left' | 'right', tiles = 1) => page.evaluate(([d, n]) => window.__pq!.walk(d as 'up', n as number), [dir, tiles] as const);
const interact = (page: Page) => page.evaluate(() => window.__pq!.interact());

// one press may only finish the typewriter, so press until the line actually changes
async function nextLine(page: Page) {
  const line = page.getByTestId('dialog-text');
  const from = await line.textContent();
  await expect.poll(async () => {
    await interact(page);
    return line.textContent();
  }, { intervals: [150] }).not.toBe(from);
}

// a press may only finish the typewriter, so press again until no dialog is left
const closeDialog = (page: Page) =>
  expect.poll(async () => {
    if ((await state(page)).dialog) await interact(page);
    return (await state(page)).dialog;
  }, { message: 'dialog closes', intervals: [120] }).toBeNull();

test('title to bedroom PC, Mom, outside, and Continue after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Recruiter Mode' })).toHaveAttribute('href', '/resume/');
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  await page.getByRole('button', { name: 'New Game' }).click();

  // Professor intro: Next, then answer
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('menuitem', { name: 'Recruiter' }).click();
  await page.getByRole('menuitem', { name: 'Play anyway' }).click();
  await page.waitForFunction(() => window.__pq!.state().phase === 'play' && window.__pq!.state().pos.x > 0);

  const start = await state(page);
  expect(start).toMatchObject({ town: 'agra', mode: 'recruiter', pos: { x: 60, y: 3 }, facing: 'up' });

  // the bedroom PC prints the summary fact's short text
  await page.waitForTimeout(500);
  await interact(page);
  await expect(page.getByTestId('dialog-text')).toHaveText(factById.get(summaryFactId)!.short);
  expect((await state(page)).seen).toContain(summaryFactId);
  await closeDialog(page);

  // stairs down, then Mom
  await walk(page, 'down', 4);
  await walk(page, 'right', 3);
  await expect.poll(async () => (await state(page)).pos).toEqual({ x: 96, y: 2 });
  await walk(page, 'down', 2);
  await walk(page, 'left', 1);
  await interact(page);
  const line = page.getByTestId('dialog-text');
  await expect(line).toHaveText(factById.get(factId('gear.btech'))?.short ?? 'missing gear.btech');
  await nextLine(page);
  await expect(line).toHaveText('You got the Running Shoes! Hold B to run.');
  await closeDialog(page);
  expect((await state(page)).flags).toContain('shoes');

  // out the front door
  await walk(page, 'right', 1);
  await walk(page, 'down', 4);
  await walk(page, 'left', 2);
  await walk(page, 'down', 1);
  await expect.poll(async () => (await state(page)).pos).toEqual({ x: 7, y: 7 });

  // the debounced save lands, then Continue restores town, position, facing
  const before = await state(page);
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForFunction(() => window.__pq!.state().phase === 'play');
  await expect.poll(async () => (await state(page)).pos).toEqual(before.pos);
  expect(await state(page)).toMatchObject({ town: before.town, facing: before.facing, mode: 'recruiter' });

  expect(errors).toEqual([]);
});

const canvasRect = (page: Page) =>
  page.evaluate(() => {
    const r = document.querySelector('canvas')!.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, vw: window.innerWidth, vh: window.innerHeight };
  });

async function expectFillsWidth(page: Page) {
  await expect
    .poll(async () => {
      const r = await canvasRect(page);
      return { wide: r.width >= r.vw * 0.9, centerOff: Math.abs(r.x + r.width / 2 - r.vw / 2) <= 2 };
    })
    .toEqual({ wide: true, centerOff: true });
}

test.describe('phone layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });

  test('the game view fills the width and stays centered, also after a resize from desktop', async ({ page }) => {
    await page.goto('/?warp=agra');
    await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
    await expectFillsWidth(page);

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect.poll(async () => (await canvasRect(page)).width).toBeGreaterThan(600);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectFillsWidth(page);
    const hud = await page.locator('.pq-banner').boundingBox();
    const canvas = await canvasRect(page);
    expect(hud!.x).toBeGreaterThanOrEqual(canvas.x);
    expect(hud!.x + hud!.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  });

  test('tapping a tile walks there', async ({ page }) => {
    await page.goto('/?warp=agra');
    await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
    await page.waitForTimeout(500);
    const before = await state(page);
    // the PC sits at (44,2) and the player at (44,3): tap two tiles below the player
    const at = await page.evaluate(([x, y]) => window.__pq!.tileToClient(x!, y!), [before.pos.x, before.pos.y + 2]);
    await page.touchscreen.tap(at.x, at.y);
    await expect.poll(async () => (await state(page)).pos.y).toBeGreaterThan(before.pos.y);
  });
});

const SAVE = { v: 1, town: 'agra', pos: { x: 7, y: 7 }, facing: 'down', flags: [], seen: [], mode: 'curious', savedAt: '2026-10-03T10:00:00.000Z' };
const MAP_URL = '**/maps/agra.json';

test.describe('town loader', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((save) => localStorage.setItem('pq.save.v1', JSON.stringify(save)), SAVE);
  });

  async function pressContinue(page: Page) {
    await page.goto('/');
    await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
    await page.getByRole('button', { name: /Continue/ }).click();
  }

  test('a slow map shows the travel card, then clears when the town is ready', async ({ page }) => {
    await page.route(MAP_URL, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });
    await pressContinue(page);
    const card = page.getByTestId('travel-card');
    await expect(card).toContainText('Traveling to Agra...');
    await expect(card.getByRole('progressbar')).toBeVisible();
    await expect(card).toBeHidden({ timeout: 10_000 });
    await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
    expect((await state(page)).pos).toEqual({ x: 7, y: 7 });
  });

  test('a fast map never flashes the card', async ({ page }) => {
    // serve the map from memory so a busy dev server can't push the load past the 300 ms threshold
    await page.route(/\/(maps|assets)\//, (route) => route.fulfill({ body: readFileSync(`public${new URL(route.request().url()).pathname}`) }));
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.querySelector('[data-testid="travel-card"]')) (window as unknown as { sawCard: boolean }).sawCard = true;
      }).observe(document, { childList: true, subtree: true });
    });
    await pressContinue(page);
    await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
    expect(await page.evaluate(() => (window as unknown as { sawCard?: boolean }).sawCard ?? false)).toBe(false);
  });

  test('a failed map shows Retry, and Retry recovers once the network is back', async ({ page }) => {
    await page.route(MAP_URL, (route) => route.abort());
    await pressContinue(page);
    const card = page.getByTestId('travel-card');
    await expect(card).toContainText("Couldn't reach Agra. Try again");
    await expect(card.getByRole('menuitem', { name: 'Retry' })).toBeVisible();
    await page.unroute(MAP_URL);
    await card.getByRole('menuitem', { name: 'Retry' }).click();
    await expect(card).toBeHidden({ timeout: 10_000 });
    await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
  });
});

test('a failed preload asset shows the error and never Press Start', async ({ page }) => {
  await page.route('**/assets/ninja-adventure/mom-sheet.png', (route) => route.abort());
  await page.addInitScript(() => {
    const seen = window as unknown as { sawReady: boolean };
    new MutationObserver(() => {
      if (document.getElementById('strip')?.textContent?.includes('Press Start')) seen.sawReady = true;
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.goto('/');
  await expect(page.locator('#strip')).toHaveText(/could not load/, { timeout: 30_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('#strip')).not.toHaveText(/Press Start/);
  await expect(page.getByRole('button', { name: 'New Game' })).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { sawReady?: boolean }).sawReady ?? false)).toBe(false);
});

const TOWNS: readonly string[] = BUILT_TOWNS;
const warpTo = (page: Page, town: string, spawn?: string) => page.evaluate(([t, sp]) => window.__pq!.warp(t!, sp), [town, spawn]);
const waitAt = (page: Page, town: string, tile: { x: number; y: number }) =>
  expect.poll(async () => {
    const { town: at, pos } = await state(page);
    return { town: at, ...pos };
  }).toEqual({ town, ...tile });
const startAt = async (page: Page, query: string) => {
  await page.goto(query);
  await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);
};

test('a deep link lands on each built town default spawn, and a bad one falls back to the Title', async ({ page }) => {
  for (const town of TOWNS) {
    await startAt(page, `/?warp=${town}`);
    await waitAt(page, town, readTown(town).spawn('default'));
  }
  for (const bad of ['elite', 'patch-center', 'nowhere']) {
    await page.goto(`/?warp=${bad}`);
    await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
    expect((await state(page)).phase).toBe('title');
  }
});

test('each inter-town road can be walked both ways, and the last road is closed', async ({ page }) => {
  await startAt(page, '/?warp=agra');
  const pairs = [['agra', 'gear'], ['gear', 'junglee'], ['junglee', 'marrfa'], ['marrfa', 'testmu']] as const;
  for (const [a, b] of pairs) {
    const [mapA, mapB] = [readTown(a), readTown(b)];
    // the spawn named after a neighbor sits right before the road to it, and is where that road lands
    const [fromA, fromB] = [mapA.spawn(`${b}-road`), mapB.spawn(`${a}-road`)];
    await warpTo(page, a, `${b}-road`);
    await waitAt(page, a, fromA);
    await walk(page, roadDirection(mapA, fromA, b));
    await waitAt(page, b, fromB);
    await walk(page, roadDirection(mapB, fromB, a));
    await waitAt(page, a, fromA);
  }

  // Victory Road opens in Phase 4: the road says so and walks the player back
  const testmu = readTown('testmu');
  const road = testmu.objects.find((o) => o.props.to === 'elite')!;
  await warpTo(page, 'testmu');
  await waitAt(page, 'testmu', testmu.spawn('default'));
  const { tile: before, facing } = standingSpot(testmu, road);
  await page.evaluate(([x, y, f]) => window.__pq!.stand(x as number, y as number, f as 'up'), [before.x, before.y, facing]);
  await walk(page, facing);
  await expect(page.getByTestId('dialog-text')).toHaveText('Victory Road is not open yet.');
  await closeDialog(page);
  await expect.poll(async () => (await state(page)).pos).toEqual(before);
});

test('a building door leads into its room and back out', async ({ page }) => {
  await startAt(page, '/?warp=gear&spawn=library-door');
  const gear = readTown('gear');
  await waitAt(page, 'gear', gear.spawn('library-door'));
  await walk(page, 'up');
  await waitAt(page, 'gear', gear.spawn('library-in'));
  await walk(page, 'down');
  await waitAt(page, 'gear', gear.spawn('library-door'));
});

test('every fact-bearing object in every town shows its fact, and all facts get seen', async ({ page }) => {
  test.setTimeout(240_000);
  await startAt(page, '/?warp=agra');
  const shown = new Set<string>();
  for (const town of TOWNS) {
    const map = readTown(town);
    await warpTo(page, town);
    await waitAt(page, town, map.spawn('default'));
    for (const object of factObjects(map)) {
      const id = factId(object.props.factId!);
      const { tile, facing } = standingSpot(map, object);
      await page.evaluate(([x, y, f]) => window.__pq!.stand(x as number, y as number, f as 'up'), [tile.x, tile.y, facing]);
      const text = factById.get(id)!.short;
      // a press on a closed dialog opens it; polling re-presses only while nothing is open
      await expect.poll(async () => {
        const { dialog } = await state(page);
        if (!dialog) await interact(page);
        return dialog?.text;
      }, { message: `${town}/${object.name}`, intervals: [120] }).toBe(text);
      await expect(page.getByTestId('dialog-text')).toHaveText(text);
      expect((await state(page)).seen).toContain(id);
      shown.add(id);
      await closeDialog(page);
    }
  }
  expect([...shown].sort()).toEqual(facts.map((fact) => fact.id).sort());
  expect([...(await state(page)).seen].sort()).toEqual(facts.map((fact) => fact.id).sort());
});

test('the road from Agra shows the travel card while Gear City loads', async ({ page }) => {
  await page.route('**/maps/gear.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await startAt(page, '/?warp=agra');
  const agra = readTown('agra');
  await warpTo(page, 'agra', 'gear-road');
  await waitAt(page, 'agra', agra.spawn('gear-road'));
  await walk(page, 'right');
  const card = page.getByTestId('travel-card');
  await expect(card).toContainText('Traveling to Gear City...');
  await expect(card).toBeHidden({ timeout: 10_000 });
  await waitAt(page, 'gear', readTown('gear').spawn('agra-road'));
});

test.describe('Recruiter Mode in game', () => {
  test('opens from the Start menu over the paused game and Esc or Close returns to the same tile', async ({ page }) => {
    await startAt(page, '/?warp=gear');
    const before = await state(page);
    await page.keyboard.press('Enter');
    for (const close of ['Escape', 'Close']) {
      await page.getByRole('menuitem', { name: 'Recruiter Mode' }).click();
      const panel = page.getByRole('dialog', { name: 'Recruiter Mode' });
      await expect(panel).toContainText('Devansh Choudhary');
      await expect(panel).toContainText(factById.get(summaryFactId)!.short);
      await expect(panel.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', '/resume.pdf');
      // Tab stays inside the panel: Close, then the two links, then around
      await expect(panel.getByRole('button', { name: 'Close' })).toBeFocused();
      for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]')?.getAttribute('aria-label'))).toBe('Recruiter Mode');
      // Shift+Tab from outside the panel lands on the last item, the KoalaLab link
      await page.evaluate(() => (document.activeElement as HTMLElement).blur());
      await page.keyboard.press('Shift+Tab');
      await expect(panel.getByRole('link', { name: 'KoalaLab' })).toBeFocused();
      await expect(panel.getByRole('link', { name: 'KoalaLab' })).toHaveAttribute('href', project.url);
      await expect(panel).not.toContainText(/\d{3}\D{0,3}\d{3}\D{0,3}\d{4}/);
      await walk(page, 'left');
      expect((await state(page)).pos).toEqual(before.pos);
      if (close === 'Escape') await page.keyboard.press('Escape');
      else await panel.getByRole('button', { name: 'Close' }).click();
      await expect(panel).toBeHidden();
      expect(await state(page)).toMatchObject({ town: before.town, pos: before.pos, panel: 'menu' });
      await expect(page.getByRole('menuitem', { name: 'Save' })).toBeFocused();
    }
  });

  test('?mode=recruiter opens the panel after load', async ({ page }) => {
    await page.goto('/?mode=recruiter');
    const panel = page.getByRole('dialog', { name: 'Recruiter Mode' });
    await expect(panel).toContainText('Devansh Choudhary', { timeout: 30_000 });
    expect((await state(page)).panel).toBe('recruiter');
  });

  test('?mode=recruiter goes to the static resume when the engine fails', async ({ page }) => {
    await page.route('**/assets/ninja-adventure/mom-sheet.png', (route) => route.abort());
    await page.goto('/?mode=recruiter');
    await expect(page).toHaveURL(/\/resume\/$/, { timeout: 30_000 });
  });
});
