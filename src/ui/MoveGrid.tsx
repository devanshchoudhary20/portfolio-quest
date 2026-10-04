import { useEffect, useRef, useState } from 'react';
import type { SpeciesId } from '../content';
import { battleAct } from '../game/battle/controller';
import { moveSlots } from '../game/battle/engine';
import { MOVE_EMPTY } from '../game/world/lines';
import { useCaptureKeys } from './useCaptureKeys';

const ACCEPT = ['Enter', 'z', 'Z'];
// X is the Running Shoes key and stays out of this list, so holding it into a fight cannot flee
const BACK = ['Escape'];
const COLUMNS = 2;

// arrow keys move inside the 2 x 2 grid, never onto an empty slot
export function nextSlot(from: number, key: string, filled: boolean[]): number {
  const step = key === 'ArrowLeft' || key === 'a' ? -1 : key === 'ArrowRight' || key === 'd' ? 1 : key === 'ArrowUp' || key === 'w' ? -COLUMNS : key === 'ArrowDown' || key === 's' ? COLUMNS : 0;
  const to = from + step;
  const sameRow = Math.abs(step) !== 1 || Math.floor(to / COLUMNS) === Math.floor(from / COLUMNS);
  return step !== 0 && sameRow && filled[to] ? to : from;
}

interface Props {
  species: SpeciesId;
  onFocus: (index: number) => void;
  // the id of the fact preview, tied to the focused move
  describedBy?: string;
}

export function MoveGrid({ species, onFocus, describedBy }: Props) {
  const slots = moveSlots(species);
  const filled = slots.map((slot) => slot !== null);
  const [index, setIndex] = useState(Math.max(0, filled.indexOf(true)));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    refs.current[index]?.focus();
    onFocus(index);
  }, [index, onFocus]);

  const pick = (at: number) => {
    const move = slots[at];
    if (move) battleAct({ type: 'move', move: move.id });
  };

  useCaptureKeys((event) => {
    // a held Z must not pick slot 0 over and over
    if (event.repeat && (ACCEPT.includes(event.key) || BACK.includes(event.key))) return true;
    const to = nextSlot(index, event.key, filled);
    if (to !== index) setIndex(to);
    else if (ACCEPT.includes(event.key)) pick(index);
    else if (BACK.includes(event.key)) battleAct({ type: 'run' });
    else if (!event.key.startsWith('Arrow')) return false;
    return true;
  });

  const buttons = slots.map((slot, i) => (
    <button
      key={slot?.id ?? `empty-${i}`}
      ref={(el) => {
        refs.current[i] = el;
      }}
      type="button"
      role="menuitem"
      disabled={!slot}
      tabIndex={i === index ? 0 : -1}
      aria-describedby={i === index ? describedBy : undefined}
      className={i === index ? 'is-active' : ''}
      onClick={() => pick(i)}
      onPointerEnter={() => slot && setIndex(i)}
    >
      {slot?.name ?? MOVE_EMPTY}
    </button>
  ));

  return (
    <div className="pq-moves" role="menu" aria-label="Moves">
      {buttons}
    </div>
  );
}
