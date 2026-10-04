import { expect, test } from '@playwright/test';
import { closeDialog, fight, interact, savedWith, standAt, state, waitAt, walk, warpTo } from './helpers';
import { readTown, roadDirection, standingSpot } from './world';

// default text speed on purpose: only reduced motion may make the typewriter instant
test.use({ reducedMotion: 'reduce' });

const gear = readTown('gear');

// every frame, record anything that moves: CSS animations and transitions, Phaser tweens and fades, a half-typed line, an HP bar behind the battle state
test.beforeEach(({ page }) =>
  page.addInitScript(() => {
    const seen = { css: 0, canvas: 0, typing: 0, hp: 0 };
    (window as unknown as { __motion: typeof seen }).__motion = seen;
    const tick = () => {
      seen.css += document.getAnimations().filter((a) => a.playState === 'running').length;
      seen.canvas += window.__pq?.motion() ?? 0;
      const text = document.querySelector<HTMLElement>('[data-testid="dialog-text"], [data-testid="battle-message"] .pq-text');
      const spans = text ? text.querySelectorAll('span').length : 0;
      if (text && Number(text.style.getPropertyValue('--n')) < spans) seen.typing += 1;
      const battle = window.__pq?.state().battle;
      if (battle && (battle.shown.player !== battle.playerHp || battle.shown.enemy !== battle.enemyHp)) seen.hp += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }),
);

const motion = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __motion: Record<string, number> }).__motion);

test('Title, a dialog, a battle and a warp run with nothing animating and the text complete on arrival', async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem('pq.save.v1', JSON.stringify(value)), savedWith('gear', gear.spawn('default'), 'right', { starter: 'react' }));
  await page.goto('/');
  await expect(page.locator('#strip')).toHaveText(/Press Start/, { timeout: 30_000 });
  expect(await motion(page), 'title').toEqual({ css: 0, canvas: 0, typing: 0, hp: 0 });
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForFunction(() => window.__pq?.state().phase === 'play' && window.__pq.state().pos.x > 0);

  // the clerk's first line is in the DOM whole the moment the dialog opens
  const { tile, facing } = standingSpot(gear, gear.objects.find((o) => o.name === 'clerk')!);
  await standAt(page, tile, facing);
  await expect.poll(async () => {
    if (!(await state(page)).dialog) await interact(page);
    return (await state(page)).dialog?.text;
  }, { intervals: [60] }).toBeTruthy();
  const opened = (await state(page)).dialog!.text;
  expect(opened.length).toBeGreaterThan(20);
  await expect(page.getByTestId('dialog-text')).toHaveText(opened, { timeout: 500 });
  expect(await motion(page), 'dialog').toEqual({ css: 0, canvas: 0, typing: 0, hp: 0 });
  await closeDialog(page);
  await expect(page.getByRole('dialog', { name: 'Resume Mart' })).toBeVisible();
  await page.keyboard.press('Escape');
  await closeDialog(page);

  await warpTo(page, 'gear');
  await waitAt(page, 'gear', gear.spawn('default'));
  await page.evaluate(() => window.__pq!.encounter('cors'));
  await expect(page.getByTestId('battle')).toBeVisible();
  const { last } = await fight(page, (battle) => battle.phase === 'won' || battle.phase === 'lost');
  expect(last, 'the battle reached an end').not.toBeNull();
  expect(await motion(page), 'battle').toEqual({ css: 0, canvas: 0, typing: 0, hp: 0 });

  // a real warp: walk through the road door to the next town
  const junglee = readTown('junglee');
  await page.evaluate(() => window.__pq!.closeBattle());
  await expect.poll(async () => (await state(page)).battle).toBeNull();
  const from = gear.spawn('junglee-road');
  await warpTo(page, 'gear', 'junglee-road');
  await waitAt(page, 'gear', from);
  await walk(page, roadDirection(gear, from, 'junglee'));
  await waitAt(page, 'junglee', junglee.spawn('gear-road'));
  expect(await motion(page), 'warp').toEqual({ css: 0, canvas: 0, typing: 0, hp: 0 });
});
