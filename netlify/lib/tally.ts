// the slice of a Netlify Blobs store the tally uses, so a test can pass an in-memory one
export interface TallyStore {
  getWithMetadata(key: string, options: { type: 'json'; consistency: 'strong' }): Promise<{ data: unknown; etag?: string } | null>;
  setJSON(key: string, value: unknown, options: { onlyIfMatch: string } | { onlyIfNew: true }): Promise<{ modified: boolean }>;
  set(key: string, value: string, options: { onlyIfNew: true }): Promise<{ modified: boolean }>;
  list(options: { prefix: string }): Promise<{ blobs: { key: string }[] }>;
  delete(key: string): Promise<void>;
}

export interface TallyOptions {
  salt?: string;
  now?: () => Date;
  random?: () => number;
}

export type AbPath = 'a' | 'b';

export type Counts = Record<AbPath, number>;

export const KEY = 'junglee-path';
export const MAX_BODY_BYTES = 256;
const ATTEMPTS = 3;
const VOTER_PREFIX = 'voters/';
const PRUNE_CHANCE = 1 / 20;
const PRUNE_CAP = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

const count = (value: unknown) => (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0);

const toCounts = (data: unknown): Counts => {
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  return { a: count(record.a), b: count(record.b) };
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });

// the body must be exactly {"path":"a"} or {"path":"b"}
const parsePath = (text: string): AbPath | null => {
  try {
    const body: unknown = JSON.parse(text);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const keys = Object.keys(body);
    const path = (body as Record<string, unknown>).path;
    return keys.length === 1 && (path === 'a' || path === 'b') ? path : null;
  } catch {
    return null;
  }
};

// the content-length header can be missing or a lie, so the bytes are counted as they arrive; null means over the cap
async function readCapped(req: Request): Promise<string | null> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function read(store: TallyStore) {
  const found = await store.getWithMetadata(KEY, { type: 'json', consistency: 'strong' });
  return { counts: toCounts(found?.data), etag: found?.etag };
}

// read with the etag, add one, and write only if nobody else wrote in between; a lost race re-reads
async function increment(store: TallyStore, path: AbPath): Promise<Counts | null> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const { counts, etag } = await read(store);
    const next = { ...counts, [path]: counts[path] + 1 };
    const { modified } = await store.setJSON(KEY, next, etag === undefined ? { onlyIfNew: true } : { onlyIfMatch: etag });
    if (modified) return next;
  }
  return null;
}

const encoder = new TextEncoder();

async function hmac(key: ArrayBuffer | string, message: string): Promise<ArrayBuffer> {
  const raw = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

const utcDate = (date: Date) => date.toISOString().slice(0, 10);

// one key per visitor per UTC day; the raw ip is hashed with a daily key and never stored
async function voterKey(salt: string, ip: string, day: string): Promise<string> {
  const dailyKey = await hmac(salt, day);
  return `${VOTER_PREFIX}${day}/${toHex(await hmac(dailyKey, ip))}`;
}

// housekeeping only: any failure is swallowed so a vote never fails because of it
async function pruneVoters(store: TallyStore, now: Date): Promise<void> {
  try {
    const cutoff = utcDate(new Date(now.getTime() - DAY_MS));
    const { blobs } = await store.list({ prefix: VOTER_PREFIX });
    const old = blobs.filter(({ key }) => key.slice(VOTER_PREFIX.length, VOTER_PREFIX.length + 10) < cutoff).slice(0, PRUNE_CAP);
    await Promise.all(old.map(({ key }) => store.delete(key)));
  } catch {
    // ignored on purpose
  }
}

export const createTallyHandler = (store: TallyStore, { salt, now = () => new Date(), random = Math.random }: TallyOptions = {}) => async (req: Request, ip = ''): Promise<Response> => {
  if (req.method === 'GET') return json((await read(store)).counts);
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, { allow: 'GET, POST' });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return json({ error: 'body too large' }, 413);
  const text = await readCapped(req);
  if (text === null) return json({ error: 'body too large' }, 413);
  const path = parsePath(text);
  if (!path) return json({ error: 'body must be {"path":"a"} or {"path":"b"}' }, 400);
  // without a salt or an ip the dedupe cannot work, so refuse rather than count unguarded
  if (!salt || !ip) return json({ error: 'voting unavailable' }, 503);
  const today = now();
  const voter = await voterKey(salt, ip, utcDate(today));
  const { modified: isNewVoter } = await store.set(voter, '1', { onlyIfNew: true });
  if (!isNewVoter) return json((await read(store)).counts);
  const counts = await increment(store, path);
  if (!counts) {
    // three lost races in a row: a transient overload, so free the voter key and the caller may retry
    await store.delete(voter);
    return json({ error: 'busy, try again' }, 503, { 'retry-after': '1' });
  }
  if (random() < PRUNE_CHANCE) await pruneVoters(store, today);
  return json(counts);
};
