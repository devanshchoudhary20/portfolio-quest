import type { PointerEvent } from 'react';
import type { Dir } from '../game/world/save';
import { actions } from './useGame';

const PAD: { dir: Dir; glyph: string }[] = [
  { dir: 'up', glyph: '▲' },
  { dir: 'left', glyph: '◀' },
  { dir: 'right', glyph: '▶' },
  { dir: 'down', glyph: '▼' },
];

const hold = (dir: Dir) => ({
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    actions.setHeld(dir);
  },
  onPointerUp: () => actions.setHeld(null),
  onPointerCancel: () => actions.setHeld(null),
});

const holdB = {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    actions.setRun(true);
    actions.pressB();
  },
  onPointerUp: () => actions.setRun(false),
  onPointerCancel: () => actions.setRun(false),
};

export function Touch() {
  return (
    <div className="pq-touch">
      <div className="pq-pad" role="group" aria-label="Move">
        {PAD.map(({ dir, glyph }) => (
          <button key={dir} type="button" className={`pq-pad-${dir}`} aria-label={`Move ${dir}`} {...hold(dir)}>
            {glyph}
          </button>
        ))}
      </div>
      <button type="button" className="pq-b" aria-label="B, hold to run" {...holdB}>
        B
      </button>
      <button type="button" className="pq-a" aria-label="A, talk" onPointerDown={actions.pressA}>
        A
      </button>
      <button type="button" className="pq-menu-btn" onClick={actions.pressMenu}>
        Menu
      </button>
    </div>
  );
}
