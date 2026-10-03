import { expect, test } from '@playwright/test';
import { factById, facts, factId } from '../src/content';
import type { Page } from '@playwright/test';
import { colorGap, continueWith, named, flagsOf, interact, mazeInfo, parseTile, plainFloor, readDialog, savedAt, standAt, startAt, state, talkTo, tileColor, waitAt, walk, warpTo } from './helpers';
import { readTown, standingSpot } from './world';

test.describe('Junglee 2FA gate', () => {
  const west = { x: 33, y: 16 };
  const east = { x: 36, y: 16 };

  async function atGate(page: Page) {
    await startAt(page, '/?warp=junglee');
    const map = readTown('junglee');
    await waitAt(page, 'junglee', map.spawn('default'));
    return map;
  }

  async function tryGate(page: Page) {
    await standAt(page, west, 'right');
    await walk(page, 'right', 3);
    return (await state(page)).pos;
  }

  test('one key is not enough, two keys open the gate', async ({ page }) => {
    const map = await atGate(page);
    expect(await tryGate(page)).toEqual(west);
    const [first] = await talkTo(page, map, 'key-1');
    expect(first).toBe(factById.get(factId('junglee-b.2fa'))!.short);
    expect(await flagsOf(page)).toEqual(['key.2fa.1']);
    expect(await tryGate(page)).toEqual(west);
    expect((await talkTo(page, map, 'key-2')).at(-1)).toBe('You got the second key! Both keys fit the 2FA gate.');
    expect(await flagsOf(page)).toEqual(['key.2fa.1', 'key.2fa.2']);
    expect(await tryGate(page)).toEqual(east);
  });

  test('the Recovery NPC hands over the missing key only to someone holding one', async ({ page }) => {
    const map = await atGate(page);
    expect(await talkTo(page, map, 'recovery')).toHaveLength(1);
    expect(await flagsOf(page)).toEqual([]);
    await talkTo(page, map, 'key-2');
    expect(await tryGate(page)).toEqual(west);
    const lines = await talkTo(page, map, 'recovery');
    expect(lines.at(-1)).toBe('Got a recovery code! The gate accepts it as your second key.');
    expect(await flagsOf(page)).toEqual(['key.2fa.2', 'key.2fa.1']);
    expect(await tryGate(page)).toEqual(east);
    // a second talk has nothing left to give
    expect(await talkTo(page, map, 'recovery')).toHaveLength(1);
  });
});

test('Marrfa: each role opens only its own door', async ({ page }) => {
  test.setTimeout(180_000);
  await startAt(page, '/?warp=marrfa');
  const map = readTown('marrfa');
  await waitAt(page, 'marrfa', map.spawn('default'));
  const roles = ['owner', 'agent', 'tenant'] as const;
  for (const role of roles) {
    const lines = await talkTo(page, map, 'manager');
    expect(lines[0]).toBe(factById.get(factId('marrfa.dashboard'))!.short);
    expect(lines.at(-1)).toBe(`Your role is now ${role[0]!.toUpperCase()}${role.slice(1)}.`);
    expect((await flagsOf(page)).filter((flag) => flag.startsWith('role.'))).toEqual([`role.${role}`]);
    for (const door of roles) {
      const front = map.spawn(`${door}-door`);
      await standAt(page, front, 'up');
      await walk(page, 'up');
      if (door === role) {
        await waitAt(page, 'marrfa', map.spawn(`${door}-in`));
        await walk(page, 'down');
        await waitAt(page, 'marrfa', front);
      } else {
        // a locked door names the role it needs, and stepping back finds the street, not a room
        expect((await state(page)).pos).toEqual({ x: front.x, y: front.y - 1 });
        await expect.poll(async () => (await state(page)).dialog?.text).toBe(`This door needs the ${door[0]!.toUpperCase()}${door.slice(1)} role.`);
        await readDialog(page);
        await walk(page, 'down');
        await waitAt(page, 'marrfa', front);
      }
    }
  }
  // the cycle wraps: a fourth talk is Owner again, and Agent and Tenant are gone
  expect((await talkTo(page, map, 'manager')).at(-1)).toBe('Your role is now Owner.');
  expect((await flagsOf(page)).filter((flag) => flag.startsWith('role.'))).toEqual(['role.owner']);
  // a locked door's sign shows the dashboard fact
  expect((await talkTo(page, map, 'sync'))[0]).toBe(factById.get(factId('marrfa.dashboard'))!.short);
  // each house holds a dashboard
  expect((await talkTo(page, map, 'owner-screen'))[0]).toBe(factById.get(factId('marrfa.dashboard'))!.short);
});

test.describe('TestMu If/Else and While floor', () => {
  const ten = facts.slice(0, 10).map((fact) => fact.id as string);
  const lane = { x: 119, y: 7 };

  test('the IF lane stays closed under 10 facts', async ({ page }) => {
    await continueWith(page, savedAt('testmu', lane, 'up', ten.slice(0, 9)));
    expect(await flagsOf(page)).not.toContain('seen.10');
    await walk(page, 'up', 2);
    expect((await state(page)).pos).toEqual(lane);
  });

  test('the IF lane opens at 10 facts', async ({ page }) => {
    await continueWith(page, savedAt('testmu', lane, 'up', ten));
    expect(await flagsOf(page)).toContain('seen.10');
    await walk(page, 'up', 2);
    expect((await state(page)).pos).toEqual({ x: lane.x, y: lane.y - 2 });
  });

  test('the tenth fact seen in play opens the lane without a reload', async ({ page }) => {
    await continueWith(page, savedAt('testmu', lane, 'up', ten.slice(0, 9)));
    await walk(page, 'up');
    expect((await state(page)).pos).toEqual(lane);
    // the tenth fact in fact order is the cursor sign's
    await talkTo(page, readTown('testmu'), 'cursor-sign');
    expect(await flagsOf(page)).toContain('seen.10');
    await standAt(page, lane, 'up');
    await walk(page, 'up', 2);
    expect((await state(page)).pos).toEqual({ x: lane.x, y: lane.y - 2 });
  });

  test('the WHILE corridor loops until the lever is pulled', async ({ page }) => {
    await startAt(page, '/?warp=testmu&spawn=f2-from-below');
    const map = readTown('testmu');
    await waitAt(page, 'testmu', map.spawn('f2-from-below'));
    const start = map.spawn('loop-start');
    await walk(page, 'up');
    await walk(page, 'left');
    await waitAt(page, 'testmu', start);
    for (const lap of [1, 2]) {
      await walk(page, 'up', 4);
      await expect.poll(async () => (await state(page)).loops).toBe(lap);
      await waitAt(page, 'testmu', start);
      await expect(page.locator('.pq-loops')).toHaveText(`Loop ${lap}`);
    }
    await walk(page, 'up');
    const lines = await (async () => {
      await expect.poll(async () => {
        const { dialog } = await state(page);
        if (!dialog) await interact(page);
        return dialog?.text;
      }, { intervals: [120] }).toBeTruthy();
      return readDialog(page);
    })();
    expect(lines[0]).toBe(factById.get(factId('testmu.blocks'))!.short);
    expect(lines.at(-1)).toBe('You pulled the lever. The loop breaks.');
    expect(await flagsOf(page)).toContain('loop.break');
    await expect(page.locator('.pq-loops')).toBeHidden();
    await walk(page, 'up', 4);
    expect((await state(page)).pos).toEqual({ x: start.x, y: 3 });
    expect((await state(page)).loops).toBe(2);
    await walk(page, 'right');
    expect((await state(page)).pos).toEqual({ x: start.x + 1, y: 3 });
  });
});

test.describe('KaneAI robot', () => {
  const ask = async (page: Page, text: string) => {
    await expect(page.getByLabel('Tell me where to go')).toBeFocused();
    await page.getByLabel('Tell me where to go').fill(text);
    await page.keyboard.press('Enter');
  };

  async function atRobot(page: Page) {
    await startAt(page, '/?warp=testmu&spawn=lobby-in');
    const map = readTown('testmu');
    await waitAt(page, 'testmu', map.spawn('lobby-in'));
    const lines = await talkTo(page, map, 'guide-robot');
    expect(lines).toEqual([factById.get(factId('agra.summary'))!.short]);
    await expect(page.getByRole('dialog', { name: 'KaneAI Robot' })).toBeVisible();
    return map;
  }

  test('"core gym" walks you to the gym door, "junglee" lands in Junglee', async ({ page }) => {
    test.setTimeout(120_000);
    await atRobot(page);
    await ask(page, 'take me to the CORE gym');
    const gear = readTown('gear');
    await waitAt(page, 'gear', gear.spawn('gym-door'), 30_000);
    await expect(page.getByRole('dialog', { name: 'KaneAI Robot' })).toBeHidden();
    expect((await state(page)).panel).toBe('none');

    await warpTo(page, 'testmu', 'lobby-in');
    await waitAt(page, 'testmu', readTown('testmu').spawn('lobby-in'));
    await talkTo(page, readTown('testmu'), 'guide-robot');
    await ask(page, 'junglee');
    await waitAt(page, 'junglee', readTown('junglee').spawn('default'), 30_000);
  });

  test('a gym in this town is reached through the tower door', async ({ page }) => {
    test.setTimeout(120_000);
    await atRobot(page);
    await ask(page, 'design gym');
    await waitAt(page, 'testmu', readTown('testmu').spawn('design-door'), 30_000);
  });

  test('a tower floor is reached by the stairs', async ({ page }) => {
    test.setTimeout(120_000);
    await atRobot(page);
    await ask(page, 'basement');
    await waitAt(page, 'testmu', readTown('testmu').spawn('basement-from-above'), 30_000);
  });

  test('a closed gate makes the robot say the road is locked', async ({ page }) => {
    test.setTimeout(120_000);
    await atRobot(page);
    await ask(page, 'the editor');
    await waitAt(page, 'junglee', readTown('junglee').spawn('default'), 30_000);
    await expect.poll(async () => (await state(page)).dialog?.text, { timeout: 40_000 }).toBe('That road is locked. Find the way to open it first.');
    await readDialog(page);
    expect((await state(page)).pos.x).toBeLessThan(34);
  });

  test('a key held while the prompt opens does not stay down', async ({ page }) => {
    await startAt(page, '/?warp=testmu&spawn=lobby-in');
    const map = readTown('testmu');
    await waitAt(page, 'testmu', map.spawn('lobby-in'));
    const { tile, facing } = standingSpot(map, named(map, 'guide-robot'));
    await standAt(page, tile, facing);
    await expect.poll(async () => {
      const { dialog } = await state(page);
      if (!dialog) await interact(page);
      return dialog?.text;
    }, { intervals: [120] }).toBeTruthy();
    await page.keyboard.down('ArrowRight');
    await readDialog(page);
    await expect(page.getByLabel('Tell me where to go')).toBeFocused();
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).panel).toBe('none');
    // press and release Up: the stale Right must not come back
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(80);
    await page.keyboard.up('ArrowUp');
    await expect.poll(async () => (await state(page)).held).toBeNull();
    expect((await state(page)).pos).toEqual(tile);
  });

  test('an unknown place gets the hint, and Esc closes the prompt', async ({ page }) => {
    await atRobot(page);
    await ask(page, 'the moon');
    await expect(page.getByRole('alert')).toHaveText("I couldn't find that. Try: Core gym, Junglee, the basement.");
    await page.getByLabel('Tell me where to go').fill('');
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await state(page)).panel).toBe('none');
    expect((await state(page)).town).toBe('testmu');
  });
});

test('Authoring cursor: a planted flag survives the rewrites and walking onto it says so', async ({ page }) => {
  test.setTimeout(120_000);
  await startAt(page, '/?warp=testmu&spawn=f1-from-below');
  const map = readTown('testmu');
  await waitAt(page, 'testmu', map.spawn('f1-from-below'));
  // without the cursor, A on the floor plants nothing
  await standAt(page, { x: 89, y: 6 }, 'right');
  await interact(page);
  expect((await mazeInfo(page))?.flag).toBeNull();
  expect((await talkTo(page, map, 'cursor-robot')).at(-1)).toBe('You got a cursor! Face a floor tile and press A to plant your flag.');
  expect(await flagsOf(page)).toContain('cursor');

  // the walls must be on screen, not only in the data: a wall tile and a plain floor tile differ in colour
  await standAt(page, { x: 89, y: 6 }, 'right');
  await expect.poll(async () => {
    const info = (await mazeInfo(page))!;
    const wall = info.walls.map(parseTile).find((tile) => !(tile.x === 89 && tile.y === 6)) ?? { x: 0, y: 0 };
    return colorGap(await tileColor(page, wall), await tileColor(page, plainFloor(info)));
  }, { message: 'wall pixels differ from floor pixels', timeout: 15_000, intervals: [300] }).toBeGreaterThan(40);

  const seen = new Set<string>();
  await standAt(page, { x: 89, y: 6 }, 'right');
  await expect.poll(async () => {
    const info = await mazeInfo(page);
    if (!info?.flag) await interact(page);
    return (await mazeInfo(page))?.flag;
  }, { intervals: [150] }).toEqual({ x: 90, y: 6 });
  await readDialog(page);
  await expect.poll(async () => {
    const info = (await mazeInfo(page))!;
    return colorGap(await tileColor(page, info.flag ?? { x: 0, y: 0 }), await tileColor(page, plainFloor(info)));
  }, { message: 'flag pixels differ from floor pixels', timeout: 15_000, intervals: [300] }).toBeGreaterThan(40);
  const start = (await mazeInfo(page))!;
  await expect.poll(async () => {
    const info = (await mazeInfo(page))!;
    seen.add(info.walls.join('|'));
    expect(info.walls).not.toContain('90,6');
    return info.survived;
  }, { timeout: 30_000, intervals: [250] }).toBeGreaterThanOrEqual(2);
  expect(seen.size).toBeGreaterThan(1);
  expect(start.walls.length).toBeGreaterThan(5);

  await walk(page, 'right');
  expect((await state(page)).pos).toEqual({ x: 90, y: 6 });
  const lines = await readDialog(page);
  expect(lines[0]).toBe(factById.get(factId('testmu.cursor'))!.short);
  expect(lines.at(-1)).toMatch(/^The cursor survived \d+ rewrites\.$/);
  expect(Number(/survived (\d+)/.exec(lines.at(-1) ?? '')?.[1])).toBeGreaterThanOrEqual(2);
});

