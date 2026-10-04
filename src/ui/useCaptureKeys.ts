import { useLayoutEffect, useRef } from 'react';

// capture phase so a panel handles its keys before the map's keyboard listener sees them
export function useCaptureKeys(handler: (event: KeyboardEvent) => boolean) {
  const latest = useRef(handler);
  latest.current = handler;
  // layout, not passive: Preact defers passive effects to after paint, and a key pressed in that gap would reach the map instead of the new panel
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!latest.current(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', listener, true);
    return () => window.removeEventListener('keydown', listener, true);
  }, []);
}
