import { describe, expect, it } from 'vitest';
import { factId, moveId, speciesId } from '../../content';
import { MOVES, SPECIES, TRAINERS } from './data';
import { ENCOUNTER_CHANCE, MIN_STEPS_BETWEEN, leastSeen, shouldEncounter } from './encounter';
import { TURN_CAP, effectiveness, enemyOf, moveSlots, start, step } from './engine';
import type { Action, BattleState } from './engine';
import { narrate } from './session';

const REACT = speciesId('react');
const NODE = speciesId('node');
const CLAUDE = speciesId('claude');
const NULL_POINTER = speciesId('null-pointer');
const hit = (state: BattleState, slot = 0): BattleState => step(state, { type: 'move', move: moveSlots(state.player.species)[slot]!.id });
const begin = (extra: Partial<Parameters<typeof start>[0]> = {}) => start({ player: REACT, party: [NULL_POINTER], seed: 7, ...extra })!;

describe('type chart', () => {
  it('knows the starter triangle plus bug and ghost, and everything else is neutral', () => {
    expect(effectiveness('water', 'fire')).toBe(2);
    expect(effectiveness('grass', 'water')).toBe(2);
    expect(effectiveness('fire', 'grass')).toBe(2);
    expect(effectiveness('fire', 'bug')).toBe(2);
    expect(effectiveness('bug', 'grass')).toBe(2);
    expect(effectiveness('ghost', 'ghost')).toBe(2);
    expect(effectiveness('grass', 'fire')).toBe(0.5);
    expect(effectiveness('water', 'bug')).toBe(1);
  });

  it('shows up as a hit effect and in the damage', () => {
    const fireVsBug = step(begin({ player: CLAUDE }), { type: 'move', move: moveSlots(CLAUDE)[0]!.id });
    const grassVsBug = step(begin({ player: NODE }), { type: 'move', move: moveSlots(NODE)[0]!.id });
    expect(fireVsBug.beats).toContainEqual({ type: 'hit', side: 'enemy', effect: 'super' });
    expect(grassVsBug.beats).toContainEqual({ type: 'hit', side: 'enemy', effect: 'even' });
    expect(enemyOf(fireVsBug).hp).toBeLessThan(enemyOf(grassVsBug).hp);
  });
});

describe('determinism', () => {
  const play = (seed: number) => {
    let state = begin({ seed, enemyHp: 500 });
    const seen: BattleState[] = [];
    while (state.phase === 'choose') seen.push((state = hit(state, state.turn % 4)));
    return seen;
  };

  it('the same seed and the same actions give the same battle', () => {
    expect(play(42)).toEqual(play(42));
  });

  it('a different seed can give a different battle', () => {
    const hps = [1, 2, 3, 4, 5, 6].map((seed) => play(seed).map((s) => s.player.hp).join());
    expect(new Set(hps).size).toBeGreaterThan(1);
  });

  it('step never changes the state it was given', () => {
    const state = begin();
    const copy = structuredClone(state);
    hit(state);
    expect(state).toEqual(copy);
  });
});

describe('turn cap', () => {
  it('ends in the player\'s favour on the fourth turn even when the enemy is far from fainting', () => {
    let state = begin({ enemyHp: 5000 });
    for (let turn = 1; turn < TURN_CAP; turn++) {
      state = hit(state);
      expect(state.phase).toBe('choose');
    }
    state = hit(state);
    expect(state.turn).toBe(TURN_CAP);
    expect(state.phase).toBe('won');
    expect(state.beats.map((b) => b.type)).toContain('cap');
    expect(state.party.every((member) => member.hp === 0)).toBe(true);
  });

  it('a gym party that has not fallen by turn four gives up together', () => {
    let state = start({ player: REACT, party: TRAINERS[0]!.party, seed: 3, enemyHp: 5000 })!;
    while (state.phase === 'choose') state = hit(state);
    expect(state.phase).toBe('won');
    expect(state.turn).toBeLessThanOrEqual(TURN_CAP);
    expect(state.party.every((member) => member.hp === 0)).toBe(true);
  });

  it('every starter beats every wild bug within four turns with any move order', () => {
    for (const player of [REACT, NODE, CLAUDE]) {
      for (const bug of SPECIES.filter((s) => s.type === 'bug' || s.type === 'ghost')) {
        for (let seed = 0; seed < 20; seed++) {
          let state = start({ player, party: [bug.id], seed })!;
          while (state.phase === 'choose') state = hit(state, seed % 4);
          expect(state.phase).toBe('won');
          expect(state.turn).toBeLessThanOrEqual(TURN_CAP);
        }
      }
    }
  });
});

describe('fainting', () => {
  it('ends the battle as lost when the player creature runs out of health, with no further steps', () => {
    const state = hit(begin({ playerHp: 1, enemyHp: 5000 }));
    expect(state.phase).toBe('lost');
    expect(state.player.hp).toBe(0);
    expect(state.beats).toContainEqual({ type: 'faint', side: 'player', species: REACT });
    expect(hit(state)).toBe(state);
  });

  it('a lost battle names only facts and lines.ts text', () => {
    const lines = narrate(hit(begin({ playerHp: 1, enemyHp: 5000 })).beats, { mode: 'curious' });
    expect(lines.at(-1)).toBe('React fainted!');
  });
});

describe('moves and run', () => {
  it('ignores a move the creature does not know', () => {
    const state = begin();
    const wrong: Action = { type: 'move', move: moveSlots(NODE)[0]!.id };
    expect(step(state, wrong)).toBe(state);
    expect(step(state, { type: 'move', move: moveId('nope') })).toBe(state);
  });

  it('run ends the fight at once', () => {
    expect(step(begin(), { type: 'run' }).phase).toBe('ran');
  });

  it('a fact move prints its resume fact and a bug move prints a lines.ts line', () => {
    const lines = narrate(hit(begin({ enemyHp: 5000 })).beats, { mode: 'curious' });
    expect(lines[0]).toBe('React used Authoring Cursor!');
    expect(lines[1]).toContain('authoring cursor');
    expect(lines.some((line) => line.startsWith('NullPointerException used'))).toBe(true);
  });
});

describe('data', () => {
  it('has no repeated ids', () => {
    for (const ids of [MOVES.map((m): string => m.id), SPECIES.map((s): string => s.id), TRAINERS.map((t): string => t.id)]) expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every starter four moves that each carry a fact', () => {
    for (const id of [REACT, NODE, CLAUDE]) {
      const moves = moveSlots(id);
      expect(moves).toHaveLength(4);
      expect(moves.every((m) => m?.factId !== undefined)).toBe(true);
    }
  });

  it('gives every starter the same power total, 18 / 16 / 16 / 14 by slot', () => {
    for (const id of [REACT, NODE, CLAUDE]) expect(moveSlots(id).map((m) => m?.power)).toEqual([18, 16, 16, 14]);
  });

  it('keeps the fact on the move the plan names', () => {
    const fact = (id: string) => MOVES.find((m) => m.id === id)?.factId;
    expect(fact('authoring-cursor')).toBe(factId('testmu.cursor'));
    expect(fact('role-access')).toBe(factId('marrfa.dashboard'));
  });
});

describe('encounters', () => {
  it('needs 15 steps since the last battle and a roll under one in ten', () => {
    expect(shouldEncounter(MIN_STEPS_BETWEEN - 1, 0)).toBe(false);
    expect(shouldEncounter(MIN_STEPS_BETWEEN, ENCOUNTER_CHANCE - 0.001)).toBe(true);
    expect(shouldEncounter(MIN_STEPS_BETWEEN, ENCOUNTER_CHANCE)).toBe(false);
  });

  it('picks the pool fact seen least, counting this visit\'s showings', () => {
    const pool = ['gear.btech', 'gear.leetcode', 'skill.core'].map(factId);
    expect(leastSeen(pool, [pool[0]!], {})).toBe(pool[1]);
    expect(leastSeen(pool, pool.slice(0, 2), {})).toBe(pool[2]);
    expect(leastSeen(pool, pool, { [pool[0]!]: 1, [pool[1]!]: 2 })).toBe(pool[2]);
    expect(leastSeen(pool, pool, {})).toBe(pool[0]);
    expect(leastSeen([], [], {})).toBeUndefined();
  });
});
