import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { PanelShell } from './PanelShell';

export interface DexRow {
  key: string;
  label: string;
  muted: boolean;
}

export interface DexTab {
  key: string;
  label: string;
}

interface Props {
  title: string;
  count: string;
  tabs?: DexTab[];
  tab?: number;
  onTab?: (index: number) => void;
  rows: DexRow[];
  index: number;
  onIndex: (index: number) => void;
  detail: ReactNode;
  onClose: () => void;
}

const UP = ['ArrowUp', 'w', 'W'];
const DOWN = ['ArrowDown', 's', 'S'];
const LEFT = ['ArrowLeft', 'a', 'A'];
const RIGHT = ['ArrowRight', 'd', 'D'];

// the list-left, detail-right layout the Skilldex and the Bugdex share; the parent owns the cursor and the data
export function DexFrame({ title, count, tabs = [], tab = 0, onTab, rows, index, onIndex, detail, onClose }: Props) {
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = (list: readonly unknown[], from: number, by: number) => (from + by + list.length) % Math.max(1, list.length);

  const onKey = (event: KeyboardEvent) => {
    if (UP.includes(event.key)) onIndex(step(rows, index, -1));
    else if (DOWN.includes(event.key)) onIndex(step(rows, index, 1));
    else if (onTab && LEFT.includes(event.key)) onTab(step(tabs, tab, -1));
    else if (onTab && RIGHT.includes(event.key)) onTab(step(tabs, tab, 1));
    else return false;
    return true;
  };

  useEffect(() => {
    rowRefs.current[index]?.focus();
  }, [index, tab]);

  const tabButtons = tabs.map((item, i) => (
    <button key={item.key} type="button" role="tab" aria-selected={i === tab} className={i === tab ? 'is-active' : ''} onClick={() => onTab?.(i)}>
      {item.label}
    </button>
  ));
  const rowButtons = rows.map((row, i) => {
    const active = i === index;
    return (
      <li key={row.key}>
        <button
          ref={(el) => {
            rowRefs.current[i] = el;
          }}
          type="button"
          aria-current={active}
          data-autofocus={active ? '' : undefined}
          className={`${active ? 'is-active' : ''}${row.muted ? ' is-muted' : ''}`}
          onClick={() => onIndex(i)}
          onFocus={() => onIndex(i)}
        >
          {row.label}
        </button>
      </li>
    );
  });
  const groups =
    tabs.length > 0 ? (
      <div className="pq-tabs" role="tablist" aria-label={`${title} groups`}>
        {tabButtons}
      </div>
    ) : null;

  return (
    <PanelShell title={title} className="pq-dex" onClose={onClose} onKey={onKey} aside={<p data-testid="dex-count">{count}</p>}>
      {groups}
      <div className="pq-dex-body">
        <ul className="pq-dex-list" aria-label={`${title} entries`}>
          {rowButtons}
        </ul>
        <section className="pq-dex-detail" aria-live="polite">
          {detail}
        </section>
      </div>
    </PanelShell>
  );
}
