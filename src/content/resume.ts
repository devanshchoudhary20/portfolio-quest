import { factId, skillGroupId, townId } from './ids';
import type { Education, Job, Profile, Project, SkillGroup } from './types';

export const profile: Profile = {
  name: 'Devansh Choudhary',
  title: 'Frontend Engineer',
  email: 'devanshchoudhary999@gmail.com',
  github: 'https://github.com/devanshchoudhary20',
  linkedin: 'https://www.linkedin.com/in/devansh-choudhary-2381041b1/',
};

export const summaryFactId = factId('agra.summary');

// newest first, the order /resume/ prints
export const jobs: [Job, ...Job[]] = [
  {
    id: townId('testmu'),
    company: 'TestMu AI (formerly LambdaTest)',
    role: 'Member of Technical Staff, Frontend',
    start: 'Nov 2025',
    end: 'now',
    location: 'Noida, India',
    facts: ['testmu.cursor', 'testmu.blocks', 'testmu.save', 'testmu.import', 'testmu.sharing', 'testmu.a11y'].map(factId),
  },
  {
    id: townId('junglee-b'),
    company: 'Junglee Games',
    role: 'Software Engineer I, Frontend',
    start: 'Jan 2025',
    end: 'Nov 2025',
    location: 'Bengaluru, India',
    facts: ['junglee-b.2fa', 'junglee-b.blog'].map(factId),
  },
  {
    id: townId('marrfa'),
    company: 'Marrfa',
    role: 'Frontend Engineer (Contract)',
    start: 'Nov 2024',
    end: 'Jan 2025',
    location: 'Remote',
    facts: [factId('marrfa.dashboard')],
  },
  {
    id: townId('junglee-a'),
    company: 'Junglee Games',
    role: 'Product Analyst',
    start: 'Jun 2023',
    end: 'Jun 2024',
    location: 'Bengaluru, India',
    facts: [factId('junglee-a.ab')],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: skillGroupId('core'),
    label: 'Core',
    items: ['React 18/19', 'TypeScript', 'Next.js 15', 'Redux / Redux Saga / RTK', 'React Query', 'React Router v6', 'Tailwind', 'Shadcn UI'],
    gymBadge: 'Core Badge',
  },
  {
    id: skillGroupId('design-system'),
    label: 'Design System & A11y',
    items: ['Primer (@primer/react)', 'internal component libraries', 'WCAG 2.1 AA', 'ARIA', 'focus management', 'keyboard navigation'],
    gymBadge: 'Design Badge',
  },
  {
    id: skillGroupId('monorepo'),
    label: 'Monorepo & Tooling',
    items: ['Turborepo', 'Yarn Workspaces', 'Webpack', 'Vite', 'Jest', 'MSW', 'Git'],
    gymBadge: 'Tooling Badge',
  },
  {
    id: skillGroupId('cross-stack'),
    label: 'Cross-stack & AI',
    items: ['Go / Python backend contracts', 'feature-flagged rollouts', 'Claude Code'],
    gymBadge: 'Stack Badge',
  },
  {
    id: skillGroupId('backend'),
    label: 'Backend (working knowledge)',
    items: ['Node.js', 'Express', 'REST API design', 'MySQL', 'PostgreSQL', 'Firebase'],
    gymBadge: 'Backend Badge',
  },
];

export const project: Project = {
  id: factId('patch-center.koalalab'),
  name: 'KoalaLab',
  role: 'Sole Frontend Developer',
  url: 'https://koalalab.com/',
  stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind', 'Shadcn UI'],
};

export const education: Education = {
  degree: 'B.Tech, Mechanical Engineering',
  school: 'Indian Institute of Technology Patna',
  start: '2019',
  end: '2023',
};
