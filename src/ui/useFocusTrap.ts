import type { RefObject } from 'react';
import { useCaptureKeys } from './useCaptureKeys';

const FOCUSABLE = 'a[href], button, input';

// Tab stays inside the panel and Escape closes it; the panel keeps any keys of its own
export function useFocusTrap(panel: RefObject<HTMLElement | null>, onClose: () => void) {
  useCaptureKeys((event) => {
    if (event.key === 'Escape') {
      onClose();
      return true;
    }
    if (event.key !== 'Tab') return false;
    const focusable = [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const at = focusable.indexOf(document.activeElement as HTMLElement);
    // from outside the panel (at -1) Shift+Tab lands on the last item
    const backward = at <= 0 ? focusable.length - 1 : at - 1;
    focusable[event.shiftKey ? backward : (at + 1) % focusable.length]?.focus();
    return true;
  });
}
