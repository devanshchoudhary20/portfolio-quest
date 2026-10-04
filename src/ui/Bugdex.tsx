import { useState } from 'react';
import { CATCHABLE, WILD_BY_TOWN, caughtCount, speciesOf } from '../game/battle/data';
import { BUGDEX_TITLE, FALLBACK_NAME, FLAVOR_LINES, UNSEEN, bugsCaughtLabel, findIn, roamsIn, typeLabel } from '../game/world/lines';
import { townName } from '../game/world/towns';
import { DexFrame } from './DexFrame';
import { useGame } from './useGame';
import { backToMenu } from './usePanel';

// the towns whose grass a species roams in
const placesOf = (species: string) =>
  Object.entries(WILD_BY_TOWN)
    .filter(([, roster]) => roster.some((id) => id === species))
    .flatMap(([town]) => townName(town) ?? [])
    .join(', ');

// the Skilldex layout, one row per catchable bug; a bug shows its name and flavor line once caught
export function Bugdex() {
  const [index, setIndex] = useState(0);
  const caught = useGame((s) => s.caught);
  // CATCHABLE is built from the wild rosters, which are never empty, and the cursor stays inside it
  const id = CATCHABLE[index]!;
  const species = speciesOf(id);
  const isCaught = caught.includes(id);
  const rows = CATCHABLE.map((bug) => ({
    key: bug,
    label: caught.includes(bug) ? (speciesOf(bug)?.name ?? FALLBACK_NAME) : UNSEEN,
    muted: !caught.includes(bug),
  }));
  const place = placesOf(id);
  const flavor = species?.moves[0] ? FLAVOR_LINES.get(species.moves[0]) : undefined;
  const typeChip = species ? <span className="pq-chip">{typeLabel(species.type)}</span> : null;
  const flavorLine = flavor ? <p>{flavor}</p> : null;
  const detail = isCaught ? (
    <>
      <h3>{species?.name ?? FALLBACK_NAME}</h3>
      {typeChip}
      {flavorLine}
      <p className="pq-muted">{roamsIn(place)}</p>
    </>
  ) : (
    <>
      <h3>{UNSEEN}</h3>
      <p className="pq-muted">{findIn(place)}</p>
    </>
  );

  return (
    <DexFrame
      title={BUGDEX_TITLE}
      count={bugsCaughtLabel(caughtCount(caught), CATCHABLE.length)}
      rows={rows}
      index={index}
      onIndex={setIndex}
      detail={detail}
      onClose={backToMenu}
    />
  );
}
