import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BACK } from '../game/world/lines';
import './panels.css';
import { usePanel } from './usePanel';

interface Props {
  title: string;
  className?: string;
  onClose: () => void;
  // the panel's own keys, taken before Esc, X and Enter
  onKey?: (event: KeyboardEvent) => boolean;
  // beside the heading, such as a count
  aside?: ReactNode;
  backLabel?: string;
  children: ReactNode;
}

// the shell every menu panel shares: dialog, heading, back button, key handling, and focus that starts inside on the control marked data-autofocus (the back button if none is)
export function PanelShell({ title, className = '', onClose, onKey, aside, backLabel = BACK, children }: Props) {
  const back = useRef<HTMLButtonElement>(null);
  const panel = usePanel(onClose, onKey);

  useEffect(() => {
    (panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? back.current)?.focus();
  }, [panel]);

  return (
    <div ref={panel} className={`pq-panel ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <h2>{title}</h2>
        {aside}
      </header>
      {children}
      <button ref={back} type="button" className="pq-panel-back" onClick={onClose}>
        {backLabel}
      </button>
    </div>
  );
}
