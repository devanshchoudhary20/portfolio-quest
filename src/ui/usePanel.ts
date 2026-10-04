import { useRef } from 'react';
import { isTyping } from '../game/input/typing';
import { useCaptureKeys } from './useCaptureKeys';
import { useFocusTrap } from './useFocusTrap';
import { actions } from './useGame';

// back to the Start menu, which re-focuses the row that opened the panel
export const backToMenu = () => actions.openPanel('menu');

const CLOSE_KEYS = ['x', 'X'];
const ACCEPT_KEYS = ['Enter', 'z', 'Z'];

// the shared shell of a menu panel: Tab stays inside, Esc and X close, Enter and Z press the focused control; `onKey` takes the panel's own keys first
export function usePanel(onClose: () => void, onKey?: (event: KeyboardEvent) => boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  useCaptureKeys((event) => {
    if (isTyping(event)) return false;
    if (onKey?.(event)) return true;
    if (CLOSE_KEYS.includes(event.key)) onClose();
    else if (ACCEPT_KEYS.includes(event.key)) (document.activeElement as HTMLElement | null)?.click();
    else return false;
    return true;
  });
  return ref;
}
