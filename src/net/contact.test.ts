import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ContactForm } from '../resume/ContactForm';
import { contactBody, contactErrors } from './contact';

describe('contact form', () => {
  it('sends exactly the fields of the static form that registers `contact` with Netlify at build', () => {
    const markup = renderToStaticMarkup(createElement(ContactForm));
    const registered = [...markup.matchAll(/<(?:input|textarea)[^>]*\sname="([^"]+)"/g)].map((match) => match[1]).sort();
    const sent = [...new URLSearchParams(contactBody({ name: 'n', email: 'e@e.co', message: 'm'.repeat(10) }, '')).keys()].sort();
    expect(sent).toEqual(registered);
    expect(markup).toContain('data-netlify="true"');
    expect(markup).toContain('data-netlify-honeypot="bot-field"');
  });

  it('flags a short message, a bad email and a blank name', () => {
    expect(Object.keys(contactErrors({ name: ' ', email: 'ada@company', message: 'too short' })).sort()).toEqual(['email', 'message', 'name']);
    expect(contactErrors({ name: 'Ada', email: 'ada@company.com', message: '0123456789' })).toEqual({});
  });
});
