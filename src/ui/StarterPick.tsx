import { useState } from 'react';
import { speciesId } from '../content';
import { speciesOf } from '../game/battle/data';
import { frontArt } from '../game/battle/art';
import { NO, STARTER_LINES, YES, chooseStarter, starterJoined, typeLabel } from '../game/world/lines';
import type { Starter } from '../game/world/save';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { ProfessorBox } from './ProfessorBox';
import { useCaptureKeys } from './useCaptureKeys';
import { actions } from './useGame';

const STARTERS: Starter[] = ['react', 'node', 'claude'];
const ACCEPT = ['Enter', 'z', 'Z'];
const FALLBACK_NAME = 'React';

// three partners on the Professor's table; left and right move the cursor, A asks to confirm
export function StarterPick({ prompt }: { prompt: string }) {
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const [joined, setJoined] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);
  const current = STARTERS[index] ?? 'react';
  const currentName = speciesOf(speciesId(current))?.name ?? FALLBACK_NAME;

  const pick = (at: number) => {
    setIndex(at);
    setAsking(true);
  };
  const confirm = () => {
    actions.chooseStarter(current);
    setAsking(false);
    setJoined(true);
  };

  useCaptureKeys((event) => {
    if (asking || joined) return false;
    if (event.key === 'ArrowLeft' || event.key === 'a') setIndex((i) => Math.max(0, i - 1));
    else if (event.key === 'ArrowRight' || event.key === 'd') setIndex((i) => Math.min(STARTERS.length - 1, i + 1));
    else if (ACCEPT.includes(event.key)) setAsking(true);
    else return false;
    return true;
  });

  const answers: MenuItem[] = [
    { label: YES, onSelect: confirm },
    { label: NO, onSelect: () => setAsking(false) },
  ];
  const cards = STARTERS.map((id, i) => {
    const species = speciesOf(speciesId(id));
    const art = frontArt(speciesId(id));
    const name = species?.name ?? FALLBACK_NAME;
    const orb = broken.includes(id);
    return (
      <button key={id} type="button" className={`pq-starter${i === index ? ' is-active' : ''}`} data-type={species?.type ?? 'water'} onClick={() => pick(i)} aria-label={`${name}, ${typeLabel(species?.type ?? 'water')}`}>
        {i === index ? <span className="pq-pointer" aria-hidden="true" /> : null}
        {orb ? <span className="pq-orb" aria-hidden="true" /> : <img src={art.url} alt="" onError={() => setBroken((list) => [...list, id])} />}
        <b>{name}</b>
        <small>{typeLabel(species?.type ?? 'water')}</small>
      </button>
    );
  });
  const line = joined ? starterJoined(currentName) : asking ? chooseStarter(currentName) : (STARTER_LINES[current] ?? prompt);

  return (
    <div className="pq-intro pq-starters">
      <div className="pq-starter-row" role="group" aria-label="Starters">
        {cards}
      </div>
      {asking ? (
        <div className="pq-choice">
          <Menu label={chooseStarter(currentName)} items={answers} onCancel={() => setAsking(false)} />
        </div>
      ) : null}
      <ProfessorBox line={line} onNext={joined ? actions.beginPlay : undefined} portrait={false} />
    </div>
  );
}
