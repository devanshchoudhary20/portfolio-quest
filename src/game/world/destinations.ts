import { destId, townId } from '../../content';
import type { DestId, TownId, TownKey } from '../../content';

export interface Destination {
  id: DestId;
  label: string;
  town: TownId;
  // a named object in that town's map to walk to; a town with no `at` just lands on its default spawn
  at?: string;
  // lowercase phrases the rule-based parser recognises
  aliases: string[];
}

const dest = (id: string, label: string, town: TownKey, aliases: string[], at?: string): Destination => ({
  id: destId(id),
  label,
  town: townId(town),
  aliases,
  ...(at ? { at } : {}),
});

const floor = (n: number, words: string, label: string, aliases: string[]) =>
  dest(`floor-${n}`, label, 'testmu', [`floor ${n}`, `${n} floor`, `${words} floor`, ...aliases], `f${n}-from-below`);

// the KaneAI robot's destination table: towns, gyms by skill name, tower floors, the Patch Center, named NPCs
export const DESTINATIONS: readonly Destination[] = [
  dest('town-agra', 'Agra', 'agra', ['agra', 'home', 'hometown']),
  dest('town-gear', 'Gear City', 'gear', ['gear city', 'gear', 'iit patna']),
  dest('town-junglee', 'Junglee Jungle', 'junglee', ['junglee', 'junglee jungle', 'jungle']),
  dest('town-marrfa', 'Marrfa Estates', 'marrfa', ['marrfa', 'marrfa estates', 'estates']),
  dest('town-testmu', 'TestMu City', 'testmu', ['testmu', 'test mu', 'testmu city', 'lambda city', 'lambdatest']),
  dest('gym-core', 'Core gym', 'gear', ['core gym', 'gear gym', 'core', 'react gym', 'typescript gym', 'next gym'], 'gym-door'),
  dest('gym-design', 'Design System gym', 'testmu', ['design system gym', 'design system', 'design gym', 'design', 'a11y gym', 'accessibility'], 'design-door'),
  dest('gym-monorepo', 'Monorepo gym', 'junglee', ['monorepo gym', 'monorepo', 'tooling gym', 'tooling', 'junglee gym'], 'gym-door'),
  dest('gym-cross', 'Cross-stack gym', 'testmu', ['cross stack gym', 'cross stack', 'crossstack', 'cross gym', 'ai gym', 'testmu gym'], 'cross-door'),
  dest('gym-backend', 'Backend gym', 'marrfa', ['backend gym', 'backend', 'marrfa gym', 'node gym'], 'gym-door'),
  dest('patch-center', 'Patch Center', 'gear', ['patch center', 'patch centre', 'patch', 'contact', 'pc box'], 'patch-door'),
  dest('tower-lobby', 'KaneAI lobby', 'testmu', ['lobby', 'kaneai tower', 'tower', 'kaneai', 'reception desk'], 'lobby-in'),
  floor(1, 'first', 'Floor 1, the cursor maze', ['cursor maze', 'maze', 'authoring cursor']),
  floor(2, 'second', 'Floor 2, If / Else and While', ['if else', 'while loop', 'loop', 'blocks']),
  floor(3, 'third', 'Floor 3, the Save Room', ['save room', 'save']),
  floor(4, 'fourth', 'Floor 4, the Import Dock', ['import dock', 'dock', 'import']),
  dest('tower-basement', 'The basement', 'testmu', ['basement', 'ghost bugs', 'ghosts', 'bugs'], 'basement-from-above'),
  dest('npc-librarian', 'The librarian', 'gear', ['librarian', 'leetcode', 'library lady'], 'librarian'),
  dest('npc-mom', 'Mom', 'agra', ['mom', 'mother', 'mum'], 'mom'),
  dest('npc-analyst', 'The analyst', 'junglee', ['analyst', 'path analyst'], 'analyst'),
  dest('npc-editor', 'The editor', 'junglee', ['editor', 'blog editor', 'newsstand'], 'editor'),
  dest('npc-recovery', 'Recovery Path', 'junglee', ['recovery', 'recovery path'], 'recovery'),
  dest('npc-manager', 'The property manager', 'marrfa', ['manager', 'property manager'], 'manager'),
  dest('npc-designer', 'The component designer', 'testmu', ['designer', 'component designer'], 'designer'),
  dest('npc-reception', 'Reception', 'testmu', ['reception', 'receptionist'], 'reception'),
  dest('npc-student', 'The student', 'gear', ['student'], 'student'),
];

export const destinationById = (id: DestId): Destination | undefined => DESTINATIONS.find((d) => d.id === id);
