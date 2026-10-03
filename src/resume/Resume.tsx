import { jobs, profile } from '../content';
import { ContactForm } from './ContactForm';
import { Education, Experience, SelectedProject, Skills, sectionHead } from './Sections';
import { contactLinks, currentRoleLine, jobView, mailtoHref, summaryText } from './view';

const btnBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 font-bold no-underline';

export function Resume() {
  const jobViews = jobs.map(jobView);
  const links = contactLinks.map((link) => (
    <a key={link.label} className="text-accent underline-offset-2 hover:underline" href={link.href}>
      {link.label}
    </a>
  ));

  return (
    <>
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1152px] items-center justify-between px-5 py-4 md:px-16">
          <span className="font-pixel text-xl text-muted">Portfolio Quest</span>
          <div className="flex items-center gap-4">
            <button type="button" id="theme-toggle" className="js-only cursor-pointer text-muted">
              Dark theme
            </button>
            <a className="text-accent underline-offset-2 hover:underline" href="/">
              Play the game
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1152px] px-5 pb-16 pt-12 md:px-16">
        <h1 className="font-pixel text-[44px] leading-none font-normal text-ink sm:text-[56px] md:text-[72px]">{profile.name}</h1>
        <p className="mt-6 text-2xl text-muted">{profile.title}</p>
        <p className="mt-4">{currentRoleLine}</p>
        <p className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">{links}</p>
        <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row">
          <a id="download-pdf" className={`${btnBase} bg-accent text-on-accent`} href="/resume.pdf" download>
            Download PDF
          </a>
          <a className={`${btnBase} border-2 border-accent text-accent`} href={mailtoHref}>
            Email me
          </a>
        </div>
        <p id="pdf-notice" role="alert" hidden className="notice mt-3 text-muted">
          The PDF did not load. The full text is on this page.
        </p>
        <div className="mt-12 grid gap-x-14 md:grid-cols-[minmax(0,720px)_1fr]">
          <div>
            <section id="summary" className="mb-10">
              <h2 className={sectionHead}>Summary</h2>
              <p>{summaryText}</p>
            </section>
            <Experience jobs={jobViews} />
            <SelectedProject />
            <ContactForm />
          </div>
          <aside>
            <Skills />
            <Education />
          </aside>
        </div>
      </main>
      <p id="download-toast" role="status" aria-live="polite" hidden className="toast fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-line bg-surface px-4 py-2 text-ink">
        Download started
      </p>
    </>
  );
}
