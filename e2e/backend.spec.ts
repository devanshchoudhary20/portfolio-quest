import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { EMAIL_ERROR, MESSAGE_ERROR, NAME_ERROR, SEND_FAILED, abTally, messageSent } from '../src/game/world/lines';
import { factById, factId } from '../src/content';
import { continueWith, interact, named, readDialog, savedWith, standAt, state, storedSave, talkTo } from './helpers';
import { readTown, standingSpot } from './world';

// instant text: the Analyst's tally line must arrive while its fact is still on screen
test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('pq.prefs.v1', JSON.stringify({ textSpeed: 4 }))));

const gear = readTown('gear');
const junglee = readTown('junglee');
const elite = readTown('elite');
const BADGES = ['badge.core', 'badge.design-system', 'badge.monorepo'];
const MESSAGE = 'Hello Devansh, we are hiring a frontend engineer.';

const isForm = (url: URL) => url.pathname === '/';
const isTally = (url: URL) => url.pathname === '/api/tally';

// the nurse says her fact, then the Patch Center opens
async function openContact(page: Page) {
  await continueWith(page, savedWith('gear', gear.spawn('patch-in'), 'up', { starter: 'react' }));
  await talkTo(page, gear, 'nurse');
  await expect(page.getByRole('dialog', { name: 'Patch Center' })).toBeVisible();
}

const field = (page: Page, name: 'name' | 'email' | 'message') => page.locator(`.pq-contact [name="${name}"]`);

async function fill(page: Page, message = MESSAGE) {
  await field(page, 'name').fill('Ada Lovelace');
  await field(page, 'email').fill('ada@company.com');
  await field(page, 'message').fill(message);
}

// answers the form POST with `reply` and records every body sent
function mockForm(page: Page, reply: (route: Route) => Promise<void>) {
  const sent: { body: string; type: string | undefined }[] = [];
  const ready = page.route(isForm, async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') return route.continue();
    sent.push({ body: request.postData() ?? '', type: request.headers()['content-type'] });
    return reply(route);
  });
  return { sent, ready };
}

const send = (page: Page) => page.getByRole('button', { name: /^(Send message|Sending\.\.\.)$/ });

test.describe('Patch Center contact form', () => {
  test('the nurse tells her fact, then the form opens; the static form has the same fields', async ({ page }) => {
    await openContact(page);
    await expect(page.getByRole('dialog', { name: 'Patch Center' }).getByRole('heading', { name: 'KoalaLab' })).toBeVisible();
    await expect(field(page, 'name')).toBeFocused();
  });

  test('validation blocks a short message and an empty form, with the fix under each field', async ({ page }) => {
    const form = mockForm(page, (route) => route.fulfill({ status: 200 }));
    await form.ready;
    await openContact(page);
    await send(page).click();
    await expect(page.getByText(NAME_ERROR)).toBeVisible();
    await expect(page.getByText(EMAIL_ERROR)).toBeVisible();
    await expect(page.getByText(MESSAGE_ERROR)).toBeVisible();
    await fill(page, 'too short');
    await expect(page.getByText(NAME_ERROR)).toBeHidden();
    await send(page).click();
    await expect(page.getByText(MESSAGE_ERROR)).toBeVisible();
    expect(form.sent).toHaveLength(0);
  });

  test('a send posts the Netlify fields urlencoded, then shows the success state', async ({ page }) => {
    const form = mockForm(page, (route) => route.fulfill({ status: 200, body: '' }));
    await form.ready;
    await openContact(page);
    await fill(page);
    await send(page).click();
    await expect(page.locator('.pq-contact').getByText(messageSent('ada@company.com'))).toBeVisible();
    expect(form.sent).toHaveLength(1);
    expect(form.sent[0]?.type).toBe('application/x-www-form-urlencoded');
    expect(Object.fromEntries(new URLSearchParams(form.sent[0]?.body))).toEqual({
      'form-name': 'contact',
      name: 'Ada Lovelace',
      email: 'ada@company.com',
      message: MESSAGE,
      'bot-field': '',
    });
    await expect(page.getByRole('button', { name: 'Send another' })).toBeFocused();
    await expect(page.locator('.pq-sr')).toHaveText(messageSent('ada@company.com'));
    await page.getByRole('button', { name: 'Send another' }).click();
    await expect(field(page, 'message')).toHaveValue('');
    await expect(field(page, 'name')).toBeFocused();
    await expect(page.locator('.pq-sr')).toHaveText('');
  });

  test('the sending state disables the button and locks the fields', async ({ page }) => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const form = mockForm(page, async (route) => {
      await gate;
      await route.fulfill({ status: 200 });
    });
    await form.ready;
    await openContact(page);
    await fill(page);
    await send(page).click();
    await expect(page.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    await expect(field(page, 'message')).toHaveAttribute('readonly', '');
    release();
    await expect(page.locator('.pq-contact').getByText(messageSent('ada@company.com'))).toBeVisible();
  });

  for (const [label, reply] of [
    ['a 500', (route: Route) => route.fulfill({ status: 500 })],
    ['a network failure', (route: Route) => route.abort('failed')],
  ] as const) {
    test(`${label} shows the error, keeps the text, and survives close and reopen without touching storage`, async ({ page }) => {
      const form = mockForm(page, reply);
      await form.ready;
      await openContact(page);
      await fill(page);
      await send(page).click();
      await expect(page.getByRole('alert')).toHaveText(SEND_FAILED);
      await expect(send(page)).toBeEnabled();
      await expect(field(page, 'message')).toHaveValue(MESSAGE);
      expect(form.sent).toHaveLength(1);

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Patch Center' })).toBeHidden();
      await talkTo(page, gear, 'nurse');
      await expect(field(page, 'name')).toHaveValue('Ada Lovelace');
      await expect(field(page, 'message')).toHaveValue(MESSAGE);
      const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
      expect(stored).not.toContain('Ada Lovelace');
      expect(stored).not.toContain('hiring');
    });
  }

  test('a filled honeypot is still sent, carrying the value so Netlify marks it as spam', async ({ page }) => {
    const form = mockForm(page, (route) => route.fulfill({ status: 200 }));
    await form.ready;
    await openContact(page);
    await fill(page);
    // a bot fills what a person cannot see: set the value the way the browser does, then fire the input event
    await page.locator('.pq-contact [name="bot-field"]').evaluate((input: HTMLInputElement) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, 'i am a bot');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await send(page).click();
    await expect(page.locator('.pq-contact').getByText(messageSent('ada@company.com'))).toBeVisible();
    expect(new URLSearchParams(form.sent[0]?.body).get('bot-field')).toBe('i am a bot');
  });

  test('typing x and z in a field does not close the panel, and Tab stays inside', async ({ page }) => {
    await openContact(page);
    await field(page, 'message').click();
    await page.keyboard.type('xz zx');
    await expect(field(page, 'message')).toHaveValue('xz zx');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]')?.getAttribute('aria-label'))).toBe('Patch Center');
    }
  });

  test('the Hall of Fame Send a message button opens the form and Esc returns to the Hall', async ({ page }) => {
    await continueWith(page, savedWith('elite', elite.spawn('devansh-out'), 'up', { flags: BADGES, starter: 'react' }));
    await standAt(page, elite.spawn('hall-in'), 'up');
    const hall = page.getByRole('dialog', { name: 'Hall of Fame' });
    await hall.getByRole('button', { name: 'Send a message' }).click();
    await expect(page.getByRole('dialog', { name: 'Patch Center' })).toBeVisible();
    await expect(hall).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(hall).toBeVisible();
    await expect(hall.getByRole('link', { name: 'Email me' })).toBeFocused();
  });
});

test.describe('A/B tally', () => {
  const fork = async (page: Page) => continueWith(page, savedWith('junglee', junglee.spawn('default'), 'right', { starter: 'react' }));
  const countVotes = (page: Page) => {
    const posts: string[] = [];
    const ready = page.route(isTally, (route) => {
      const request = route.request();
      if (request.method() !== 'POST') return route.fulfill({ status: 500 });
      posts.push(request.postData() ?? '');
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"a":1,"b":0}' });
    });
    return { posts, ready };
  };

  test('entering a path posts the vote once per save', async ({ page }) => {
    const votes = countVotes(page);
    await votes.ready;
    await fork(page);
    await standAt(page, { x: 9, y: 11 }, 'up');
    await expect.poll(() => votes.posts).toEqual(['{"path":"a"}']);
    expect((await state(page)).flags).toContain('ab.voted');
    // leave, re-enter, and take the other path: nothing more is sent
    await standAt(page, { x: 9, y: 16 }, 'right');
    await standAt(page, { x: 9, y: 11 }, 'up');
    await standAt(page, { x: 9, y: 22 }, 'down');
    await page.waitForTimeout(400);
    expect(votes.posts).toHaveLength(1);
    // the flag rides in the save, so Continue does not vote again
    await expect.poll(async () => (await storedSave(page))?.flags).toContain('ab.voted');
  });

  test('a failed vote is not marked, so the next entry tries again', async ({ page }) => {
    let posts = 0;
    await page.route(isTally, (route) => {
      posts++;
      return route.fulfill({ status: 503 });
    });
    await fork(page);
    await standAt(page, { x: 9, y: 22 }, 'down');
    await expect.poll(() => posts).toBe(1);
    await expect.poll(async () => (await state(page)).flags).not.toContain('ab.voted');
  });

  test('a rate-limited vote stays marked and sends nothing more', async ({ page }) => {
    let posts = 0;
    await page.route(isTally, (route) => {
      posts++;
      return route.fulfill({ status: 429 });
    });
    await fork(page);
    await standAt(page, { x: 9, y: 22 }, 'down');
    await expect.poll(() => posts).toBe(1);
    await expect.poll(async () => (await state(page)).flags).toContain('ab.voted');
    await standAt(page, { x: 9, y: 11 }, 'up');
    await page.waitForTimeout(400);
    expect(posts).toBe(1);
  });

  const talkToAnalyst = async (page: Page) => {
    const { tile, facing } = standingSpot(junglee, named(junglee, 'analyst'));
    await standAt(page, tile, facing);
    const asked = page.waitForRequest((req) => isTally(new URL(req.url())));
    await interact(page);
    await asked;
    // the answer lands while the fact is still on screen
    await page.waitForTimeout(300);
    return readDialog(page);
  };
  const fact = factById.get(factId('junglee-a.ab'))?.short ?? '';

  test('the Analyst reads the live split after his fact', async ({ page }) => {
    await page.route(isTally, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"a":132,"b":81}' }));
    await fork(page);
    const lines = await talkToAnalyst(page);
    expect(lines).toEqual([fact, abTally(132, 81)]);
    expect(abTally(132, 81)).toBe('Visitors so far: path A 62%, path B 38% (n = 213).');
  });

  for (const [label, reply] of [
    ['a 500', (route: Route) => route.fulfill({ status: 500, body: 'down' })],
    ['an offline network', (route: Route) => route.abort('internetdisconnected')],
    ['an HTML page from the dev server', (route: Route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html>' })],
    ['counts that are not numbers', (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"a":null,"b":"x"}' })],
    ['an empty tally', (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"a":0,"b":0}' })],
  ] as const) {
    test(`the Analyst shows no tally line on ${label}`, async ({ page }) => {
      await page.route(isTally, reply);
      await fork(page);
      expect(await talkToAnalyst(page)).toEqual([fact]);
    });
  }
});
