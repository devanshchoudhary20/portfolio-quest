import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { factById, factId } from '../src/content';
import { TURN_CAP } from '../src/game/battle/engine';
import { RECRUITER_STARTER, TURN_CAP_LINE } from '../src/game/world/lines';
import { continueWith, savedAt, standAt, startAt, state, talkTo, walk, warpTo } from './helpers';
import { readTown } from './world';

type Battle = NonNullable<Awaited<ReturnType<typeof state>>['battle']>;

// instant text: a fight is dozens of lines, and a typewriter on a busy machine turns each one into seconds
test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('pq.prefs.v1', JSON.stringify({ textSpeed: 4 }))));

// keys are held 70 ms so Phaser and React both see them
const press = (page: Page, key: string) => page.keyboard.press(key, { delay: 70 });

// plays a battle with the keyboard: Z on every queued line and on the first move; returns every line shown and the last snapshot
async function fight(page: Page, stop: (battle: Battle) => boolean = () => false) {
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
const reachMoves = (page: Page) =>
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

const storedSave = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('pq.save.v1') ?? 'null') as { starter?: string; caught: string[]; flags: string[] } | null);

async function openBattle(page: Page, species: string, hp: { playerHp?: number; enemyHp?: number } = {}) {
  await startAt(page, '/?warp=gear');
  await page.evaluate(([s, h]) => window.__pq!.encounter(s as string, h as { playerHp?: number }), [species, hp] as const);
  await expect(page.getByTestId('battle')).toBeVisible();
}

async function newGame(page: Page) {
  await page.goto('/');
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
}

test.describe('starter pick', () => {
  test('an engineer picks Node.js with the keyboard and the save keeps it', async ({ page }) => {
    await newGame(page);
    await page.getByRole('menuitem', { name: 'Engineer' }).click();
    // the confirm menu opens where the answer was; a pointer left there would hover its second row
    await page.mouse.move(0, 0);
    await expect(page.getByRole('group', { name: 'Starters' })).toBeVisible();
    await expect(page.getByTestId('dialog-text')).toHaveText('React. Where the work lives: components and state.');
    await press(page, 'ArrowRight');
    await expect(page.getByTestId('dialog-text')).toHaveText('Node.js. Backend, working knowledge.');
    await press(page, 'z');
    await expect(page.getByTestId('dialog-text')).toHaveText('Choose Node.js?');
    await press(page, 'z');
    await expect(page.getByTestId('dialog-text')).toHaveText('Node.js joined your team.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForFunction(() => window.__pq!.state().phase === 'play' && window.__pq!.state().pos.x > 0);
    expect((await state(page)).starter).toBe('node');
    await expect.poll(async () => (await storedSave(page))?.starter).toBe('node');
  });

  test('No on the confirm goes back to the three partners', async ({ page }) => {
    await newGame(page);
    await page.getByRole('menuitem', { name: 'Just curious' }).click();
    await press(page, 'z');
    await page.getByRole('menuitem', { name: 'No' }).click();
    await expect(page.getByTestId('dialog-text')).toHaveText('React. Where the work lives: components and state.');
    expect((await state(page)).starter).toBeNull();
  });

  test('a recruiter gets React without picking, and one line says so', async ({ page }) => {
    await newGame(page);
    await page.getByRole('menuitem', { name: 'Recruiter' }).click();
    await page.getByRole('menuitem', { name: 'Play anyway' }).click();
    await expect(page.getByTestId('dialog-text')).toHaveText(RECRUITER_STARTER);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForFunction(() => window.__pq!.state().phase === 'play' && window.__pq!.state().pos.x > 0);
    expect(await state(page)).toMatchObject({ starter: 'react', mode: 'recruiter' });
  });
});

test.describe('wild bugs', () => {
  test('a wild fight plays to a win, logs the catch and shows a pool fact, and the map resumes where it was', async ({ page }) => {
    await openBattle(page, 'null-pointer');
    const before = await state(page);
    expect(before.battle).toMatchObject({ enemy: 'null-pointer', phase: 'choose', turn: 0 });
    // the map is paused under the battle: the held key goes nowhere
    await page.evaluate(() => window.__pq!.walk('down', 1));
    expect((await state(page)).pos).toEqual(before.pos);

    // tap a move directly instead of using the keyboard
    await reachMoves(page);
    await page.getByRole('menuitem', { name: 'If/Else Block' }).click();
    await expect.poll(async () => (await state(page)).battle?.turn).toBe(1);

    const { lines } = await fight(page);
    const pool = ['gear.btech', 'gear.leetcode', 'skill.core'].map((id) => factById.get(factId(id))!.short);
    expect(lines).toContain('NullPointerException fainted!');
    expect(lines.some((line) => pool.includes(line))).toBe(true);
    expect(lines).toContain('NullPointerException was added to the Bugdex.');
    await expect(page.getByTestId('battle')).toBeHidden();

    const after = await state(page);
    expect(after.pos).toEqual(before.pos);
    expect(after.caught).toEqual(['null-pointer']);
    expect(after.seen.some((id) => ['gear.btech', 'gear.leetcode', 'skill.core'].includes(id))).toBe(true);
    await expect.poll(async () => (await storedSave(page))?.caught).toEqual(['null-pointer']);
    await page.evaluate(() => window.__pq!.walk('right', 1));
    expect((await state(page)).pos.x).toBe(before.pos.x + 1);
  });

  test('every battle line is a resume fact or a line from lines.ts', async ({ page }) => {
    await openBattle(page, 'cors');
    const { lines } = await fight(page);
    const facts = new Set(['gear.btech', 'gear.leetcode', 'skill.core'].map((id) => factById.get(factId(id))!.short));
    const moveFacts = ['testmu.cursor', 'testmu.blocks', 'testmu.a11y', 'patch-center.koalalab'].map((id) => factById.get(factId(id))!.short);
    const strangers = lines.filter(
      (line) =>
        !facts.has(line) &&
        !moveFacts.includes(line) &&
        !/^(A wild CORS Error appeared!|Go! React!|What will React do\?|(React|CORS Error) used [\w/ ]+!|CORS Error fainted!|CORS Error was added to the Bugdex\.|It's (super effective!|not very effective\.)|The request never left the browser\.|A header went missing on the way\.)$/.test(line),
    );
    expect(strangers).toEqual([]);
  });

  test('the fourth turn ends the fight in the player\'s favour', async ({ page }) => {
    await openBattle(page, 'null-pointer', { enemyHp: 5000 });
    const { lines, last } = await fight(page);
    expect(last).toMatchObject({ phase: 'won', turn: TURN_CAP });
    expect(lines).toContain(TURN_CAP_LINE);
  });

  test('a faint offers Try again and Read the resume, never another page', async ({ page }) => {
    await openBattle(page, 'cors', { playerHp: 1, enemyHp: 5000 });
    const url = page.url();
    await fight(page, (battle) => battle.phase === 'lost' && !battle.pending);
    await expect(page.getByRole('menuitem', { name: 'Try again' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Read the resume' })).toBeVisible();
    expect(page.url()).toBe(url);

    await page.getByRole('menuitem', { name: 'Try again' }).click();
    await expect.poll(async () => (await state(page)).battle).toMatchObject({ phase: 'choose', turn: 0 });

    await fight(page, (battle) => battle.phase === 'lost' && !battle.pending);
    await page.getByRole('menuitem', { name: 'Read the resume' }).click();
    await expect(page.getByRole('dialog', { name: 'Recruiter Mode' })).toBeVisible();
    expect((await state(page)).battle).toBeNull();
    expect(page.url()).toBe(url);
  });

  test('the background and both creatures are drawn on the canvas', async ({ page }) => {
    await openBattle(page, 'null-pointer');
    await reachMoves(page);

    const differs = async (part: 'bg' | 'enemy' | 'player') => {
      const rect = await page.evaluate((p) => window.__pq!.battlePart(p), part);
      expect(rect, part).not.toBeNull();
      // the top of the part: the message box covers the foot of the player's sprite and the info boxes cover the sides of the background
      const clip = part === 'bg'
        ? { x: rect!.x + rect!.width * 0.4, y: rect!.y + rect!.height * 0.02, width: rect!.width * 0.2, height: rect!.height * 0.12 }
        : { x: rect!.x, y: rect!.y, width: rect!.width, height: rect!.height * 0.6 };
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
    };

    // a slide-in may still be moving, so each part polls until it has settled
    for (const part of ['bg', 'enemy', 'player'] as const) {
      await expect.poll(() => differs(part), { message: `${part} is drawn`, intervals: [200] }).toBeGreaterThan(0.05);
    }
  });
});

test('a lucky step into tall grass starts a fight, but only after 15 steps', async ({ page }) => {
  await startAt(page, '/?warp=gear');
  // every roll is a hit, so only the 15-step rule can hold a fight back
  await page.evaluate(() => (Math.random = () => 0));
  const zone = readTown('gear').objects.find((o) => o.layer === 'encounters')!;
  const above = { x: zone.tile.x + 1, y: zone.tile.y - 1 };
  await standAt(page, above, 'down');
  await walk(page, 'down');
  expect((await state(page)).pos).toEqual({ x: above.x, y: above.y + 1 });
  expect((await state(page)).battle).toBeNull();

  await walk(page, 'up');
  await walk(page, 'left', 7);
  await walk(page, 'right', 7);
  await walk(page, 'down');
  await expect.poll(async () => (await state(page)).battle?.phase).toBe('choose');
});

test('a slow art load shows the loader card, then the fight', async ({ page }) => {
  await page.route('**/assets/battle/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await startAt(page, '/?warp=gear');
  await page.evaluate(() => window.__pq!.encounter('cors'));
  await expect(page.getByTestId('travel-card')).toContainText('Loading battle');
  await expect(page.getByTestId('travel-card')).toBeHidden({ timeout: 15_000 });
  await expect(page.getByTestId('battle')).toBeVisible();
});

test('a battle that closes while its art loads clears the loader card and leaves the menu free', async ({ page }) => {
  await page.route('**/assets/battle/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  await startAt(page, '/?warp=gear');
  await page.evaluate(() => window.__pq!.encounter('cors'));
  await expect(page.getByTestId('travel-card')).toContainText('Loading battle');
  // input before the screen is built goes nowhere
  await press(page, 'z');
  await press(page, 'Escape');
  expect((await state(page)).battle).toMatchObject({ turn: 0, phase: 'choose' });
  // the battle ends under the loader (the Run is simulated), and the card must not outlive it
  await page.evaluate(() => window.__pq!.closeBattle());
  await expect(page.getByTestId('travel-card')).toBeHidden({ timeout: 15_000 });
  expect((await state(page)).battle).toBeNull();
  await press(page, 'Enter');
  await expect(page.getByRole('menuitem', { name: 'Options' })).toBeVisible();
});

test('holding X into a fight neither advances the lines nor runs', async ({ page }) => {
  await startAt(page, '/?warp=gear');
  // X is held on the map (the Running Shoes); the repeats that follow arrive inside the battle
  await page.keyboard.down('x');
  await page.evaluate(() => window.__pq!.encounter('null-pointer'));
  await expect(page.getByTestId('battle')).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.down('x');
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('x');
  const held = (await state(page)).battle;
  expect(held).toMatchObject({ phase: 'choose', turn: 0, line: 'A wild NullPointerException appeared!' });
  await reachMoves(page);
  await expect(page.getByRole('menuitem', { name: 'Authoring Cursor' })).toBeVisible();
  // a held Z picks one move at most
  for (let i = 0; i < 6; i++) await page.keyboard.down('z');
  await page.keyboard.up('z');
  expect((await state(page)).battle?.turn).toBeLessThanOrEqual(1);
});

test('in a two-bug gym fight the first bug faints on screen before the second is named or drawn', async ({ page }) => {
  await startAt(page, '/?warp=gear');
  await talkTo(page, readTown('gear'), 'core-leader');
  await expect(page.getByTestId('battle')).toBeVisible();
  let atFaint: string | null = null;
  let atSend: string | null = null;
  await expect
    .poll(
      async () => {
        const { battle } = await state(page);
        if (!battle) return 'closed';
        if (battle.line === 'Hydration Mismatch fainted!' && atFaint === null) {
          // the plate still names the first bug while it drains and drops
          atFaint = (await page.getByTestId('enemy-info').textContent()) ?? '';
          await expect.poll(async () => (await page.evaluate(() => window.__pq!.battlePart('enemy')))?.alpha ?? 0, { message: 'first bug fades out' }).toBeLessThan(0.1);
          await expect.poll(async () => (await state(page)).battle?.shown.enemy).toBe(0);
        }
        if (battle.line.startsWith('Core Leader sent out NullPointerException') && atSend === null) {
          await expect(page.getByTestId('enemy-info')).toContainText('NullPointerException');
          atSend = (await page.getByTestId('enemy-info').textContent()) ?? '';
        }
        await press(page, 'z');
        return 'playing';
      },
      { intervals: [100], timeout: 60_000 },
    )
    .toBe('closed');
  expect(atFaint).toContain('Hydration Mismatch');
  expect(atFaint).not.toContain('NullPointerException');
  expect(atSend).toContain('NullPointerException');
});

test.describe('gym leaders', () => {
  test('the Core leader says their fact, fights, awards the badge, and the badge survives Continue', async ({ page }) => {
    await startAt(page, '/?warp=gear');
    const map = readTown('gear');
    const spoken = await talkTo(page, map, 'core-leader');
    expect(spoken).toEqual([factById.get(factId('skill.core'))!.short]);
    await expect(page.getByTestId('battle')).toBeVisible();
    expect((await state(page)).battle).toMatchObject({ phase: 'choose' });

    const { lines } = await fight(page);
    expect(lines[0]).toBe('Core Leader wants to battle!');
    expect(lines).toContain('You earned the Core Badge!');
    expect((await state(page)).flags).toContain('badge.core');
    await expect.poll(async () => (await storedSave(page))?.flags).toContain('badge.core');

    // a beaten leader only repeats the fact
    expect(await talkTo(page, map, 'core-leader')).toEqual([factById.get(factId('skill.core'))!.short]);
    expect((await state(page)).battle).toBeNull();

    // the warp query would start a fresh game, so Continue is reached from the plain address
    await page.goto('/');
    await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.waitForFunction(() => window.__pq!.state().phase === 'play' && window.__pq!.state().pos.x > 0);
    expect((await state(page)).flags).toContain('badge.core');
    await press(page, 'Enter');
    await expect(page.getByTestId('stats')).toHaveText('Badges 1 / 5');
  });

  test('running from a leader awards no badge, and the leader fights again on the next talk', async ({ page }) => {
    await startAt(page, '/?warp=marrfa');
    const map = readTown('marrfa');
    await talkTo(page, map, 'backend-leader');
    await expect(page.getByTestId('battle')).toBeVisible();
    // Esc backs out of the move grid as Run; X is the Running Shoes key and never flees
    await reachMoves(page);
    await press(page, 'x');
    expect((await state(page)).battle?.phase).toBe('choose');
    await press(page, 'Escape');
    const { lines } = await fight(page);
    expect(lines).toContain('Got away safely.');
    await expect(page.getByTestId('battle')).toBeHidden();
    expect((await state(page)).flags).not.toContain('badge.backend');
    expect(await talkTo(page, map, 'backend-leader')).toHaveLength(1);
    await expect(page.getByTestId('battle')).toBeVisible();
  });
});

test.describe('options and grass', () => {
  const openOptions = async (page: Page) => {
    await press(page, 'Enter');
    await page.getByRole('menuitem', { name: 'Options' }).click();
  };

  test('Wild bugs defaults to On, switches Off, and remembers', async ({ page }) => {
    await startAt(page, '/?warp=gear');
    await openOptions(page);
    await expect(page.getByRole('menuitem', { name: 'Wild bugs: On' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Wild bugs: On' }).click();
    await expect(page.getByRole('menuitem', { name: 'Wild bugs: Off' })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pq.prefs.v1') ?? '{}').wildBugs)).toBe(false);
  });

  test('Wild bugs defaults to Off in recruiter mode', async ({ page }) => {
    await continueWith(page, { ...savedAt('gear', { x: 8, y: 10 }, 'right'), mode: 'recruiter' });
    await openOptions(page);
    await expect(page.getByRole('menuitem', { name: 'Wild bugs: Off' })).toBeVisible();
  });

  test('Gear City, Junglee and Marrfa each have tall grass the player can walk to', async ({ page }) => {
    await startAt(page, '/?warp=agra');
    for (const town of ['gear', 'junglee', 'marrfa']) {
      const zones = readTown(town).objects.filter((o) => o.layer === 'encounters');
      expect(zones.length, town).toBeGreaterThan(0);
      for (const zone of zones) expect(zone.props.pool?.split(',').length, `${town}/${zone.name}`).toBeGreaterThan(0);
    }
    await warpTo(page, 'gear');
    await expect.poll(async () => (await state(page)).town).toBe('gear');
  });
});
