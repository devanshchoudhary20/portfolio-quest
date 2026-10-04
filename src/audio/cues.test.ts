import { beforeEach, describe, expect, it } from 'vitest';
import { flagId } from '../content';
import { store } from '../state/store';
import type { State } from '../state/store';
import { cuesFor } from './cues';

const ids = (prev: State, state: State) => cuesFor(prev, state).map((cue) => cue.id);
const landed = (): State => ({ ...store.getState(), landed: true });

describe('cuesFor', () => {
  beforeEach(() => store.getState().actions.warpGame({ town: store.getState().town }));

  it('plays the badge jingle for a new badge and the item jingle for the shoes', () => {
    const before = landed();
    expect(ids(before, { ...before, flags: [...before.flags, flagId('badge.core')] })).toEqual(['badge']);
    expect(ids(before, { ...before, flags: [...before.flags, flagId('shoes')] })).toEqual(['item_get']);
  });
  it('stays quiet while a save loads, since every flag changes at once', () => {
    const before = { ...store.getState(), landed: false };
    expect(ids(before, { ...before, flags: [flagId('badge.core')] })).toEqual([]);
  });
  it('plays dialog_advance when the line moves on or the dialog closes', () => {
    const open = { speaker: '', portrait: null, lines: ['a', 'b'], index: 0 };
    const before = { ...landed(), dialog: open };
    expect(ids(before, { ...before, dialog: { ...open, index: 1 } })).toEqual(['dialog_advance']);
    expect(ids(before, { ...before, dialog: null })).toEqual(['dialog_advance']);
  });
  it('plays an explicit cue once per object', () => {
    const before = landed();
    const next = { ...before, cue: { id: 'bump' as const } };
    expect(ids(before, next)).toEqual(['bump']);
    expect(ids(next, next)).toEqual([]);
  });
  it('plays confirm on opening a panel and cancel on closing it', () => {
    const before = landed();
    expect(ids(before, { ...before, panel: 'menu' })).toEqual(['confirm']);
    expect(ids({ ...before, panel: 'menu' }, before)).toEqual(['cancel']);
  });
});
