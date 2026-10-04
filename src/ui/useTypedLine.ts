import { useEffect, useRef } from 'react';
import { INSTANT } from '../state/prefs';
import { actions, useGame } from './useGame';
import { useTypewriter } from './useTypewriter';

// the dialog and the battle message box type a line the same way: honors text speed and reduced motion, and a store press completes the line
export function useTypedLine(line: string) {
  const textSpeed = useGame((s) => s.textSpeed);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const finishTick = useGame((s) => s.finishTick);
  const mountedTick = useRef(finishTick);
  const { count, done, finish } = useTypewriter(line, textSpeed, reducedMotion || textSpeed === INSTANT);

  useEffect(() => {
    actions.setTyping(!done);
  }, [done]);

  useEffect(() => {
    if (finishTick !== mountedTick.current) finish();
  }, [finishTick]);

  return { count, done };
}
