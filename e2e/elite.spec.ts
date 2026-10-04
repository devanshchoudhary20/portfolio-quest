import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { facts, factById, factId, profile, skillGroups } from '../src/content';
import { CATCHABLE } from '../src/game/battle/data';
import { TURN_CAP } from '../src/game/battle/engine';
import { CHAMPION_DEFEATED, PDF_FAILED } from '../src/game/world/lines';
import { resumePdfName } from '../src/resume/view';
import { closeDialog, continueWith, drawnShare, fight, named, press, readDialog, savedWith, standAt, state, storedSave, talkTo, waitAt, walk } from './helpers';
import { readTown } from './world';

// instant text: a fight is dozens of lines, and a typewriter on a busy machine turns each one into seconds
test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('pq.prefs.v1', JSON.stringify({ textSpeed: 4 }))));

const ELITE = ['dsa', 'machine-coding', 'system-design', 'behavioral', 'devansh'] as const;
const BADGES = ['badge.core', 'badge.design-system', 'badge.monorepo'];
const elite = readTown('elite');
const gear = readTown('gear');

const openFromMenu = async (page: Page, row: string) => {
  await press(page, 'Enter');
  await page.getByRole('menuitem', { name: row }).click();
};

test.describe('Victory Road', () => {
  test('stays shut at two badges with the line, and opens at three', async ({ page }) => {
    await continueWith(page, savedWith('testmu', { x: 28, y: 34 }, 'down', { flags: BADGES.slice(0, 2), starter: 'react' }));
    await walk(page, 'down');
    await expect(page.getByTestId('dialog-text')).toHaveText('Victory Road needs 3 badges. You have 2.');
    await closeDialog(page);
    expect((await state(page)).town).toBe('testmu');
  });

  test('opens at any three badges', async ({ page }) => {
    await continueWith(page, savedWith('testmu', { x: 28, y: 34 }, 'down', { flags: BADGES, starter: 'react' }));
    expect((await state(page)).flags).toContain('badges.3');
    await walk(page, 'down');
    await waitAt(page, 'elite', elite.spawn('testmu-road'));
    // and the road leads back
    await standAt(page, elite.spawn('testmu-road'), 'left');
    await walk(page, 'left');
    await waitAt(page, 'testmu', readTown('testmu').spawn('elite-road'));
  });
});

test('the Elite Four fall in order, the Champion opens the Hall of Fame, and its counts and links are right', async ({ page }) => {
  test.setTimeout(300_000);
  const caught = CATCHABLE.slice(0, 2);
  await continueWith(page, savedWith('elite', elite.spawn('default'), 'right', { flags: BADGES, starter: 'react', caught }));

  // the first door of the corridor
  await standAt(page, elite.spawn('dsa-door'), 'right');
  await walk(page, 'right');
  await waitAt(page, 'elite', elite.spawn('dsa-in'));

  for (const [i, id] of ELITE.entries()) {
    const below = elite.spawn(`${id}-out`);
    const next = i + 1 < ELITE.length ? `${ELITE[i + 1]}-in` : 'hall-in';
    // the gate holds until this trainer is beaten
    await standAt(page, below, 'up');
    await walk(page, 'up');
    expect((await state(page)).pos, `${id} gate is shut`).toEqual(below);
    expect((await state(page)).flags).not.toContain(`beaten.${id}`);

    const spoken = await talkTo(page, elite, id);
    expect(spoken).toEqual([factById.get(factId(named(elite, id).props.factId!))!.short]);
    await expect(page.getByTestId('battle')).toBeVisible();
    const { lines, last } = await fight(page);
    expect(last).toMatchObject({ phase: 'won' });
    if (id === 'devansh') expect(lines).toContain(CHAMPION_DEFEATED);
    expect((await state(page)).flags).toContain(`beaten.${id}`);
    // an Elite Four win awards no badge
    expect((await state(page)).flags.filter((flag) => flag.startsWith('badge.'))).toEqual(BADGES);

    await standAt(page, below, 'up');
    await walk(page, 'up', 2);
    await waitAt(page, 'elite', elite.spawn(next));
  }

  const hall = page.getByRole('dialog', { name: 'Hall of Fame' });
  await expect(hall).toBeVisible();
  const { seen, flags } = await state(page);
  const badges = flags.filter((flag) => flag.startsWith('badge.')).length;
  await expect(page.getByTestId('hof-counts')).toHaveText(`Facts seen ${seen.length} / ${facts.length}Badges ${badges} / ${skillGroups.length}Bugs caught ${caught.length} / ${CATCHABLE.length}`);
  await expect(hall.getByRole('img', { name: 'Devansh Choudhary' })).toBeVisible();
  await expect(hall.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', `mailto:${profile.email}`);
  await expect(hall.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.linkedin);
  const pdf = hall.getByRole('link', { name: 'Download PDF' });
  await expect(pdf).toHaveAttribute('href', '/resume.pdf');
  await expect(pdf).toHaveAttribute('download', resumePdfName);
  const [download] = await Promise.all([page.waitForEvent('download'), pdf.click()]);
  expect(new URL(download.url()).pathname).toBe('/resume.pdf');
  await expect(hall.getByRole('button')).toHaveText(['Send a message', 'Keep exploring']);

  await hall.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(hall).toBeHidden();
  expect((await state(page)).panel).toBe('none');
});

test.describe('Hall of Fame entry', () => {
  test('a save that loads inside the room stays closed, and walking back in opens it once per entry', async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('hall-in'), 'up', { flags: BADGES, starter: 'react' }));
    await page.waitForTimeout(500);
    expect((await state(page)).panel).toBe('none');
    await standAt(page, elite.spawn('devansh-out'), 'up');
    expect((await state(page)).panel).toBe('none');
    await standAt(page, elite.spawn('hall-in'), 'up');
    await expect(page.getByRole('dialog', { name: 'Hall of Fame' })).toBeVisible();
    await page.keyboard.press('Escape');
    await standAt(page, elite.spawn('hall-in'), 'up');
    expect((await state(page)).panel).toBe('none');
  });

  test('the dialog opens with focus on Email me and Tab stays inside', async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('devansh-out'), 'up', { flags: BADGES, starter: 'react' }));
    await standAt(page, elite.spawn('hall-in'), 'up');
    const hall = page.getByRole('dialog', { name: 'Hall of Fame' });
    await expect(hall.getByRole('link', { name: 'Email me' })).toBeFocused();
    for (let i = 0; i < 6; i++) {
      await press(page, 'Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]')?.getAttribute('aria-label'))).toBe('Hall of Fame');
    }
  });
});

test.describe('HUD place label', () => {
  const rooms = [
    { map: elite, spawn: 'default', label: 'Victory Road' },
    { map: elite, spawn: 'dsa-in', label: 'DSA Room' },
    { map: elite, spawn: 'machine-coding-in', label: 'Machine Coding Room' },
    { map: elite, spawn: 'system-design-in', label: 'System Design Room' },
    { map: elite, spawn: 'behavioral-in', label: 'Behavioral Room' },
    { map: elite, spawn: 'devansh-in', label: "Champion's Room" },
    { map: gear, spawn: 'default', label: 'Gear City' },
    { map: gear, spawn: 'mart-in', label: 'Resume Mart' },
    { map: gear, spawn: 'patch-in', label: 'Patch Center' },
    { map: gear, spawn: 'gym-in', label: 'Core Gym' },
    { map: gear, spawn: 'library-in', label: 'Gear City' },
  ];
  for (const { map, spawn, label } of rooms) {
    test(`${map.name} ${spawn} reads ${label}`, async ({ page }) => {
      await continueWith(page, savedWith(map.name, map.spawn(spawn), 'up', { flags: BADGES, starter: 'react' }));
      await expect(page.locator('.pq-banner')).toHaveText(label);
    });
  }

  test('the Hall of Fame room reads Hall of Fame', async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('hall-in'), 'up', { flags: BADGES, starter: 'react' }));
    await expect(page.locator('.pq-banner')).toHaveText('Hall of Fame');
  });
});

for (const starter of ['node', 'claude'] as const) {
  test(`a ${starter} starter beats the Champion within the turn cap`, async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('devansh-in'), 'up', { flags: BADGES, starter }));
    await talkTo(page, elite, 'devansh');
    const { lines, last } = await fight(page);
    expect(last).toMatchObject({ phase: 'won' });
    expect(last!.turn).toBeLessThanOrEqual(TURN_CAP);
    expect(lines).toContain(CHAMPION_DEFEATED);
  });
}

test('the elite background and the Champion sprite are drawn', async ({ page }) => {
  await continueWith(page, savedWith('elite', elite.spawn('devansh-in'), 'up', { flags: BADGES, starter: 'react' }));
  await talkTo(page, elite, 'devansh');
  await expect(page.getByTestId('battle')).toBeVisible();
  expect((await state(page)).battle).toMatchObject({ bg: 'elite' });
  await expect(page.getByTestId('battle-text')).toHaveText('Champion Devansh wants to battle!');
  for (const part of ['bg', 'trainer'] as const) {
    await expect.poll(() => drawnShare(page, part), { message: `${part} is drawn`, intervals: [200] }).toBeGreaterThan(0.05);
  }
});

test.describe('Resume Mart', () => {
  test('the clerk sells the free resume: a download, the flag, and the Bag', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('mart-in'), 'up', { starter: 'react' }));
    const lines = await talkTo(page, gear, 'clerk');
    expect(lines).toEqual([factById.get(factId('junglee-b.award'))!.short, "Welcome. Today's only item is free."]);
    const mart = page.getByRole('dialog', { name: 'Resume Mart' });
    await expect(mart).toBeVisible();
    await expect(page.getByTestId('mart-bag')).toHaveText('Bag: 0 copies');
    await expect(mart).toContainText('Resume (PDF)');
    await expect(mart).toContainText('0 coins');

    await mart.getByRole('button', { name: 'Download resume' }).click();
    await expect(page.getByTestId('mart-prompt')).toHaveText('Take it?');
    const [download] = await Promise.all([page.waitForEvent('download'), mart.getByRole('button', { name: 'Yes' }).click()]);
    expect(new URL(download.url()).pathname).toBe('/resume.pdf');
    await expect(page.getByTestId('dialog-text')).toHaveText('You got the Resume! Put it in your Bag.');
    expect(await readDialog(page)).toEqual(['You got the Resume! Put it in your Bag.', 'Come again.']);
    expect((await state(page)).flags).toContain('resume');

    // the Bag holds it, and Use downloads it again
    await openFromMenu(page, 'Bag');
    const bag = page.getByRole('dialog', { name: 'Bag' });
    await expect(bag).toContainText('Resume (PDF) x1');
    const [again] = await Promise.all([page.waitForEvent('download'), bag.getByRole('button', { name: 'Use' }).click()]);
    expect(new URL(again.url()).pathname).toBe('/resume.pdf');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    // a second visit offers another copy
    await talkTo(page, gear, 'clerk');
    await expect(page.getByTestId('mart-bag')).toHaveText('Bag: 1 copy');
    await mart.getByRole('button', { name: 'Download resume' }).click();
    await expect(page.getByTestId('mart-prompt')).toHaveText('You already have it. Take another?');
    await page.keyboard.press('Escape');
    await closeDialog(page);
    expect((await state(page)).panel).toBe('none');
  });

  test('picking up the resume on the shelf only fills the Bag, no download', async ({ page }) => {
    let downloads = 0;
    page.on('download', () => (downloads += 1));
    await continueWith(page, savedWith('gear', gear.spawn('mart-in'), 'up', { starter: 'react' }));
    const lines = await talkTo(page, gear, 'resume');
    expect(lines.at(-1)).toBe('You got the Resume! Put it in your Bag.');
    expect((await state(page)).flags).toContain('resume');
    await page.waitForTimeout(600);
    expect(downloads).toBe(0);
    await openFromMenu(page, 'Bag');
    await expect(page.getByRole('dialog', { name: 'Bag' })).toContainText('Resume (PDF) x1');
  });

  test('a missing PDF shows the error with a link to /resume and keeps the Bag empty', async ({ page }) => {
    await page.route('**/resume.pdf', (route) => route.fulfill({ status: 404 }));
    let downloads = 0;
    page.on('download', () => (downloads += 1));
    await continueWith(page, savedWith('gear', gear.spawn('mart-in'), 'up', { starter: 'react' }));
    await talkTo(page, gear, 'clerk');
    const mart = page.getByRole('dialog', { name: 'Resume Mart' });
    await mart.getByRole('button', { name: 'Download resume' }).click();
    await mart.getByRole('button', { name: 'Yes' }).click();
    const alert = mart.getByRole('alert');
    await expect(alert).toContainText(PDF_FAILED);
    await expect(alert.getByRole('link')).toHaveAttribute('href', '/resume/');
    await expect(mart.getByRole('button', { name: 'Yes' })).toBeEnabled();
    expect((await state(page)).flags).not.toContain('resume');
    expect(downloads).toBe(0);
    await expect(page.getByTestId('mart-bag')).toHaveText('Bag: 0 copies');
  });

  test('the Bag is empty before the Mart', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
    await openFromMenu(page, 'Bag');
    await expect(page.getByRole('dialog', { name: 'Bag' })).toContainText('Your bag is empty.');
  });
});

test.describe('Trainer Card', () => {
  test('shows the money row, badges and the saved play time', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { flags: BADGES.slice(0, 2), starter: 'react', playSeconds: 3725 }));
    await openFromMenu(page, 'Trainer Card');
    const card = page.getByRole('dialog', { name: 'Trainer Card' });
    await expect(card).toContainText(profile.name);
    await expect(card).toContainText('400 coins');
    await expect(card).toContainText('400+ LeetCode problems solved');
    await expect(page.getByTestId('card-badges')).toHaveText('Badges 2 / 5');
    await expect(page.getByTestId('card-time')).toHaveText('Time 1:02');
    await expect(card.locator('img.pq-photo')).toBeVisible();
  });

  test('opens with focus inside the dialog, and Enter closes it from the Back button', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
    await openFromMenu(page, 'Trainer Card');
    const card = page.getByRole('dialog', { name: 'Trainer Card' });
    await expect(card.getByRole('button', { name: 'Back' })).toBeFocused();
    await press(page, 'Enter');
    await expect(card).toBeHidden();
    await expect(page.getByRole('menuitem', { name: 'Trainer Card' })).toBeFocused();
  });

  test('a fresh save reads Time 0:00 and Badges 0 / 5', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
    await openFromMenu(page, 'Trainer Card');
    await expect(page.getByTestId('card-time')).toHaveText('Time 0:00');
    await expect(page.getByTestId('card-badges')).toHaveText('Badges 0 / 5');
  });

  test('play time counts while the tab is visible and stops while it is hidden', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
    const start = (await state(page)).playSeconds;
    await expect.poll(async () => (await state(page)).playSeconds, { timeout: 10_000 }).toBeGreaterThanOrEqual(start + 2);
    await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }));
    const frozen = (await state(page)).playSeconds;
    await page.waitForTimeout(2500);
    expect((await state(page)).playSeconds).toBeLessThanOrEqual(frozen + 1);
    await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }));
    // leaving the page flushes the save, and the clock rides along
    await page.evaluate(() => dispatchEvent(new Event('pagehide')));
    await expect.poll(async () => (await storedSave(page))?.playSeconds ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
  });
});

test.describe('dex panels', () => {
  const panels = [
    { row: 'Skilldex', name: 'Skilldex', count: `Facts seen 0 / ${facts.length}` },
    { row: 'Bugdex', name: 'Bugdex', count: `Bugs caught 0 / ${CATCHABLE.length}` },
    { row: 'Trainer Card', name: 'Trainer Card', count: null },
  ];
  for (const { row, name, count } of panels) {
    test(`${name} opens, traps focus and closes back to the menu`, async ({ page }) => {
      await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
      await openFromMenu(page, row);
      const panel = page.getByRole('dialog', { name });
      await expect(panel).toBeVisible();
      if (count) await expect(page.getByTestId('dex-count')).toHaveText(count);
      for (let i = 0; i < 14; i++) {
        await press(page, 'Tab');
        expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]')?.getAttribute('aria-label')), `tab ${i}`).toBe(name);
      }
      await press(page, 'Escape');
      await expect(panel).toBeHidden();
      await expect(page.getByRole('menu', { name: 'Start menu' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: new RegExp(`^${row}`) })).toBeFocused();
      expect((await state(page)).panel).toBe('menu');
    });
  }

  test('the Skilldex lists a group, its gym and the badge, and arrows change the group', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { flags: ['badge.core'], seen: ['gear.leetcode'], starter: 'react' }));
    await openFromMenu(page, 'Skilldex');
    const panel = page.getByRole('dialog', { name: 'Skilldex' });
    await expect(page.getByTestId('badge-status')).toHaveText('Core Badge: Badge earned');
    await expect(panel.getByRole('button', { name: 'TypeScript' })).toBeVisible();
    await press(page, 'ArrowRight');
    await expect(panel.getByRole('tab', { selected: true })).toHaveText(skillGroups[1]!.label);
    await expect(page.getByTestId('badge-status')).toHaveText(`${skillGroups[1]!.gymBadge}: Badge not earned yet`);
    await press(page, 'ArrowDown');
    await expect(panel.getByRole('button', { name: skillGroups[1]!.items[1]! })).toHaveAttribute('aria-current', 'true');
  });

  test('the Bugdex names a caught bug with its flavor line and hides the rest', async ({ page }) => {
    await continueWith(page, savedWith('gear', gear.spawn('default'), 'right', { caught: ['cors'], starter: 'react' }));
    await openFromMenu(page, 'Bugdex');
    await expect(page.getByTestId('dex-count')).toHaveText(`Bugs caught 1 / ${CATCHABLE.length}`);
    const panel = page.getByRole('dialog', { name: 'Bugdex' });
    await expect(panel.getByRole('button', { name: 'CORS Error' })).toBeVisible();
    await expect(panel.getByRole('button', { name: '???' })).toHaveCount(CATCHABLE.length - 1);
    await panel.getByRole('button', { name: 'CORS Error' }).click();
    await expect(panel).toContainText('The request never left the browser.');
  });
});
