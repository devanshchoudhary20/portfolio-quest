import type { MoveId, SpeciesId } from '../../content';
import { moveOf, speciesOf } from './data';
import type { BattleType, Move } from './data';

// battles never drag: the fourth player turn ends the fight in the player's favour
export const TURN_CAP = 4;

// attacker row, defender column; a missing pair is neutral
const CHART: Partial<Record<BattleType, Partial<Record<BattleType, number>>>> = {
  water: { fire: 2, ghost: 2, grass: 0.5 },
  grass: { water: 2, fire: 0.5 },
  fire: { grass: 2, bug: 2, water: 0.5, fire: 0.5 },
  bug: { grass: 2, fire: 0.5 },
  ghost: { ghost: 2, water: 0.5 },
};

export const effectiveness = (attack: BattleType, defend: BattleType) => CHART[attack]?.[defend] ?? 1;

export type Side = 'player' | 'enemy';
export type Effect = 'super' | 'weak' | 'even';

export type Beat =
  | { type: 'used'; side: Side; species: SpeciesId; move: MoveId }
  | { type: 'hit'; side: Side; effect: Effect }
  | { type: 'faint'; side: Side; species: SpeciesId }
  | { type: 'send'; species: SpeciesId }
  | { type: 'cap' }
  | { type: 'ran' };

export interface Fighter {
  species: SpeciesId;
  hp: number;
  maxHp: number;
}

export type Phase = 'choose' | 'won' | 'lost' | 'ran';

export interface BattleState {
  // the generator's position: the same state and action always give the same next state
  seed: number;
  turn: number;
  player: Fighter;
  party: Fighter[];
  slot: number;
  phase: Phase;
  // what the last step did, in order
  beats: Beat[];
}

export type Action = { type: 'move'; move: MoveId } | { type: 'run' };

export interface BattleSetup {
  player: SpeciesId;
  party: SpeciesId[];
  seed: number;
  // test hooks: start with less or more health than the species has
  playerHp?: number;
  enemyHp?: number;
}

// mulberry32: a tiny seeded generator, advanced by returning the next seed with each draw
function draw(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

const fighter = (id: SpeciesId, hp?: number): Fighter | null => {
  const species = speciesOf(id);
  return species ? { species: id, hp: hp ?? species.maxHp, maxHp: hp ?? species.maxHp } : null;
};

export function start(setup: BattleSetup): BattleState | null {
  const player = fighter(setup.player, setup.playerHp);
  const party = setup.party.map((id) => fighter(id, setup.enemyHp));
  if (!player || party.length === 0 || party.some((member) => member === null)) return null;
  return { seed: setup.seed >>> 0, turn: 0, player, party: party as Fighter[], slot: 0, phase: 'choose', beats: [] };
}

export const enemyOf = (state: BattleState): Fighter => state.party[state.slot]!;

// the four slots of the move grid; a move with no data leaves its slot empty
export const moveSlots = (species: SpeciesId): (Move | null)[] => {
  const ids = speciesOf(species)?.moves ?? [];
  return [0, 1, 2, 3].map((i) => (ids[i] ? (moveOf(ids[i]) ?? null) : null));
};

const typeOf = (id: SpeciesId): BattleType => speciesOf(id)?.type ?? 'bug';

function strike(move: Move, from: SpeciesId, to: SpeciesId, seed: number) {
  const [roll, next] = draw(seed);
  const mult = effectiveness(typeOf(from), typeOf(to));
  const damage = Math.max(1, Math.round(move.power * mult) + Math.floor(roll * 3) - 1);
  const effect: Effect = mult > 1 ? 'super' : mult < 1 ? 'weak' : 'even';
  return { damage, effect, seed: next };
}

export function step(state: BattleState, action: Action): BattleState {
  if (state.phase !== 'choose') return state;
  if (action.type === 'run') return { ...state, phase: 'ran', beats: [{ type: 'ran' }] };
  const move = moveOf(action.move);
  if (!move || !speciesOf(state.player.species)?.moves.includes(move.id)) return state;

  const turn = state.turn + 1;
  const beats: Beat[] = [];
  let seed = state.seed;
  const player = { ...state.player };
  const party = state.party.map((member) => ({ ...member }));
  const enemy = party[state.slot]!;
  let slot = state.slot;
  let phase: Phase = 'choose';

  beats.push({ type: 'used', side: 'player', species: player.species, move: move.id });
  const hit = strike(move, player.species, enemy.species, seed);
  seed = hit.seed;
  enemy.hp = Math.max(0, enemy.hp - hit.damage);
  beats.push({ type: 'hit', side: 'enemy', effect: hit.effect });

  // the cap finishes whoever is still standing, so the last turn always ends in a win
  const capped = turn >= TURN_CAP && (enemy.hp > 0 || slot + 1 < party.length);
  if (capped) {
    beats.push({ type: 'cap' });
    enemy.hp = 0;
  }
  if (enemy.hp === 0) {
    beats.push({ type: 'faint', side: 'enemy', species: enemy.species });
    if (capped) party.forEach((member) => (member.hp = 0));
    if (slot + 1 < party.length && !capped) {
      slot += 1;
      beats.push({ type: 'send', species: party[slot]!.species });
    } else phase = 'won';
  } else {
    const enemyMoves = (speciesOf(enemy.species)?.moves ?? []).map(moveOf).filter((m): m is Move => m !== undefined);
    const [roll, next] = draw(seed);
    seed = next;
    const reply = enemyMoves[Math.floor(roll * enemyMoves.length)];
    if (reply) {
      beats.push({ type: 'used', side: 'enemy', species: enemy.species, move: reply.id });
      const back = strike(reply, enemy.species, player.species, seed);
      seed = back.seed;
      player.hp = Math.max(0, player.hp - back.damage);
      beats.push({ type: 'hit', side: 'player', effect: back.effect });
      if (player.hp === 0) {
        beats.push({ type: 'faint', side: 'player', species: player.species });
        phase = 'lost';
      }
    }
  }
  return { seed, turn, player, party, slot, phase, beats };
}
