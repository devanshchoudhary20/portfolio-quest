import { beforeEach, describe, expect, it } from 'vitest';
import { factId, flagId, speciesId, trainerId } from '../../content';
import { store } from '../../state/store';
import { battleAct, battleAdvance, closeBattle, startBattle } from './controller';
import { moveSlots } from './engine';

// the Battle scene marks a fight ready once it has drawn; the tests have no scene
const begin = (request: Parameters<typeof startBattle>[0]) => {
  startBattle(request);
  const battle = store.getState().battle;
  if (battle) store.getState().actions.setBattle({ ...battle, ready: true });
};

describe('battle controller', () => {
  const play = () => {
    // skip the opening lines, then use the first move until the fight ends
    for (let i = 0; i < 40 && store.getState().battle?.state.phase === 'choose'; i++) {
      const battle = store.getState().battle!;
      if (battle.index < battle.lines.length) {
        battleAdvance();
      } else battleAct({ type: 'move', move: moveSlots(battle.state.player.species)[0]!.id });
    }
  };

  beforeEach(() => store.getState().actions.warpGame({ town: store.getState().town }));

  it('a won wild fight shows a pool fact, logs the catch once and sees the fact', () => {
    const pool = [factId('gear.btech'), factId('gear.leetcode')];
    begin({ kind: 'wild', species: speciesId('null-pointer'), pool, town: store.getState().town });
    play();
    const state = store.getState();
    expect(state.battle?.state.phase).toBe('won');
    expect(state.caught).toEqual(['null-pointer']);
    expect(state.seen).toContain(pool[0]);
    expect(state.shownCounts[pool[0]!]).toBe(1);
  });

  it('a won gym fight awards the badge flag, and a lost one awards nothing', () => {
    begin({ kind: 'trainer', trainer: trainerId('core') });
    play();
    expect(store.getState().flags).toContain(flagId('badge.core'));
    closeBattle();
    begin({ kind: 'trainer', trainer: trainerId('backend') });
    expect(store.getState().flags).not.toContain(flagId('badge.backend'));
  });

  it('does not start a second battle over the first, and ignores input before the scene is ready', () => {
    startBattle({ kind: 'trainer', trainer: trainerId('core') });
    const first = store.getState().battle;
    startBattle({ kind: 'trainer', trainer: trainerId('backend') });
    expect(store.getState().battle).toBe(first);
    battleAdvance();
    expect(store.getState().battle).toBe(first);
  });

  it('opens no battle for an unknown trainer', () => {
    startBattle({ kind: 'trainer', trainer: trainerId('nobody') });
    expect(store.getState().battle).toBeNull();
  });
});
