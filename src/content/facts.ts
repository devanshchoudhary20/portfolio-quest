import { factId, skillGroupId, townId } from './ids';
import type { TownKey } from './ids';
import { skillGroups } from './resume';
import type { Fact } from './types';

const f = (id: string, town: TownKey, short: string, long?: string, tags?: string[]): Fact => ({
  id: factId(id),
  town: townId(town),
  short,
  ...(long ? { long } : {}),
  ...(tags ? { tags: tags.map(skillGroupId) } : {}),
});

const skillFacts = skillGroups.map(
  (group): Fact => ({ id: factId(`skill.${group.id}`), town: group.town, short: `${group.label}: ${group.items.join(', ')}.`, tags: [group.id] }),
);

export const facts: Fact[] = [
  f(
    'agra.summary',
    'agra',
    'Frontend engineer (React, TypeScript) at LambdaTest, on KaneAI\'s AI test-authoring editor.',
    'Frontend engineer (React, TypeScript) at LambdaTest, on KaneAI\'s AI test-authoring editor. I build the stateful core of an editor whose content an LLM keeps rewriting, and work across the Go and Python services behind it.',
  ),
  f('gear.btech', 'gear', 'B.Tech in Mechanical Engineering, Indian Institute of Technology Patna, 2019 to 2023.'),
  f('gear.leetcode', 'gear', '400+ LeetCode problems solved.'),
  f('junglee-a.ab', 'junglee', 'Product Analyst at Junglee Games, Jun 2023 to Jun 2024.', 'Ran A/B experiments on player-facing features.'),
  f(
    'junglee-b.2fa',
    'junglee',
    'Owned the frontend for the company-wide 2FA and account-security flow.',
    'Returned to Junglee as an engineer after a year there as a Product Analyst. Owned the frontend for the company-wide 2FA and account-security flow: state machine, recovery paths, and a feature-flagged rollout across the gaming platform.',
  ),
  f(
    'junglee-b.blog',
    'junglee',
    'Built the public Blog / CMS frontend (React + Tailwind).',
    'Built the public Blog / CMS frontend (React + Tailwind) with SSR-friendly metadata, search, pagination and analytics. Awarded Best Developer (Quarterly), 2025.',
  ),
  f('junglee-b.award', 'junglee', 'Awarded Best Developer (Quarterly), 2025.'),
  f(
    'marrfa.dashboard',
    'marrfa',
    'Property-management admin dashboard with role-based access for three user types.',
    'Property-management admin dashboard (React + Firebase): role-based access for three user types, real-time sync, mobile-responsive UI.',
  ),
  f('testmu.rename', 'testmu', 'TestMu AI, formerly LambdaTest.'),
  f(
    'testmu.cursor',
    'testmu',
    'Built KaneAI\'s authoring cursor, a persistent insertion point in a step tree the LLM keeps rewriting.',
    'Built KaneAI\'s authoring cursor, a persistent insertion point in a step tree the LLM keeps rewriting: identity-anchored so it survives regenerated ids, self-heals across deletes, lives inside If/Else and While, drives Run From Here / Run Till Here and every insert. Shipped for both editors behind a flag; requested by 10+ enterprise customers.',
  ),
  f(
    'testmu.blocks',
    'testmu',
    'Built the If/Else and While block editor over LLM-generated steps. 90% of block-using tests nest.',
    'Built the If/Else and While block editor over LLM-generated steps: plain-English or operand/operator conditions, conditionals and modules nesting inside loops, blocks runnable as one unit, draft state coherent while the LLM regenerates any subtree. 90% of block-using tests nest.',
  ),
  f(
    'testmu.save',
    'testmu',
    'Replaced full-tree save with a diff of changed rows: 300 KB to 3 KB.',
    'Replaced the step editor\'s full-tree save with a diff of changed rows: a typical long-test save went from 300 KB to 3 KB, across nested If/Else and While, behind feature flags with a full-payload fallback.',
  ),
  f(
    'testmu.import',
    'testmu',
    'Shipped bulk API import: ~500 calls with assertions in one pass.',
    'Shipped bulk API import and response assertions for both editors: ~500 calls with assertions in one pass, roughly halving authoring time for API-heavy tests, with evaluation server-side so previews match what runs.',
  ),
  f(
    'testmu.sharing',
    'testmu',
    'Owned cross-project test-case sharing.',
    'Owned cross-project test-case sharing, taking test cases from locked-to-one-project to usable anywhere a user has access: permission-aware target picker, borrowed-case handling on every list and run, project-level settings. Found five silent data-loss bugs by checking every payload against the Go backend.',
    ['cross-stack'],
  ),
  f(
    'testmu.bugs',
    'testmu',
    'Found five silent data-loss bugs by checking every payload against the Go backend.',
    undefined,
    ['cross-stack'],
  ),
  f(
    'testmu.a11y',
    'testmu',
    'Migrated 10+ components to the internal lt-components design system and drove WCAG 2.1 AA passes.',
    'Migrated 10+ components from @primer/react to the internal lt-components design system, drove WCAG 2.1 AA passes, and shipped the Accessibility Score widget.',
    ['design-system'],
  ),
  f(
    'patch-center.koalalab',
    'patch-center',
    'KoalaLab: sole frontend developer on a container-security platform for GitHub Actions.',
    'Built the entire customer-facing site for a container-security platform for GitHub Actions: SBOM viewer, Vulnerability & Advisory tabs, container directory, tag and comparison views. Configured Netlify deploys and the CI lint pipeline.',
  ),
  ...skillFacts,
];
