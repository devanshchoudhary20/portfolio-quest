import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { savedWith } from './helpers';
import { readTown } from './world';

// holds the game chunk back until the test releases it
async function holdGameChunk(page: Page, outcome: 'load' | 'fail' = 'load') {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/src/game/main.ts*', async (route) => {
    await gate;
    await (outcome === 'load' ? route.continue() : route.abort());
  });
  return release;
}

const newGame = (page: Page) => page.getByRole('button', { name: 'New Game' });
const phase = (page: Page) => page.evaluate(() => window.__pq?.state().phase ?? 'no-engine');

test('New Game can be pressed while the engine loads, shows the progress, and starts when it is ready', async ({ page }) => {
  const release = await holdGameChunk(page);
  await page.goto('/');
  await expect(newGame(page)).toBeEnabled();
  await expect(page.getByRole('link', { name: /Recruiter Mode/ })).toBeVisible();
  await newGame(page).click();
  await expect(newGame(page)).toHaveClass(/queued/);
  await expect(newGame(page)).toContainText(/The world is loading\.\.\. \d+%/);
  await expect(page.locator('#strip')).toContainText('The world is loading...');
  // the percent climbs while the chunk is held, so the loader ran and still did not start the game
  await expect(newGame(page)).toContainText(/\.\.\. [1-9]\d*%/);
  expect(await phase(page)).toBe('no-engine');
  release();
  await page.waitForFunction(() => window.__pq?.state().phase === 'intro', undefined, { timeout: 30_000 });
  await expect(newGame(page)).toBeHidden();
});

test('Esc or a second press cancels the queued start', async ({ page }) => {
  const release = await holdGameChunk(page);
  await page.goto('/');
  await newGame(page).click();
  await expect(newGame(page)).toHaveClass(/queued/);
  await newGame(page).click();
  await expect(newGame(page)).not.toHaveClass(/queued/);
  await newGame(page).click();
  await expect(newGame(page)).toHaveClass(/queued/);
  await page.keyboard.press('Escape');
  await expect(newGame(page)).not.toHaveClass(/queued/);
  release();
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  expect(await phase(page)).toBe('title');
});

test('a queued start shows the error instead of starting when the engine fails', async ({ page }) => {
  const fail = await holdGameChunk(page, 'fail');
  await page.goto('/');
  await newGame(page).click();
  await expect(newGame(page)).toHaveClass(/queued/);
  fail();
  await expect(page.locator('#strip')).toHaveText(/could not load/, { timeout: 30_000 });
  await expect(newGame(page)).toBeDisabled();
  await expect(newGame(page)).not.toHaveClass(/queued/);
  expect(await phase(page)).toBe('no-engine');
});

test('Skip to the resume and Recruiter Mode work while the engine loads', async ({ page }) => {
  const release = await holdGameChunk(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Recruiter Mode/ })).toHaveAttribute('href', '/resume/');
  await expect(page.getByRole('link', { name: 'Skip to resume' })).toHaveAttribute('href', '/resume/');
  release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('a queued Continue with ?warp= starts once and keeps the save', async ({ page }) => {
  const gear = readTown('gear');
  const save = savedWith('gear', gear.spawn('default'), 'down', { starter: 'react' });
  await page.addInitScript((value) => localStorage.setItem('pq.save.v1', JSON.stringify(value)), save);
  const release = await holdGameChunk(page);
  await page.goto('/?warp=agra');
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByRole('button', { name: /Continue/ })).toHaveClass(/queued/);
  release();
  await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0, undefined, { timeout: 30_000 });
  const now = await page.evaluate(() => window.__pq!.state());
  expect(now.town).toBe('gear');
  // a second start through the warp would reset the loaded save to a fresh one
  expect(now.starter).toBe('react');
});
