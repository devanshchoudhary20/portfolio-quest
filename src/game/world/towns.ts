import { isMapTownId, townId } from '../../content';
import type { TownId, TownKey } from '../../content';

export const TOWN_NAMES: Record<TownKey, string> = {
  agra: 'Agra',
  gear: 'Gear City',
  'junglee-a': 'Junglee Jungle',
  'junglee-b': 'Junglee Jungle',
  marrfa: 'Marrfa Estates',
  testmu: 'TestMu City',
  elite: 'Victory Road',
  'patch-center': 'Patch Center',
};

// a map id read from Tiled or a store field is a plain string until it passes this lookup
export const townName = (town: string): string | undefined => (TOWN_NAMES as Record<string, string | undefined>)[town];

// towns whose map ships in public/maps; a warp to any other town gets a "not open yet" line
export const BUILT_TOWNS: readonly TownId[] = [townId('agra')];

export const START = { town: townId('agra'), spawn: 'bedroom' };

export const isBuiltTown = (town: string): town is TownId => (BUILT_TOWNS as readonly string[]).includes(town);

export interface WarpRequest {
  town: TownId;
  spawn?: string;
}

// ?warp=<town>[&spawn=<name>]: a bad value reads as no warp
export function parseWarpParam(search: string): WarpRequest | null {
  const params = new URLSearchParams(search);
  const town = params.get('warp');
  if (!isMapTownId(town) || !isBuiltTown(town)) return null;
  const spawn = params.get('spawn');
  return spawn ? { town, spawn } : { town };
}
