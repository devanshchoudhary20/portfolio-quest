import { education, project, skillGroups } from '../content';
import type { JobView } from './view';
import { educationLine, projectHeading, projectHost, projectSummary } from './view';

export const sectionHead = 'font-pixel text-[28px] leading-none font-normal text-ink border-b border-line pb-2 mb-4';

export function JobBlock({ job }: { job: JobView }) {
  const bullets = job.bullets.map((b) => <li key={b.key}>{b.text}</li>);
  const list = bullets.length ? <ul className="mt-2 list-disc space-y-2 pl-5 marker:text-muted">{bullets}</ul> : null;
  return (
    <article className="mb-6 break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-bold text-ink">{job.company}</h3>
        <span className="text-sm text-muted">{job.location}</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-muted">
        <p className="italic">{job.role}</p>
        <p className="text-sm">{job.dates}</p>
      </div>
      {list}
    </article>
  );
}

export function Experience({ jobs }: { jobs: JobView[] }) {
  const blocks = jobs.map((job) => <JobBlock key={job.key} job={job} />);
  return (
    <section id="experience" className="mb-10">
      <h2 className={sectionHead}>Experience</h2>
      {blocks}
    </section>
  );
}

export function SelectedProject() {
  const stack = project.stack.join(', ');
  return (
    <section id="project" className="mb-10">
      <h2 className={sectionHead}>Selected project</h2>
      <h3 className="font-bold text-ink">{projectHeading}</h3>
      <p className="mt-1 text-muted">{stack}</p>
      <p className="mt-2">{projectSummary}</p>
      <p className="mt-2">
        <a className="text-accent underline-offset-2 hover:underline" href={project.url}>
          {projectHost}
        </a>
      </p>
    </section>
  );
}

export function Skills() {
  const groups = skillGroups.map((group) => (
    <div key={group.id} className="mb-4">
      <h3 className="font-bold text-ink">{group.label}</h3>
      <p className="text-[15px] text-muted">{group.items.join(', ')}</p>
    </div>
  ));
  return (
    <section id="skills" className="mb-10">
      <h2 className={sectionHead}>Skills</h2>
      {groups}
    </section>
  );
}

export function Education() {
  return (
    <section id="education" className="mb-10">
      <h2 className={sectionHead}>Education</h2>
      <h3 className="font-bold text-ink">{education.degree}</h3>
      <p className="mt-1 text-muted">{educationLine}</p>
    </section>
  );
}

