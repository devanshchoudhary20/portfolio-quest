import { FLAGS } from '../game/world/flags';
import { loopLabel } from '../game/world/lines';
import { townName } from '../game/world/towns';
import { useGame } from './useGame';

export function Hud() {
  const town = useGame((s) => s.town);
  const dialogOpen = useGame((s) => s.dialog !== null);
  const loops = useGame((s) => s.loops);
  const broken = useGame((s) => s.flags.includes(FLAGS.loopBreak));
  const name = townName(town);
  const lapText = loops > 0 && !broken ? loopLabel(loops) : null;
  return (
    <>
      {name ? <div className="pq-banner">{name}</div> : null}
      {lapText ? (
        <div className="pq-loops" role="status">
          {lapText}
        </div>
      ) : null}
      {dialogOpen ? null : <div className="pq-hint">Enter: Menu</div>}
    </>
  );
}
