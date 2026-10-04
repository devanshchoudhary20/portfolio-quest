import { expect, test } from '@playwright/test';
import { factById, facts, factId } from '../src/content';
import { TOWNS, closeDialog, interact, runFromBattle, startAt, state, walk, waitAt, warpTo } from './helpers';
import { FACE_BACK } from '../scripts/tiledMap';
import { factObjects, readTown, roadDirection, standingSpot } from './world';

test('a deep link lands on each built town default spawn, and a bad one falls back to the Title', async ({ page }) => {
  for (const town of TOWNS) {
    await startAt(page, `/?warp=${town}`);
    await waitAt(page, town, readTown(town).spawn('default'));
  }
  for (const bad of ['patch-center', 'nowhere']) {
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

  // Victory Road needs three badges: with none, the road says how many are held
  const testmu = readTown('testmu');
  const road = testmu.objects.find((o) => o.props.to === 'elite')!;
  await warpTo(page, 'testmu');
  await waitAt(page, 'testmu', testmu.spawn('default'));
  const { tile: before, facing } = standingSpot(testmu, road);
  await page.evaluate(([x, y, f]) => window.__pq!.stand(x as number, y as number, f as 'up'), [before.x, before.y, facing]);
  await walk(page, facing);
  await expect(page.getByTestId('dialog-text')).toHaveText('Victory Road needs 3 badges. You have 0.');
  await closeDialog(page);
  // the player keeps standing on the shut road tile, and walks back off it
  await expect.poll(async () => (await state(page)).pos).toEqual(road.tile);
  await walk(page, FACE_BACK[facing]);
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
      // entering the Hall of Fame room opens its panel over the map
      if ((await state(page)).panel === 'hof') await page.keyboard.press('Escape');
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
      await runFromBattle(page);
      // the robot asks where to go and the clerk opens the Mart once their lines are done; Esc leaves, and the clerk says goodbye
      if ((await state(page)).panel !== 'none') await page.keyboard.press('Escape');
      await closeDialog(page);
      await expect.poll(async () => (await state(page)).panel).toBe('none');
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

