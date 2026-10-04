import type { ContactDraft } from './draft';
import { EMAIL_ERROR, MESSAGE_ERROR, MESSAGE_MIN, NAME_ERROR } from '../game/world/lines';

export type SendResult = 'sent' | 'limited' | 'failed';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// the message under each invalid field; an empty object means the draft can be sent
export function contactErrors(draft: ContactDraft): Partial<Record<keyof ContactDraft, string>> {
  return {
    ...(draft.name.trim() === '' ? { name: NAME_ERROR } : {}),
    ...(EMAIL.test(draft.email.trim()) ? {} : { email: EMAIL_ERROR }),
    ...(draft.message.trim().length < MESSAGE_MIN ? { message: MESSAGE_ERROR } : {}),
  };
}

// the fields of the static form on /resume/, which is what registers `contact` with Netlify at build
export const contactBody = (draft: ContactDraft, botField: string) =>
  new URLSearchParams({ 'form-name': 'contact', name: draft.name.trim(), email: draft.email.trim(), message: draft.message.trim(), 'bot-field': botField }).toString();

// Netlify Forms answers a urlencoded POST to "/"; any non-2xx or a dropped connection is a failure, 429 is the rate limit
export async function sendContact(draft: ContactDraft, botField: string): Promise<SendResult> {
  try {
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: contactBody(draft, botField) });
    if (res.status === 429) return 'limited';
    return res.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
