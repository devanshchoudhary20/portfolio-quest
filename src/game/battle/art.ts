import type { SpeciesId } from '../../content';
import { speciesOf, trainerOf } from './data';
import type { BgId } from './data';
import type { BattleRequest } from './session';
import { bgOf, enemyIds } from './session';

export interface ArtFile {
  key: string;
  url: string;
}

const ROOT = '/assets/battle';

export const frontArt = (id: SpeciesId): ArtFile => ({ key: `front-${id}`, url: `${ROOT}/creatures/${id}-front.png` });
export const backArt = (id: SpeciesId): ArtFile => ({ key: `back-${id}`, url: `${ROOT}/creatures/${id}-back.png` });
export const trainerArt = (id: string): ArtFile => ({ key: `trainer-${id}`, url: `${ROOT}/trainers/${id}.png` });
export const bgArt = (id: BgId): ArtFile => ({ key: `bg-${id}`, url: `${ROOT}/bg/${id}.png` });

// everything one battle draws; the Battle scene loads only the ones it does not hold yet
export function artFor(request: BattleRequest, player: SpeciesId): ArtFile[] {
  const trainer = request.kind === 'trainer' ? trainerOf(request.trainer) : undefined;
  return [
    bgArt(bgOf(request)),
    backArt(player),
    ...enemyIds(request).filter((id) => speciesOf(id)).map(frontArt),
    ...(trainer ? [trainerArt(trainer.id)] : []),
  ];
}
