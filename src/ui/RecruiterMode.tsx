import { useEffect, useRef } from 'react';
import { education, jobs, profile, skillGroups } from '../content';
import { contactLinks, currentRoleLine, educationLine, jobView, projectHeading, projectSummary, resumePdfHref, resumePdfName, summaryText } from '../resume/view';
import { CLOSE, DOWNLOAD_PDF, OPEN_FULL_PAGE } from '../game/world/lines';
import { backToMenu } from './usePanel';
import { useCaptureKeys } from './useCaptureKeys';
import { useFocusTrap } from './useFocusTrap';

const CLOSE_KEYS = ['x', 'X'];
const SCROLL_STEP = 48;
const jobViews = jobs.map(jobView);

// the resume as plain content in a focus-trapped panel: the prerendered /resume/ page stays the static source, this reads the same src/content
export function RecruiterMode() {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useFocusTrap(panel, backToMenu);
  useCaptureKeys((event) => {
    if (CLOSE_KEYS.includes(event.key)) backToMenu();
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') panel.current?.scrollBy({ top: event.key === 'ArrowDown' ? SCROLL_STEP : -SCROLL_STEP });
    else if (event.key === 'Enter' || event.key === 'z' || event.key === 'Z') (document.activeElement as HTMLElement | null)?.click();
    else return false;
    return true;
  });

  const jobBlocks = jobViews.map((job) => (
    <article key={job.key}>
      <h3>{`${job.company}, ${job.role}`}</h3>
      <p className="pq-muted">{`${job.dates}. ${job.location}`}</p>
      <ul>
        {job.bullets.map((bullet) => (
          <li key={bullet.key}>{bullet.text}</li>
        ))}
      </ul>
    </article>
  ));
  const contactBlocks = contactLinks.map((link) => (
    <a key={link.label} href={link.href}>
      {link.label}
    </a>
  ));
  const skillBlocks = skillGroups.map((group) => (
    <p key={group.id}>
      <b>{group.label}</b>
      {`: ${group.items.join(', ')}`}
    </p>
  ));

  return (
    <div className="pq-recruiter pq-sheet" role="dialog" aria-modal="true" aria-label="Recruiter Mode">
      <div className="pq-recruiter-scroll" ref={panel}>
        <h2>{profile.name}</h2>
        <p>{`${profile.title}. ${currentRoleLine}`}</p>
        <nav className="pq-recruiter-actions" aria-label="Resume links">
          <a href={resumePdfHref} download={resumePdfName}>
            {DOWNLOAD_PDF}
          </a>
          <a href="/resume/">{OPEN_FULL_PAGE}</a>
          <button type="button" ref={closeButton} onClick={backToMenu}>
            {CLOSE}
          </button>
        </nav>
        <nav className="pq-recruiter-actions" aria-label="Contact">
          {contactBlocks}
        </nav>
        <h3>Summary</h3>
        <p>{summaryText}</p>
        <h3>Experience</h3>
        {jobBlocks}
        <h3>Selected project</h3>
        <p>{`${projectHeading}. ${projectSummary}`}</p>
        <h3>Skills</h3>
        {skillBlocks}
        <h3>Education</h3>
        <p>{`${education.degree}. ${educationLine}`}</p>
      </div>
    </div>
  );
}
