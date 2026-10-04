import { speciesId } from '../../content';
import { store } from '../../state/store';
import type { Starter } from '../world/save';
import type { Action } from './engine';
import { actInBattle, beginBattle } from './session';
import type { BattleRequest } from './session';

// a skipped or recruiter intro starts with React
const DEFAULT_STARTER: Starter = 'react';

const newSeed = () => Math.floor(Math.random() * 0x100000000);
const starterSpecies = (starter: Starter | undefined) => speciesId(starter ?? DEFAULT_STARTER);

// the one place a battle starts, so the grass, the gym leaders and the test API all begin it the same way
export function startBattle(request: BattleRequest) {
  const { starter, mode, battle: active, actions } = store.getState();
  if (active) return;
  const battle = beginBattle(request, starterSpecies(starter), mode, newSeed());
  // a request the data cannot start leaves the player where they were
  if (!battle) return;
  actions.closePanel();
  actions.resetSteps();
  actions.setBattle(battle);
}

// A moves through the queued lines, then closes a won or abandoned fight; it does nothing until the scene has drawn the screen
export function battleAdvance() {
  const { battle, typing, actions } = store.getState();
  if (!battle?.ready) return;
  if (typing) {
    store.setState((s) => ({ finishTick: s.finishTick + 1 }));
    return;
  }
  const onLine = battle.index < battle.lines.length;
  const last = battle.index + 1 >= battle.lines.length;
  const over = battle.state.phase === 'won' || battle.state.phase === 'ran';
  if (!onLine) return;
  if (!last) {
    const index = battle.index + 1;
    // the trainer's "sent out" line is the second one and shows the creature; a later one swaps the party slot
    const sent = battle.sendAt !== null && index >= battle.sendAt;
    actions.setBattle({ ...battle, index, enemyOut: battle.enemyOut || index >= 1, slotOut: sent ? battle.state.slot : battle.slotOut });
  } else if (over) actions.setBattle(null);
  else actions.setBattle({ ...battle, index: battle.lines.length, enemyOut: true, slotOut: battle.state.slot });
}

export function battleAct(action: Action) {
  const { battle, mode, seen, shownCounts, reducedMotion, actions } = store.getState();
  if (!battle?.ready || battle.state.phase !== 'choose' || battle.index < battle.lines.length) return;
  const { ui, outcome } = actInBattle(battle, action, { mode, seen, shownCounts });
  // under reduced motion the bars jump at once; otherwise the Battle scene tweens them
  actions.setBattle(reducedMotion ? { ...ui, shown: { player: ui.state.player.hp, enemy: ui.state.party[ui.slotOut]?.hp ?? 0 } } : ui);
  if (outcome.fact) {
    actions.markSeen(outcome.fact);
    actions.countShown(outcome.fact);
  }
  if (outcome.caught) actions.addCaught(outcome.caught);
  if (outcome.badge) actions.addFlag(outcome.badge);
}

export function battleRetry() {
  const { battle, starter, mode, actions } = store.getState();
  if (!battle?.ready) return;
  const fresh = battle ? beginBattle(battle.request, starterSpecies(starter), mode, newSeed()) : null;
  // the screen is already built, so the fresh fight starts ready
  if (fresh) actions.setBattle({ ...fresh, ready: true });
}

export const closeBattle = () => store.getState().actions.setBattle(null);
