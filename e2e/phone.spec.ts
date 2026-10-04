import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { continueWith, press, savedWith, standAt, state, talkTo } from './helpers';
import { readTown } from './world';

// a portrait phone: coarse pointer, 390 x 844, every PanelShell panel is a full-screen sheet and the touch controls step aside
test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('pq.prefs.v1', JSON.stringify({ textSpeed: 4 }))));

const BADGES = ['badge.core', 'badge.design-system', 'badge.monorepo'];
const gear = readTown('gear');
const elite = readTown('elite');
const testmu = readTown('testmu');
const SHOTS = process.env.PHONE_SHOTS ? '.anbu/design/phone' : null;

async function proveSheet(page: Page, name: string, shot: string) {
  const sheet = ['Start menu', 'Options'].includes(name) ? page.locator('.pq-start') : page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  await expect(page.locator('.pq-touch')).toBeHidden();
  const box = await sheet.boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  // nothing needed to finish the panel hides below the fold
  const overflow = await sheet.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow, `${name} scrolls by ${overflow}px`).toBeLessThanOrEqual(0);
  // a label that wraps paints more than one line box
  const wrapped = await sheet.evaluate((el) =>
    [...el.querySelectorAll<HTMLElement>('dt, .pq-hof-counts li, .pq-badges li > :not(.pq-sr), .pq-mart-item span, .pq-note')]
      .filter((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size > 1 && !node.querySelector('small');
      })
      .map((node) => node.textContent),
  );
  expect(wrapped, `${name} wraps ${wrapped.join(' | ')}`).toEqual([]);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${shot}.png` });
}

const openFromMenu = async (page: Page, row: string) => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${row}`) }).click();
};

test.describe('portrait phone sheets', () => {
  test('the Start menu and the Options panel fill the screen and hide the controls', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { flags: BADGES, starter: 'react', playSeconds: 3725 }));
    await expect(page.locator('.pq-touch')).toBeVisible();
    await page.getByRole('button', { name: 'Menu' }).click();
    await proveSheet(page, 'Start menu', 'start-menu');
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await proveSheet(page, 'Options', 'options');
    await press(page, 'Escape');
    await press(page, 'Escape');
    await expect(page.locator('.pq-touch')).toBeVisible();
  });

  const dexes = [
    { row: 'Skilldex', name: 'Skilldex', shot: 'skilldex' },
    { row: 'Bugdex', name: 'Bugdex', shot: 'bugdex' },
    { row: 'Trainer Card', name: 'Trainer Card', shot: 'trainer-card' },
    { row: 'Bag', name: 'Bag', shot: 'bag' },
    { row: 'Recruiter Mode', name: 'Recruiter Mode', shot: 'recruiter-mode' },
  ];
  for (const { row, name, shot } of dexes) {
    test(`${name} is a full-screen sheet`, async ({ page }) => {
      await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { flags: BADGES, starter: 'react', caught: ['cors-error'], playSeconds: 3725 }));
      await openFromMenu(page, row);
      // the Recruiter Mode resume is long on purpose: it scrolls, so only its frame is checked
      if (row === 'Recruiter Mode') {
        const sheet = ['Start menu', 'Options'].includes(name) ? page.locator('.pq-start') : page.getByRole('dialog', { name });
        expect(await sheet.boundingBox()).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
        await expect(page.locator('.pq-touch')).toBeHidden();
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/${shot}.png` });
        return;
      }
      await proveSheet(page, name, shot);
    });
  }

  test('the Hall of Fame fits with Keep exploring in view', async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('devansh-out'), 'up', { flags: BADGES, starter: 'react', seen: ['agra.summary'] }));
    await standAt(page, elite.spawn('hall-in'), 'up');
    await proveSheet(page, 'Hall of Fame', 'hall-of-fame');
    await expect(page.getByRole('button', { name: 'Keep exploring' })).toBeInViewport({ ratio: 1 });
  });

  test('the Resume Mart fits', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('mart-in'), 'up', { starter: 'react' }));
    await talkTo(page, gear, 'clerk');
    await proveSheet(page, 'Resume Mart', 'resume-mart');
  });

  test('the Patch Center form is a full-screen sheet', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('patch-in'), 'up', { starter: 'react' }));
    await talkTo(page, gear, 'nurse');
    const contact = page.getByRole('dialog', { name: 'Patch Center' });
    await expect(contact).toBeVisible();
    await expect(page.locator('.pq-touch')).toBeHidden();
    expect(await contact.boundingBox()).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/contact.png` });
  });

  test('the KaneAI Robot prompt is a full-screen sheet', async ({ page }) => {
    await continueWith(page, savedWith('testmu', testmu.spawn('lobby-in'), 'up', { starter: 'react' }));
    await talkTo(page, testmu, 'guide-robot');
    await proveSheet(page, 'KaneAI Robot', 'ask');
    expect((await state(page)).panel).toBe('ask');
  });
});
