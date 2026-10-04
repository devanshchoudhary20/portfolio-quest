export interface ContactDraft {
  name: string;
  email: string;
  message: string;
}

export const EMPTY_DRAFT: ContactDraft = { name: '', email: '', message: '' };
