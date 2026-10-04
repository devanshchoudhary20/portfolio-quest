import type { FactId, FlagId, SpeciesId, TownId, TrainerId } from '../../content';
import {
  FLAVOR_LINES,
  ITEM_LINES,
  LOST_LINE,
  NOT_EFFECTIVE,
  RAN_LINE,
  SUPER_EFFECTIVE,
  TURN_CAP_LINE,
  askMove,
  caughtLine,
  fainted,
  goLine,
  trainerSends,
  trainerWants,
  usedMove,
  wildAppeared,
} from '../world/lines';
import { factText } from '../world/factText';
import type { Mode } from '../world/save';
import { WILD_BG, moveOf, speciesOf, trainerOf } from './data';
import type { BgId, Trainer } from './data';
import { leastSeen } from './encounter';
import { enemyOf, start, step } from './engine';
import type { Action, BattleState, Beat } from './engine';

export type BattleRequest =
  | { kind: 'wild'; species: SpeciesId; pool: FactId[]; town: TownId; playerHp?: number; enemyHp?: number }
  | { kind: 'trainer'; trainer: TrainerId };

// everything the screen needs to draw one battle; the store holds it and the scene and overlay only read it
export interface BattleUi {
  request: BattleRequest;
  state: BattleState;
  lines: string[];
  index: number;
  // hp on screen; the scene tweens it toward the state (the store sets it at once under reduced motion)
  shown: { player: number; enemy: number };
  // a gym battle opens on the trainer; the creature appears once the trainer sends it out
  enemyOut: boolean;
  // the party slot on screen; it moves to the next bug when the narration reaches the "sent out" line
  slotOut: number;
  // the line that sends the next bug out, if this step has one
  sendAt: number | null;
  // false until the Battle scene has built its screen; input is ignored before that
  ready: boolean;
}

export interface Outcome {
  fact?: FactId;
  caught?: SpeciesId;
  badge?: FlagId;
}

export interface Env {
  mode: Mode;
  seen: readonly FactId[];
  // how often each pool fact was shown by an encounter this visit
  shownCounts: Readonly<Record<string, number>>;
}

interface Ctx {
  mode: Mode;
  trainer?: Trainer;
}

export const trainerFor = (request: BattleRequest): Trainer | undefined => (request.kind === 'trainer' ? trainerOf(request.trainer) : undefined);

export const bgOf = (request: BattleRequest): BgId => (request.kind === 'trainer' ? 'gym' : (WILD_BG[request.town] ?? 'grass'));

export const enemyIds = (request: BattleRequest): SpeciesId[] => {
  if (request.kind === 'wild') return [request.species];
  return trainerOf(request.trainer)?.party ?? [];
};

const nameOf = (species: SpeciesId | undefined) => (species ? speciesOf(species)?.name : undefined) ?? 'The bug';

const compact = (lines: (string | undefined)[]) => lines.filter((line): line is string => line !== undefined && line.trim() !== '');

function beatLines(beat: Beat, ctx: Ctx): (string | undefined)[] {
  switch (beat.type) {
    case 'used': {
      const move = moveOf(beat.move);
      if (!move) return [];
      const effect = move.factId ? factText(move.factId, ctx.mode) : FLAVOR_LINES.get(move.id);
      return [usedMove(nameOf(beat.species), move.name), effect];
    }
    case 'hit':
      return [beat.effect === 'super' ? SUPER_EFFECTIVE : beat.effect === 'weak' ? NOT_EFFECTIVE : undefined];
    case 'faint':
      return [fainted(nameOf(beat.species))];
    case 'send':
      return [ctx.trainer ? trainerSends(ctx.trainer.name, nameOf(beat.species)) : undefined];
    case 'cap':
      return [TURN_CAP_LINE];
    case 'ran':
      return [RAN_LINE];
  }
}

// beats become lines; sendAt is the index of the line that sends the next bug out
function narrateSteps(beats: readonly Beat[], ctx: Ctx): { lines: string[]; sendAt: number | null } {
  const lines: string[] = [];
  let sendAt: number | null = null;
  for (const beat of beats) {
    if (beat.type === 'send') sendAt = lines.length;
    lines.push(...compact(beatLines(beat, ctx)));
  }
  return { lines, sendAt: sendAt !== null && sendAt < lines.length ? sendAt : null };
}

export const narrate = (beats: readonly Beat[], ctx: Ctx): string[] => narrateSteps(beats, ctx).lines;

// the lines before the first menu: who appeared and who goes out
function openingLines(state: BattleState, ctx: Ctx): string[] {
  const enemy = nameOf(enemyOf(state).species);
  const player = nameOf(state.player.species);
  const first = ctx.trainer ? [trainerWants(ctx.trainer.name), trainerSends(ctx.trainer.name, enemy)] : [wildAppeared(enemy)];
  return [...first, goLine(player)];
}

const promptLine = (state: BattleState) => askMove(nameOf(state.player.species));

// a win pays out: a wild bug shows the fact the player has seen least and is logged, a gym leader awards the badge
function outroLines(state: BattleState, ctx: Ctx, pick: FactId | undefined): string[] {
  if (state.phase === 'lost') return [LOST_LINE];
  if (state.phase !== 'won') return [];
  if (ctx.trainer) return compact([ITEM_LINES.get(ctx.trainer.badge)]);
  const fact = pick ? factText(pick, ctx.mode) : undefined;
  return compact([fact, caughtLine(nameOf(state.party[0]?.species))]);
}

const shownOf = (state: BattleState) => ({ player: state.player.hp, enemy: enemyOf(state).hp });

// null when the request names a species or trainer the data does not have
export function beginBattle(request: BattleRequest, player: SpeciesId, mode: Mode, seed: number): BattleUi | null {
  const trainer = trainerFor(request);
  if (request.kind === 'trainer' && !trainer) return null;
  const state = start({
    player,
    party: enemyIds(request),
    seed,
    ...(request.kind === 'wild' ? { playerHp: request.playerHp, enemyHp: request.enemyHp } : { enemyHp: trainer?.partyHp }),
  });
  if (!state) return null;
  const lines = openingLines(state, { mode, ...(trainer ? { trainer } : {}) });
  return { request, state, lines, index: 0, shown: shownOf(state), enemyOut: request.kind === 'wild', slotOut: 0, sendAt: null, ready: false };
}

// one player action: the engine steps, the beats become lines, and a win adds its payout
export function actInBattle(ui: BattleUi, action: Action, env: Env): { ui: BattleUi; outcome: Outcome } {
  const trainer = trainerFor(ui.request);
  const ctx = { mode: env.mode, ...(trainer ? { trainer } : {}) };
  const state = step(ui.state, action);
  const outcome: Outcome = {};
  if (state.phase === 'won') {
    if (trainer) outcome.badge = trainer.badge;
    else if (ui.request.kind === 'wild') {
      const fact = leastSeen(ui.request.pool, env.seen, env.shownCounts);
      if (fact) outcome.fact = fact;
      outcome.caught = ui.request.species;
    }
  }
  const { lines: stepLines, sendAt } = narrateSteps(state.beats, ctx);
  const lines = [...stepLines, ...outroLines(state, ctx, outcome.fact)];
  return { ui: { ...ui, state, lines, index: 0, sendAt }, outcome };
}

type LineView = Pick<BattleUi, 'lines' | 'index' | 'state'>;

// the line on screen now: a queued line, the prompt once the queue is spent, or the last line when the fight is over
export const battleLine = (view: LineView): string =>
  view.lines[view.index] ?? (view.state.phase === 'choose' ? promptLine(view.state) : (view.lines.at(-1) ?? ''));
