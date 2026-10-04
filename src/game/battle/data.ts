import { factId, moveId, skillGroupId, speciesId, trainerId } from '../../content';
import type { FactId, FlagId, MoveId, SpeciesId, TrainerId } from '../../content';
import { badgeFlag, beatenFlag } from '../world/flags';

export type BattleType = 'water' | 'grass' | 'fire' | 'bug' | 'ghost';
export type BgId = 'grass' | 'jungle' | 'city' | 'gym' | 'elite';

export interface Move {
  id: MoveId;
  name: string;
  power: number;
  // a player move prints this resume fact; a bug's flavor move has none and prints its line from lines.ts
  factId?: FactId;
}

export interface Species {
  id: SpeciesId;
  name: string;
  type: BattleType;
  maxHp: number;
  moves: MoveId[];
}

// a gym leader hands over a badge; an Elite Four member or the Champion only marks themselves beaten
export type Award = { kind: 'badge'; flag: FlagId } | { kind: 'beaten'; flag: FlagId };

export interface Trainer {
  id: TrainerId;
  name: string;
  party: SpeciesId[];
  partyHp: number;
  // the fact the trainer says before the fight; the map's npc carries the same one
  factId: FactId;
  award: Award;
  bg: BgId;
}

const move = (id: string, name: string, power: number, fact?: string): Move => ({
  id: moveId(id),
  name,
  power,
  ...(fact ? { factId: factId(fact) } : {}),
});

export const MOVES: readonly Move[] = [
  move('authoring-cursor', 'Authoring Cursor', 18, 'testmu.cursor'),
  move('if-else-block', 'If/Else Block', 16, 'testmu.blocks'),
  move('a11y-pass', 'A11y Pass', 16, 'testmu.a11y'),
  move('ship-pipeline', 'Solo Frontend', 14, 'patch-center.koalalab'),
  move('bulk-import', 'Bulk Import', 18, 'testmu.import'),
  move('role-access', 'Role Access', 16, 'marrfa.dashboard'),
  move('shared-cases', 'Shared Cases', 16, 'testmu.sharing'),
  move('two-fa-gate', '2FA Gate', 14, 'junglee-b.2fa'),
  move('stack-sweep', 'Stack Sweep', 18, 'skill.cross-stack'),
  move('prompt-rewrite', 'Regenerate', 16, 'agra.summary'),
  move('payload-check', 'Payload Check', 16, 'testmu.bugs'),
  move('diff-save', 'Diff Save', 14, 'testmu.save'),
  move('dereference', 'Dereference', 7),
  move('undefined-is-not', 'Undefined Is Not', 8),
  move('preflight-block', 'Preflight Block', 7),
  move('missing-header', 'Missing Header', 8),
  move('mismatch', 'Mismatch', 7),
  move('flash-of-wrong', 'Flash of Wrong', 8),
  move('data-race', 'Data Race', 8),
  move('stale-read', 'Stale Read', 7),
  move('slow-drip', 'Slow Drip', 7),
  move('out-of-memory', 'Out of Memory', 8),
  move('fencepost', 'Fencepost', 7),
  move('loop-once-more', 'Loop Once More', 8),
  move('silent-drop', 'Silent Drop', 8),
  move('vanish', 'Vanish', 7),
];

const species = (id: string, name: string, type: BattleType, maxHp: number, moves: string[]): Species => ({
  id: speciesId(id),
  name,
  type,
  maxHp,
  moves: moves.map(moveId),
});

export const STARTER_HP = 40;
export const WILD_HP = 36;
// a leader's bugs are frailer than wild ones, so a two-bug party falls in about four turns
export const PARTY_HP = 20;

export const SPECIES: readonly Species[] = [
  species('react', 'React', 'water', STARTER_HP, ['authoring-cursor', 'if-else-block', 'a11y-pass', 'ship-pipeline']),
  species('node', 'Node.js', 'grass', STARTER_HP, ['bulk-import', 'role-access', 'shared-cases', 'two-fa-gate']),
  species('claude', 'Claude Code', 'fire', STARTER_HP, ['stack-sweep', 'prompt-rewrite', 'payload-check', 'diff-save']),
  species('null-pointer', 'NullPointerException', 'bug', WILD_HP, ['dereference', 'undefined-is-not']),
  species('cors', 'CORS Error', 'bug', WILD_HP, ['preflight-block', 'missing-header']),
  species('hydration', 'Hydration Mismatch', 'bug', WILD_HP, ['mismatch', 'flash-of-wrong']),
  species('race-condition', 'Race Condition', 'ghost', WILD_HP, ['data-race', 'stale-read']),
  species('memory-leak', 'Memory Leak', 'ghost', WILD_HP, ['slow-drip', 'out-of-memory']),
  species('off-by-one', 'Off-by-one', 'bug', WILD_HP, ['fencepost', 'loop-once-more']),
  species('silent-data-loss', 'Silent Data Loss', 'ghost', WILD_HP, ['silent-drop', 'vanish']),
];

const trainer = (id: string, name: string, party: string[], fact: string, award: Award, bg: BgId): Trainer => ({
  id: trainerId(id),
  name,
  party: party.map(speciesId),
  partyHp: PARTY_HP,
  factId: factId(fact),
  award,
  bg,
});

const gym = (id: string, name: string, party: string[], fact: string, group: string) =>
  trainer(id, name, party, fact, { kind: 'badge', flag: badgeFlag(skillGroupId(group)) }, 'gym');
const elite = (id: string, name: string, party: string[], fact: string) =>
  trainer(id, name, party, fact, { kind: 'beaten', flag: beatenFlag(trainerId(id)) }, 'elite');

// the Champion fields bugs only: a starter's moves would make Node and Claude Code players lose
export const TRAINERS: readonly Trainer[] = [
  gym('core', 'Core Leader', ['hydration', 'null-pointer'], 'skill.core', 'core'),
  gym('design', 'Design Leader', ['cors', 'race-condition'], 'skill.design-system', 'design-system'),
  gym('monorepo', 'Tooling Leader', ['off-by-one', 'memory-leak'], 'skill.monorepo', 'monorepo'),
  gym('cross', 'Stack Leader', ['silent-data-loss', 'race-condition'], 'skill.cross-stack', 'cross-stack'),
  gym('backend', 'Backend Leader', ['cors'], 'skill.backend', 'backend'),
  elite('dsa', 'DSA Elite', ['off-by-one', 'null-pointer'], 'gear.leetcode'),
  elite('machine-coding', 'Machine Coding Elite', ['hydration', 'race-condition'], 'testmu.blocks'),
  elite('system-design', 'System Design Elite', ['cors', 'memory-leak'], 'testmu.save'),
  elite('behavioral', 'Behavioral Elite', ['memory-leak', 'silent-data-loss'], 'junglee-b.award'),
  elite('devansh', 'Champion Devansh', ['silent-data-loss', 'null-pointer'], 'agra.summary'),
];

// which bugs roam which town's tall grass
export const WILD_BY_TOWN: Readonly<Record<string, readonly SpeciesId[]>> = {
  gear: ['null-pointer', 'off-by-one'].map(speciesId),
  junglee: ['race-condition', 'memory-leak'].map(speciesId),
  marrfa: ['cors', 'hydration'].map(speciesId),
};

// the bugs a visitor can catch: every bug that roams some town's grass
export const CATCHABLE: readonly SpeciesId[] = [...new Set(Object.values(WILD_BY_TOWN).flat())];

export const caughtCount = (caught: readonly SpeciesId[]) => CATCHABLE.filter((id) => caught.includes(id)).length;

export const WILD_BG: Readonly<Record<string, BgId>> = { gear: 'grass', junglee: 'jungle', marrfa: 'city' };

// battle art files, one per id: creature fronts and backs, trainers, backgrounds
export const BG_IDS: readonly BgId[] = ['grass', 'jungle', 'city', 'gym', 'elite'];
export const TRAINER_SPRITES = ['core', 'design', 'monorepo', 'cross', 'backend', 'dsa', 'machine-coding', 'system-design', 'behavioral', 'devansh'] as const;

const speciesById = new Map(SPECIES.map((s) => [s.id, s]));
const movesById = new Map(MOVES.map((m) => [m.id, m]));
const trainersById = new Map(TRAINERS.map((t) => [t.id, t]));

export const speciesOf = (id: SpeciesId): Species | undefined => speciesById.get(id);
export const moveOf = (id: MoveId): Move | undefined => movesById.get(id);
export const trainerOf = (id: TrainerId): Trainer | undefined => trainersById.get(id);
