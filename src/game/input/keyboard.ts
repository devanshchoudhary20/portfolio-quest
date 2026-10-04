import { store } from '../../state/store';
import type { Dir } from '../world/save';
import { isTyping } from './typing';

const DIR_KEYS: Record<string, Dir> = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};
const A_KEYS = ['z', 'Z'];
const B_KEYS = ['x', 'X'];

// Z/Enter = A, X = B (and run), Esc = cancel, Enter on the map = Start menu. React panels use capture handlers that stop events first.
export function startKeyboard() {
  const down: Dir[] = [];
  const { actions } = store.getState();

  const sync = () => actions.setHeld(down.at(-1) ?? null);

  const onKeyDown = (event: KeyboardEvent) => {
    // releases always count (see onKeyUp), or a key held while a prompt opens would stay down
    if (isTyping(event) || event.ctrlKey || event.metaKey || event.altKey || store.getState().phase !== 'play') return;
    const dir = DIR_KEYS[event.key];
    if (dir) {
      if (!down.includes(dir)) down.push(dir);
      sync();
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    const state = store.getState();
    if (A_KEYS.includes(event.key) || (event.key === 'Enter' && state.dialog)) actions.pressA();
    else if (event.key === 'Enter') actions.pressMenu();
    else if (B_KEYS.includes(event.key)) {
      actions.setRun(true);
      actions.pressB();
    } else if (event.key === 'Escape') actions.pressB();
    else return;
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const dir = DIR_KEYS[event.key];
    if (dir) {
      const at = down.indexOf(dir);
      if (at >= 0) down.splice(at, 1);
      sync();
    } else if (B_KEYS.includes(event.key)) actions.setRun(false);
  };

  const onBlur = () => {
    down.length = 0;
    sync();
    actions.setRun(false);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}
