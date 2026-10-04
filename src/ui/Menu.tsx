import { useEffect, useRef, useState } from 'react';
import { useCaptureKeys } from './useCaptureKeys';
import { actions } from './useGame';

export interface MenuItem {
  label: string;
  hint?: string;
  onSelect: () => void;
}

interface Props {
  items: MenuItem[];
  label: string;
  onCancel?: () => void;
  className?: string;
  initialIndex?: number;
}

const ACCEPT = ['Enter', 'z', 'Z'];
const CANCEL = ['Escape', 'x', 'X'];

export function Menu({ items, label, onCancel, className = '', initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (at: number) => {
    actions.playCue('confirm');
    items[at]?.onSelect();
  };

  const hover = (at: number) => {
    if (at !== index) actions.playCue('menu_move');
    setIndex(at);
  };

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    refs.current[index]?.focus();
  }, [index]);

  useCaptureKeys((event) => {
    const step = event.key === 'ArrowDown' || event.key === 's' || (event.key === 'Tab' && !event.shiftKey) ? 1 : event.key === 'ArrowUp' || event.key === 'w' || (event.key === 'Tab' && event.shiftKey) ? -1 : 0;
    if (step) {
      setIndex((i) => (i + step + items.length) % items.length);
      actions.playCue('menu_move');
    } else if (ACCEPT.includes(event.key)) select(index);
    else if (CANCEL.includes(event.key) && onCancel) {
      actions.playCue('cancel');
      onCancel();
    }
    else return false;
    return true;
  });

  return (
    <ul className={`pq-menu ${className}`} role="menu" aria-label={label}>
      {items.map((item, i) => (
        <li key={item.label} role="none">
          <button
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="menuitem"
            type="button"
            tabIndex={i === index ? 0 : -1}
            className={i === index ? 'is-active' : ''}
            onClick={() => select(i)}
            onPointerEnter={() => hover(i)}
          >
            {item.label}
            {item.hint ? <small>{item.hint}</small> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
