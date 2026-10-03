import type { CSSProperties } from 'react';
import { townName } from '../game/world/towns';
import type { Travel } from '../state/store';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { actions } from './useGame';

const FALLBACK_NAME = 'the next town';

export function TravelCard({ travel }: { travel: Travel }) {
  const name = townName(travel.town) ?? FALLBACK_NAME;
  const percent = Math.round(Math.min(1, Math.max(0, travel.progress)) * 100);
  const items: MenuItem[] = [{ label: 'Retry', onSelect: () => actions.chooseTravel('retry') }];
  if (travel.canGoBack) items.push({ label: 'Back', onSelect: () => actions.chooseTravel('back') });

  if (travel.status === 'error') {
    return (
      <div className="pq-travel" data-testid="travel-card" role="alert">
        <p>{`Couldn't reach ${name}. Try again`}</p>
        <Menu className="pq-travel-menu" label="Trip failed" items={items} />
      </div>
    );
  }
  return (
    <div className="pq-travel" data-testid="travel-card" role="status">
      <p>{`Traveling to ${name}...`}</p>
      <div className="pq-bar" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <i style={{ '--p': `${percent}%` } as CSSProperties} />
      </div>
      <small>{`${percent}%`}</small>
    </div>
  );
}
