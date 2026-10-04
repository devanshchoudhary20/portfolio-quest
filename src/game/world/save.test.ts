import { describe, expect, it } from 'vitest';
import { loadSave } from './save';

const valid = {
  v: 1,
  town: 'agra',
  pos: { x: 4, y: 7 },
  facing: 'down',
  flags: ['shoes'],
  seen: ['agra.summary', 'removed.fact'],
  mode: 'recruiter',
  savedAt: '2026-10-03T10:00:00.000Z',
};

describe('loadSave', () => {
  it('loads a valid v1 save and drops facts that no longer exist', () => {
    expect(loadSave(valid)).toMatchObject({ v: 1, town: 'agra', seen: ['agra.summary'] });
  });

  it('returns null for garbage', () => {
    for (const raw of [null, undefined, 42, 'x', [], {}, { v: 1 }, { ...valid, town: 'nowhere' }, { ...valid, town: 'patch-center' }]) {
      expect(loadSave(raw)).toBeNull();
    }
  });

  it('keeps the save when savedAt is unreadable', () => {
    expect(loadSave({ ...valid, savedAt: 'last tuesday' })?.savedAt).toBeNull();
    expect(loadSave({ ...valid, savedAt: undefined })?.savedAt).toBeNull();
  });

  it('ignores a textSpeed field: preferences own it', () => {
    expect(loadSave({ ...valid, textSpeed: 3 })).not.toHaveProperty('textSpeed');
  });

  it('reads caught bugs, drops unknown species and repeats, and defaults to none', () => {
    expect(loadSave(valid)?.caught).toEqual([]);
    expect(loadSave({ ...valid, caught: ['cors', 'cors', 'dragon', 7] })?.caught).toEqual([]);
    expect(loadSave({ ...valid, caught: ['cors', 'cors', 'dragon'] })?.caught).toEqual(['cors']);
  });

  it('reads play time in whole seconds and treats a missing or broken value as 0', () => {
    expect(loadSave(valid)?.playSeconds).toBe(0);
    expect(loadSave({ ...valid, playSeconds: 3725.9 })?.playSeconds).toBe(3725);
    for (const playSeconds of [-5, Number.NaN, '12', null]) expect(loadSave({ ...valid, playSeconds })?.playSeconds).toBe(0);
  });

  it('returns null for unknown versions', () => {
    for (const v of [0, 2, 99, '1']) expect(loadSave({ ...valid, v })).toBeNull();
  });
});
