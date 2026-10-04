import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { startAt, state, warpTo } from './helpers';

interface Log {
  created: number;
  calls: string[];
}
const log = (page: Page) => page.evaluate(() => (window as unknown as { __audio: Log }).__audio);
const count = async (page: Page, call: string) => (await log(page)).calls.filter((c) => c === call).length;

const AUDIO = /\/assets\/audio\//;
let requests: string[] = [];

// a fake AudioContext that records what the game does with it, and a tab whose visibility the test controls
test.beforeEach(async ({ page }) => {
  requests = [];
  page.on('request', (request) => {
    if (AUDIO.test(request.url())) requests.push(new URL(request.url()).pathname);
  });
  await page.addInitScript(() => {
    const record: Log = { created: 0, calls: [] };
    (window as unknown as { __audio: Log }).__audio = record;
    const param = () => ({
      value: 1,
      cancelScheduledValues() {},
      setValueAtTime(v: number) {
        record.calls.push(`set:${v}`);
      },
      linearRampToValueAtTime(v: number) {
        record.calls.push(`ramp:${v}`);
      },
      setValueCurveAtTime() {
        record.calls.push('curve');
      },
    });
    class FakeContext {
      state = 'running';
      destination = {};
      constructor() {
        record.created += 1;
      }
      get currentTime() {
        return performance.now() / 1000;
      }
      createGain() {
        return { gain: param(), connect() {}, disconnect() {} };
      }
      createBufferSource() {
        return {
          loop: false,
          loopStart: 0,
          loopEnd: 0,
          connect() {},
          start() {
            record.calls.push('start');
          },
          stop() {
            record.calls.push('stop');
          },
        };
      }
      decodeAudioData() {
        return Promise.resolve({ duration: 2 });
      }
      resume() {
        this.state = 'running';
        record.calls.push('resume');
        return Promise.resolve();
      }
      suspend() {
        this.state = 'suspended';
        record.calls.push('suspend');
        return Promise.resolve();
      }
      close() {
        record.calls.push('close');
        return Promise.resolve();
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => Boolean((window as unknown as { __hidden?: boolean }).__hidden) });
  });
});

const soundOn = (page: Page) => page.addInitScript(() => localStorage.setItem('pq.prefs.v1', JSON.stringify({ sound: true })));
const hide = (page: Page, hidden: boolean) =>
  page.evaluate((value) => {
    (window as unknown as { __hidden: boolean }).__hidden = value;
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
const gesture = (page: Page) => page.keyboard.press('Shift');

test('with Sound Off nothing is created or requested, gestures and warps included', async ({ page }) => {
  await startAt(page, '/?warp=agra');
  await gesture(page);
  await warpTo(page, 'gear');
  await expect.poll(async () => (await state(page)).town).toBe('gear');
  await page.keyboard.press('Enter', { delay: 70 });
  await page.waitForTimeout(600);
  expect((await log(page)).created).toBe(0);
  expect(requests).toEqual([]);
});

test('with Sound On nothing happens before a gesture, then entering Gear City requests gear once', async ({ page }) => {
  await soundOn(page);
  await startAt(page, '/?warp=agra');
  await page.waitForTimeout(500);
  expect((await log(page)).created).toBe(0);
  expect(requests).toEqual([]);

  await gesture(page);
  await expect.poll(() => requests.some((r) => /music\/agra\.(m4a|ogg)$/.test(r))).toBe(true);
  expect((await log(page)).created).toBe(1);

  await warpTo(page, 'gear');
  await expect.poll(() => requests.filter((r) => /music\/gear\.(m4a|ogg)$/.test(r)).length).toBe(1);
  await expect.poll(() => count(page, 'start')).toBeGreaterThanOrEqual(2);
  // coming back later reuses the cached file
  await warpTo(page, 'agra');
  await page.waitForTimeout(500);
  await warpTo(page, 'gear');
  await page.waitForTimeout(500);
  expect(requests.filter((r) => /music\/gear\./.test(r))).toHaveLength(1);
});

test('a badge plays its jingle and ducks the music', async ({ page }) => {
  await soundOn(page);
  await startAt(page, '/?warp=gear');
  await gesture(page);
  await expect.poll(() => count(page, 'start')).toBeGreaterThanOrEqual(1);
  const before = await count(page, 'start');
  await page.evaluate(() => window.__pq!.grant('badge.core'));
  await expect.poll(() => requests.some((r) => /sfx\/badge\.(m4a|ogg)$/.test(r))).toBe(true);
  await expect.poll(() => count(page, 'start')).toBe(before + 1);
  await expect.poll(async () => (await log(page)).calls.includes('ramp:0.2')).toBe(true);
});

test('hiding the tab suspends and showing it resumes', async ({ page }) => {
  await soundOn(page);
  await startAt(page, '/?warp=gear');
  await gesture(page);
  await expect.poll(() => count(page, 'start')).toBe(1);
  await hide(page, true);
  await expect.poll(() => count(page, 'suspend')).toBe(1);
  await hide(page, false);
  await expect.poll(() => count(page, 'resume')).toBeGreaterThanOrEqual(1);
});

test('turning Sound off in the Options stops everything and closes the context', async ({ page }) => {
  await soundOn(page);
  await startAt(page, '/?warp=gear');
  await gesture(page);
  await expect.poll(() => count(page, 'start')).toBe(1);
  await page.keyboard.press('Enter', { delay: 70 });
  await page.getByRole('menuitem', { name: 'Options' }).click();
  await page.getByRole('menuitem', { name: 'Sound: On' }).click();
  await expect(page.getByRole('menuitem', { name: 'Sound: Off' })).toBeVisible();
  await expect.poll(() => count(page, 'close')).toBe(1);
  expect(await count(page, 'stop')).toBeGreaterThanOrEqual(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pq.prefs.v1') ?? '{}').sound)).toBe(false);
  const before = requests.length;
  await warpTo(page, 'agra');
  await page.waitForTimeout(500);
  expect(requests).toHaveLength(before);
  expect((await log(page)).created).toBe(1);
});

test('the title Options sheet holds the Sound choice, Off by default, and keeps it in the prefs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Options' }).click();
  const sheet = page.getByRole('dialog', { name: 'Options' });
  await expect(sheet.getByRole('radio', { name: 'Off' })).toBeChecked();
  await sheet.getByRole('radio', { name: 'On' }).check();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pq.prefs.v1') ?? '{}'))).toMatchObject({ sound: true });
  await sheet.getByRole('radio', { name: 'Fast' }).check();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pq.prefs.v1') ?? '{}'))).toMatchObject({ sound: true, textSpeed: 3 });
  // turning it on in the sheet only counts as a gesture once the visitor acts: the check itself is one
  await expect.poll(async () => (await log(page)).created).toBe(1);
});

test('walking into a wall plays the bump sound', async ({ page }) => {
  await soundOn(page);
  await startAt(page, '/?warp=agra');
  await gesture(page);
  await expect.poll(() => count(page, 'start')).toBe(1);
  // the map edge is solid: hold left until the player stands against it
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => requests.some((r) => /sfx\/bump\.(m4a|ogg)$/.test(r)), { timeout: 20_000 }).toBe(true);
  await page.keyboard.up('ArrowLeft');
});
