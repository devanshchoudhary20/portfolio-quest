import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import { createTallyHandler } from '../lib/tally';
import type { TallyStore } from '../lib/tally';

// built per request: the Blobs context only exists while a request runs
function openStore(): TallyStore {
  const blobs = getStore({ name: 'tally', consistency: 'strong' });
  return {
    getWithMetadata: (key) => blobs.getWithMetadata(key, { type: 'json', consistency: 'strong' }),
    setJSON: (key, value, options) => blobs.setJSON(key, value, options),
    set: (key, value, options) => blobs.set(key, value, options),
    list: (options) => blobs.list(options),
    delete: (key) => blobs.delete(key),
  };
}

export default async (req: Request, context: Context) => createTallyHandler(openStore(), { salt: Netlify.env.get('TALLY_SALT') })(req, context.ip);

export const config: Config = { path: '/api/tally', rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
