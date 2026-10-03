import { store, toSave } from '../../state/store';
import { writeSave } from './save';

const DEBOUNCE_MS = 500;
let timer: ReturnType<typeof setTimeout> | undefined;

export function saveNow() {
  clearTimeout(timer);
  return writeSave(toSave(store.getState()));
}

const canSave = () => {
  const { phase, landed } = store.getState();
  return phase === 'play' && landed;
};

// every saveTick bump (warp, flag, fact, step) writes once the player has been quiet for 500 ms; leaving the page writes at once
export function startAutosave() {
  const unsubscribe = store.subscribe((state, prev) => {
    if (state.saveTick === prev.saveTick || !canSave()) return;
    clearTimeout(timer);
    timer = setTimeout(saveNow, DEBOUNCE_MS);
  });
  const flush = () => {
    if (canSave()) saveNow();
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    unsubscribe();
    removeEventListener('pagehide', flush);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
