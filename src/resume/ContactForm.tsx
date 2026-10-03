import { sectionHead } from './Sections';

const field = 'mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink';

export function ContactForm() {
  return (
    <section id="contact" className="no-print mb-10">
      <h2 className={sectionHead}>Contact</h2>
      <form name="contact" method="POST" action="/resume/sent/" data-netlify="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="contact" />
        <p hidden>
          <label>
            Leave this empty: <input name="bot-field" />
          </label>
        </p>
        <label className="mb-3 block text-sm text-muted">
          Name
          <input className={field} name="name" autoComplete="name" required />
        </label>
        <label className="mb-3 block text-sm text-muted">
          Email
          <input className={field} type="email" name="email" autoComplete="email" required />
        </label>
        <label className="mb-3 block text-sm text-muted">
          Message
          <textarea className={field} name="message" rows={4} minLength={10} required />
        </label>
        <button type="submit" className="cursor-pointer rounded-md bg-accent px-4 py-2 font-bold text-on-accent">
          Send message
        </button>
      </form>
    </section>
  );
}
