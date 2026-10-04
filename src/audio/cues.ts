import type { State } from '../state/store';
import { FLAGS } from '../game/world/flags';
import type { CueId } from './manifest';

export interface Cue {
  id: CueId;
  delayMs: number;
}

// a hit or faint of one battle step lands one after the other, in step with the lines
export const BEAT_MS = 450;
const AFTER_BEATS_MS = 300;
const ITEM_FLAGS: readonly string[] = [FLAGS.shoes, FLAGS.keyFirst, FLAGS.keySecond, FLAGS.loopBreak, FLAGS.cursor, FLAGS.resume];

// a sound that fires again inside this gap is dropped
export const MIN_GAP_MS: Partial<Record<CueId, number>> = { bump: 300, confirm: 120, cancel: 120, menu_move: 40, dialog_advance: 60 };

type Battle = NonNullable<State['battle']>;

const audibleBeats = (battle: Battle | null) => battle?.state.beats.filter((beat) => beat.type === 'hit' || beat.type === 'faint') ?? [];

function battleCues(prev: Battle | null, battle: Battle | null): Cue[] {
  if (!battle || !prev || battle.state === prev.state || battle.state.turn <= prev.state.turn) return [];
  const beats = audibleBeats(battle).map((beat, i): Cue => ({
    id: beat.type === 'faint' ? 'faint' : beat.effect === 'super' ? 'hit_super' : 'hit',
    delayMs: i * BEAT_MS,
  }));
  const after = beats.length * BEAT_MS + AFTER_BEATS_MS;
  return battle.state.phase === 'lost' ? [...beats, { id: 'blackout', delayMs: after }] : beats;
}

function flagCue(flag: string): CueId | null {
  if (flag.startsWith('badge.')) return 'badge';
  if (flag.startsWith('beaten.')) return 'victory';
  return ITEM_FLAGS.includes(flag) ? 'item_get' : null;
}

// loading a save or starting a game replaces every flag at once; only a change while landed is news
function progressCues(prev: State, state: State): Cue[] {
  if (!prev.landed || !state.landed) return [];
  const delayMs = state.battle ? audibleBeats(state.battle).length * BEAT_MS + AFTER_BEATS_MS : 0;
  const flags = state.flags.filter((flag) => !prev.flags.includes(flag)).map(flagCue);
  const caught = state.caught.length > prev.caught.length ? ['bug_caught' as const] : [];
  return [...flags, ...caught].filter((id): id is CueId => id !== null).map((id) => ({ id, delayMs }));
}

function uiCues(prev: State, state: State): Cue[] {
  const cues: Cue[] = [];
  if (state.cue && state.cue !== prev.cue) cues.push({ id: state.cue.id, delayMs: 0 });
  if (prev.dialog && (!state.dialog || state.dialog.index > prev.dialog.index)) cues.push({ id: 'dialog_advance', delayMs: 0 });
  if (state.battle && prev.battle && state.battle.request === prev.battle.request && state.battle.index > prev.battle.index) cues.push({ id: 'dialog_advance', delayMs: 0 });
  if (prev.panel === 'none' && state.panel !== 'none') cues.push({ id: 'confirm', delayMs: 0 });
  if (prev.panel !== 'none' && state.panel === 'none') cues.push({ id: 'cancel', delayMs: 0 });
  return cues;
}

export const cuesFor = (prev: State, state: State): Cue[] => [...uiCues(prev, state), ...battleCues(prev.battle, state.battle), ...progressCues(prev, state)];
