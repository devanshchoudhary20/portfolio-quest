import { trainerId } from '../content';
import type { State } from '../state/store';
import type { MusicId } from './manifest';

type Scene = Pick<State, 'phase' | 'battle' | 'town' | 'place'>;

const CHAMPION = trainerId('devansh');
const TOWER = ['lobby', 'floor1', 'floor2', 'floor3', 'floor4', 'basement'];
const TOWN_TRACK: Record<string, MusicId> = { agra: 'agra', gear: 'gear', junglee: 'junglee', marrfa: 'marrfa', testmu: 'testmu', elite: 'elite' };

function battleTrack(battle: NonNullable<State['battle']>): MusicId {
  if (battle.request.kind === 'wild') return 'battle_wild';
  return battle.request.trainer === CHAMPION ? 'battle_champion' : 'battle_trainer';
}

function placeTrack(town: string, place: string | null): MusicId {
  if (place === 'hall') return 'hall_of_fame';
  if (place?.endsWith('gym')) return 'gym';
  if (town === 'testmu' && place && TOWER.includes(place)) return 'testmu_tower';
  return TOWN_TRACK[town] ?? 'agra';
}

// the one track that should be playing for this scene
export function musicFor(scene: Scene): MusicId {
  if (scene.phase !== 'play') return 'title';
  if (scene.battle) return battleTrack(scene.battle);
  return placeTrack(scene.town, scene.place);
}
