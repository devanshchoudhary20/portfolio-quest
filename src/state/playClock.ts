import { store } from './store';

const TICK_MS = 1000;

// a hidden tab does not count as play time
export function startPlayClock() {
  const id = setInterval(() => {
    const { phase, actions } = store.getState();
    if (phase === 'play' && document.visibilityState === 'visible') actions.tickPlay();
  }, TICK_MS);
  return () => clearInterval(id);
}
