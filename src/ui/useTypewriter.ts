import { useEffect, useState } from 'react';
import type { TextSpeed } from '../state/prefs';

const MS_PER_CHAR: Record<TextSpeed, number> = { 1: 60, 2: 30, 3: 12, 4: 0 };

// mount one per line (key it): the count starts at 0 and the line completes on demand
export function useTypewriter(text: string, speed: TextSpeed, instant: boolean) {
  const [count, setCount] = useState(instant ? text.length : 0);
  const done = count >= text.length;
  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setCount(count + 1), MS_PER_CHAR[speed]);
    return () => clearTimeout(id);
  }, [count, done, speed]);
  return { count, done, finish: () => setCount(text.length) };
}
