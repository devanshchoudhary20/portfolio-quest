import { describe, expect, it } from 'vitest';
import { KEY, MAX_BODY_BYTES, createTallyHandler as create } from './tally';
import type { TallyOptions, TallyStore } from './tally';

// an in-memory store with real etag semantics; `before` runs ahead of each write so a test can slip a rival write in
function fakeStore(before?: (store: ReturnType<typeof fakeStore>, write: number) => void) {
  const rows = new Map<string, { data: unknown; etag: string }>();
  const deleted: string[] = [];
  let version = 0;
  let writes = 0;
  const store = {
    rows,
    deleted,
    write(key: string, data: unknown) {
      rows.set(key, { data, etag: `"v${++version}"` });
    },
    async getWithMetadata(key: string) {
      const row = rows.get(key);
      return row ? { ...row } : null;
    },
    async setJSON(key: string, value: unknown, options: { onlyIfMatch: string } | { onlyIfNew: true }) {
      before?.(store, writes++);
      const row = rows.get(key);
      const allowed = 'onlyIfNew' in options ? row === undefined : row?.etag === options.onlyIfMatch;
      if (allowed) store.write(key, value);
      return { modified: allowed };
    },
    async set(key: string, value: string, options: { onlyIfNew: true }) {
      before?.(store, writes++);
      const allowed = options.onlyIfNew && !rows.has(key);
      if (allowed) store.write(key, value);
      return { modified: allowed };
    },
    async list({ prefix }: { prefix: string }) {
      return { blobs: [...rows.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) };
    },
    async delete(key: string) {
      deleted.push(key);
      rows.delete(key);
    },
  } satisfies TallyStore & Record<string, unknown>;
  return store;
}

// each call gets a fresh ip unless one is given, so older tests keep counting every vote
const SALT = 'test-salt';
let nextIp = 0;
const createTallyHandler = (store: TallyStore, options: TallyOptions = {}) => {
  const handler = create(store, { salt: SALT, random: () => 1, ...options });
  return (req: Request, ip = `10.0.0.${++nextIp}`) => handler(req, ip);
};

const post = (body: string) => new Request('http://x/api/tally', { method: 'POST', body });
const get = () => new Request('http://x/api/tally');

describe('tally handler', () => {
  it('reads zeros from an empty store', async () => {
    const res = await createTallyHandler(fakeStore())(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 0, b: 0 });
  });

  it('counts path a and path b', async () => {
    const store = fakeStore();
    const handler = createTallyHandler(store);
    expect(await (await handler(post('{"path":"a"}'))).json()).toEqual({ a: 1, b: 0 });
    expect(await (await handler(post('{"path":"b"}'))).json()).toEqual({ a: 1, b: 1 });
    expect(await (await handler(post('{"path":"a"}'))).json()).toEqual({ a: 2, b: 1 });
    expect(await (await handler(get())).json()).toEqual({ a: 2, b: 1 });
    expect(store.rows.get(KEY)?.data).toEqual({ a: 2, b: 1 });
  });

  it.each(['', 'nope', '[]', 'null', '{"path":"c"}', '{"path":"a","extra":1}', '{"path":1}', '{}'])('rejects the body %j with 400', async (body) => {
    const res = await createTallyHandler(fakeStore())(post(body));
    expect(res.status).toBe(400);
  });

  it('rejects a body over the cap with 413 and leaves the store alone', async () => {
    const store = fakeStore();
    const res = await createTallyHandler(store)(post(`{"path":"a","pad":"${'x'.repeat(MAX_BODY_BYTES)}"}`));
    expect(res.status).toBe(413);
    expect(store.rows.size).toBe(0);
  });

  // a chunked body carries no content-length, so only the counted bytes can enforce the cap
  const chunked = (chunks: Uint8Array[], onCancel = () => undefined) => {
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        const next = chunks.shift();
        if (next) controller.enqueue(next);
        else controller.close();
      },
      cancel: onCancel,
    });
    return new Request('http://x/api/tally', { method: 'POST', body, duplex: 'half' } as RequestInit);
  };
  const bytes = (text: string) => new TextEncoder().encode(text);

  it('rejects a chunked body over the cap with 413, cancels the stream, and leaves the store alone', async () => {
    const store = fakeStore();
    let cancelled = false;
    const req = chunked([bytes('x'.repeat(200)), bytes('x'.repeat(200)), bytes('x'.repeat(200))], () => void (cancelled = true));
    expect((await createTallyHandler(store)(req)).status).toBe(413);
    expect(cancelled).toBe(true);
    expect(store.rows.size).toBe(0);
  });

  it('counts bytes, not characters, so a multibyte body under the character cap is still too large', async () => {
    const body = JSON.stringify({ path: 'a', pad: '€'.repeat(100) });
    expect(body.length).toBeLessThan(MAX_BODY_BYTES);
    expect((await createTallyHandler(fakeStore())(post(body))).status).toBe(413);
  });

  it('accepts a chunked body split across chunks, and decodes a split multibyte character whole', async () => {
    const whole = bytes('{"path":"a"}');
    const store = fakeStore();
    const res = await createTallyHandler(store)(chunked([whole.slice(0, 5), whole.slice(5)]));
    expect(await res.json()).toEqual({ a: 1, b: 0 });
    const split = bytes('{"path":"é"}');
    expect((await createTallyHandler(fakeStore())(chunked([split.slice(0, 10), split.slice(10)]))).status).toBe(400);
  });

  it.each(['PUT', 'DELETE', 'PATCH'])('rejects %s with 405', async (method) => {
    const res = await createTallyHandler(fakeStore())(new Request('http://x/api/tally', { method }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, POST');
  });

  it('retries after a lost race and succeeds without losing the rival vote', async () => {
    const store = fakeStore((s, write) => {
      if (write === 1) s.write(KEY, { a: 5, b: 0 });
    });
    store.write(KEY, { a: 4, b: 0 });
    const res = await createTallyHandler(store)(post('{"path":"a"}'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 6, b: 0 });
  });

  it('gives 503 after three lost races and writes nothing of its own', async () => {
    const store = fakeStore((s) => s.write(KEY, { a: 9, b: 9 }));
    store.write(KEY, { a: 9, b: 9 });
    const res = await createTallyHandler(store)(post('{"path":"b"}'));
    expect(res.status).toBe(503);
    expect(store.rows.get(KEY)?.data).toEqual({ a: 9, b: 9 });
  });

  it('keeps a stored zero as zero', async () => {
    const store = fakeStore();
    store.write(KEY, { a: 0, b: 4 });
    expect(await (await createTallyHandler(store)(get())).json()).toEqual({ a: 0, b: 4 });
  });

  it('reads damaged stored counts as zero', async () => {
    const store = fakeStore();
    store.write(KEY, { a: 'x', b: -3 });
    expect(await (await createTallyHandler(store)(get())).json()).toEqual({ a: 0, b: 0 });
  });
});

describe('one vote per visitor per day', () => {
  const vote = '{"path":"a"}';
  const day = (iso: string) => ({ now: () => new Date(`${iso}T12:00:00Z`) });

  it('counts the same ip once in a day and still answers 200 with the counts', async () => {
    const handler = createTallyHandler(fakeStore());
    await handler(post(vote), '1.2.3.4');
    const again = await handler(post(vote), '1.2.3.4');
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ a: 1, b: 0 });
  });

  it('counts two ips twice', async () => {
    const handler = createTallyHandler(fakeStore());
    await handler(post(vote), '1.2.3.4');
    expect(await (await handler(post(vote), '5.6.7.8')).json()).toEqual({ a: 2, b: 0 });
  });

  it('counts the same ip again the next day', async () => {
    const store = fakeStore();
    await createTallyHandler(store, day('2026-10-04'))(post(vote), '1.2.3.4');
    const next = await createTallyHandler(store, day('2026-10-05'))(post(vote), '1.2.3.4');
    expect(await next.json()).toEqual({ a: 2, b: 0 });
  });

  it('fails closed with 503 and writes nothing when the salt is missing, but GET still works', async () => {
    const store = fakeStore();
    const handler = createTallyHandler(store, { salt: '' });
    expect((await handler(post(vote), '1.2.3.4')).status).toBe(503);
    expect(store.rows.size).toBe(0);
    expect((await handler(get())).status).toBe(200);
  });

  it('releases the voter key when the increment gives up, so a retry can count', async () => {
    const store = fakeStore((s, write) => {
      if (write > 0) s.write(KEY, { a: 9, b: 9 });
    });
    store.write(KEY, { a: 9, b: 9 });
    const handler = createTallyHandler(store);
    expect((await handler(post(vote), '1.2.3.4')).status).toBe(503);
    expect([...store.rows.keys()]).toEqual([KEY]);
  });

  it('prunes only voter keys dated before yesterday', async () => {
    const store = fakeStore();
    const old = ['voters/2026-10-01/aa', 'voters/2026-10-02/bb'];
    const keep = ['voters/2026-10-03/cc', 'voters/2026-10-04/dd'];
    [...old, ...keep].forEach((key) => store.write(key, '1'));
    await createTallyHandler(store, { ...day('2026-10-04'), random: () => 0 })(post(vote), '1.2.3.4');
    expect(store.deleted.sort()).toEqual(old);
    expect(store.rows.has(KEY)).toBe(true);
    keep.forEach((key) => expect(store.rows.has(key)).toBe(true));
  });

  it('caps pruning at 50 deletes per call', async () => {
    const store = fakeStore();
    for (let i = 0; i < 60; i++) store.write(`voters/2026-09-01/${i}`, '1');
    await createTallyHandler(store, { ...day('2026-10-04'), random: () => 0 })(post(vote), '1.2.3.4');
    expect(store.deleted).toHaveLength(50);
  });

  it('does not let a failing prune break the vote', async () => {
    const store = fakeStore();
    store.list = async () => {
      throw new Error('boom');
    };
    const res = await createTallyHandler(store, { random: () => 0 })(post(vote), '1.2.3.4');
    expect(await res.json()).toEqual({ a: 1, b: 0 });
  });

  it('never stores the raw ip in a key or a value', async () => {
    const store = fakeStore();
    const ip = '203.0.113.77';
    await createTallyHandler(store)(post(vote), ip);
    const stored = JSON.stringify([...store.rows.entries()]);
    expect(stored).not.toContain(ip);
    expect([...store.rows.keys()].some((key) => /^voters\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{64}$/.test(key))).toBe(true);
  });
});
