import { education, factById, jobs, project, summaryFactId } from '../content';
import type { FactId, Job } from '../content';

export interface JobView {
  key: string;
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: { key: string; text: string }[];
}

// build-time only: a bad id fails the prerender instead of rendering a fallback
function requireFact(id: FactId) {
  const fact = factById.get(id);
  if (!fact) throw new Error(`unknown factId ${id}`);
  return fact;
}

export const formatRange = (start: string, end: string) => `${start} to ${end === 'now' ? 'Present' : end}`;

export function jobView(job: Job, index: number): JobView {
  const bullets = job.facts.map((id) => {
    const fact = requireFact(id);
    return { key: id, text: fact.long ?? fact.short };
  });
  return {
    key: `${job.id}-${index}`,
    company: job.company,
    role: job.role,
    dates: formatRange(job.start, job.end),
    location: job.location,
    bullets,
  };
}

const [current] = jobs;
export const currentRoleLine = `${current.role} at ${current.company}. ${formatRange(current.start, current.end)}.`;

const summaryFact = requireFact(summaryFactId);
export const summaryText = summaryFact.long ?? summaryFact.short;

export const educationLine = `${education.school}, ${formatRange(education.start, education.end)}`;
export const projectHeading = `${project.name}, ${project.role}`;
export const projectHost = new URL(project.url).host.replace(/^www\./, '');
const projectFact = requireFact(project.id);
export const projectSummary = projectFact.long ?? projectFact.short;
