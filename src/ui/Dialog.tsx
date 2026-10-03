import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { DialogState } from '../state/store';
import { PORTRAIT_SRC } from './portraits';
import { INSTANT } from '../state/prefs';
import { actions, useGame } from './useGame';
import { useTypewriter } from './useTypewriter';

// one span per character; the typewriter only changes a CSS count, and the live region in Root announces the whole line once
export function Typed({ line, count }: { line: string; count: number }) {
  const chars = [...line];
  return (
    <p className="pq-text" data-testid="dialog-text" style={{ '--n': count } as CSSProperties}>
      {chars.map((char, i) => (
        <span key={i} aria-hidden="true" style={{ '--i': i } as CSSProperties}>
          {char}
        </span>
      ))}
    </p>
  );
}

// keyed by line in the parent, so each line types from zero
function Line({ dialog }: { dialog: DialogState }) {
  const textSpeed = useGame((s) => s.textSpeed);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const finishTick = useGame((s) => s.finishTick);
  const mountedTick = useRef(finishTick);
  const line = dialog.lines[dialog.index] ?? '';
  const { count, done, finish } = useTypewriter(line, textSpeed, reducedMotion || textSpeed === INSTANT);
  const portrait = dialog.portrait ? PORTRAIT_SRC[dialog.portrait] : null;

  useEffect(() => {
    actions.setTyping(!done);
  }, [done]);

  useEffect(() => {
    if (finishTick !== mountedTick.current) finish();
  }, [finishTick]);

  return (
    <>
      {dialog.speaker ? <div className="pq-tab">{dialog.speaker}</div> : null}
      <div className="pq-box" onClick={actions.pressA}>
        {portrait ? <img className="pq-portrait" src={portrait} alt="" /> : null}
        <Typed line={line} count={count} />
        {done ? <span className="pq-arrow" aria-hidden="true" /> : null}
      </div>
    </>
  );
}

export function Dialog({ dialog }: { dialog: DialogState }) {
  return (
    <div className="pq-dialog" role="dialog" aria-label={dialog.speaker || 'Dialog'}>
      <Line key={`${dialog.speaker}:${dialog.index}:${dialog.lines.length}`} dialog={dialog} />
    </div>
  );
}
