import { FLAGS } from '../game/world/flags';
import { BAG_EMPTY, BAG_TITLE, BAG_USE, ITEM_NAME } from '../game/world/lines';
import { PanelShell } from './PanelShell';
import { actions, useGame } from './useGame';
import { backToMenu } from './usePanel';

// the Resume if held; using it opens the same download as the Mart
export function BagPanel() {
  const held = useGame((s) => s.flags.includes(FLAGS.resume));
  const content = held ? (
    <p className="pq-mart-item">
      <span>{`${ITEM_NAME} x1`}</span>
      <button type="button" data-autofocus onClick={actions.requestDownload}>
        {BAG_USE}
      </button>
    </p>
  ) : (
    <p className="pq-muted">{BAG_EMPTY}</p>
  );

  return (
    <PanelShell title={BAG_TITLE} className="pq-bag" onClose={backToMenu}>
      {content}
    </PanelShell>
  );
}
