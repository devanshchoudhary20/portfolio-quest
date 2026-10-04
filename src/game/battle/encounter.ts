import type { FactId } from '../../content';

export const ENCOUNTER_CHANCE = 0.1;
// steps since the last battle before grass may start another
export const MIN_STEPS_BETWEEN = 15;

// roll is a random number in [0, 1)
export const shouldEncounter = (steps: number, roll: number) => steps >= MIN_STEPS_BETWEEN && roll < ENCOUNTER_CHANCE;

// the pool fact the player has met least: a fact in the save counts once, plus every time an encounter showed it this visit; ties go to pool order
export function leastSeen(pool: readonly FactId[], seen: readonly FactId[], shownCounts: Readonly<Record<string, number>>): FactId | undefined {
  const score = (id: FactId) => (seen.includes(id) ? 1 : 0) + (shownCounts[id] ?? 0);
  return pool.reduce<FactId | undefined>((best, id) => (best === undefined || score(id) < score(best) ? id : best), undefined);
}
