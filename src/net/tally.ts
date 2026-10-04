import { FLAGS } from '../game/world/flags';
import { store } from '../state/store';
import type { AbPath, Counts } from '../../netlify/lib/tally';

export const TALLY_URL = '/api/tally';

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

// anything but two real counts is no tally: the dev server answers with a page, an outage or a 429 with an error body
export async function fetchTally(): Promise<Counts | null> {
  try {
    const res = await fetch(TALLY_URL, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return null;
    const { a, b } = body as Record<string, unknown>;
    return isCount(a) && isCount(b) ? { a, b } : null;
  } catch {
    return null;
  }
}

// a 429 is a quiet drop: the vote stays marked, so a throttled visitor does not retry on every step
async function sendVote(path: AbPath): Promise<boolean> {
  try {
    // keepalive lets a reload mid-request still deliver the vote
    const res = await fetch(TALLY_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path }), keepalive: true });
    return res.ok || res.status === 429;
  } catch {
    return false;
  }
}

// sends the visitor's path once per save
export async function castVote(path: AbPath) {
  const { flags, actions } = store.getState();
  if (flags.includes(FLAGS.abVoted)) return;
  // marked before the request so a second step into the path cannot send twice; a failed send unmarks it
  actions.addFlag(FLAGS.abVoted);
  if (!(await sendVote(path))) actions.removeFlag(FLAGS.abVoted);
}
