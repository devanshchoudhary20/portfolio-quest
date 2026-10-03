import { beforeEach, describe, expect, it } from 'vitest';
import { facts, flagId } from '../content';
import { store } from './store';

const SEEN_TEN = flagId('seen.10');

describe('store flags', () => {
  beforeEach(() => store.getState().actions.warpGame({ town: store.getState().town }));

  it('sets seen.10 on the tenth distinct fact and not before', () => {
    const { actions } = store.getState();
    facts.slice(0, 9).forEach((fact) => actions.openFact(fact.id, { speaker: '', portrait: null }));
    expect(store.getState().flags).not.toContain(SEEN_TEN);
    actions.openFact(facts[9]!.id, { speaker: '', portrait: null });
    expect(store.getState().flags).toContain(SEEN_TEN);
    // seeing a fact twice never counts twice
    actions.openFact(facts[0]!.id, { speaker: '', portrait: null });
    expect(store.getState().seen).toHaveLength(10);
  });

  it('removeFlag drops one flag and ignores one that is not held', () => {
    const { actions } = store.getState();
    actions.addFlag(flagId('role.owner'));
    actions.addFlag(flagId('shoes'));
    actions.removeFlag(flagId('role.owner'));
    actions.removeFlag(flagId('role.tenant'));
    expect(store.getState().flags).toEqual(['shoes']);
  });

  it('closing a dialog that asked opens the robot prompt', () => {
    const { actions } = store.getState();
    actions.openFact(facts[0]!.id, { speaker: 'Robot', portrait: null }, [], 'ask');
    actions.closeDialog();
    expect(store.getState().panel).toBe('ask');
  });
});
