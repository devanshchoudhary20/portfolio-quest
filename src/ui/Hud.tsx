import { townName } from '../game/world/towns';
import { useGame } from './useGame';

export function Hud() {
  const town = useGame((s) => s.town);
  const dialogOpen = useGame((s) => s.dialog !== null);
  const name = townName(town);
  return (
    <>
      {name ? <div className="pq-banner">{name}</div> : null}
      {dialogOpen ? null : <div className="pq-hint">Enter: Menu</div>}
    </>
  );
}
