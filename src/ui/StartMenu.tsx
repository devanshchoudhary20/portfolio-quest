import { useState } from 'react';
import { facts, skillGroups } from '../content';
import { CATCHABLE, caughtCount } from '../game/battle/data';
import { saveNow } from '../game/world/autosave';
import { countBadges } from '../game/world/conditions';
import { BAG_TITLE, BUGDEX_TITLE, CARD_TITLE, CLOSE, SAVED, SAVE_FAILED, SKILLDEX_TITLE, badgesLabel, bugsCaughtLabel, factsSeenLabel, soundLabel, timeLabel, wildBugsLabel } from '../game/world/lines';
import { canStore } from '../game/world/save';
import { TEXT_SPEED_LABELS, writeSound, writeTextSpeed, writeWildBugs } from '../state/prefs';
import { wildBugsOn } from '../state/store';
import type { TextSpeed } from '../state/prefs';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { actions, useGame } from './useGame';
import { backToMenu } from './usePanel';

const NEXT_SPEED: Record<TextSpeed, TextSpeed> = { 1: 2, 2: 3, 3: 4, 4: 1 };

// the row last picked, so Esc from a panel lands back on the row that opened it
let lastRow = 0;

function save() {
  actions.closePanel();
  actions.openDialog({ speaker: '', portrait: null, lines: [saveNow() ? SAVED : SAVE_FAILED] });
}

export function StartMenu() {
  const badges = useGame((s) => countBadges(s.flags));
  const seen = useGame((s) => s.seen.length);
  const bugs = useGame((s) => caughtCount(s.caught));
  const playSeconds = useGame((s) => s.playSeconds);
  const rows: MenuItem[] = [
    { label: SKILLDEX_TITLE, hint: factsSeenLabel(seen, facts.length), onSelect: () => actions.openPanel('skilldex') },
    { label: BUGDEX_TITLE, hint: bugsCaughtLabel(bugs, CATCHABLE.length), onSelect: () => actions.openPanel('bugdex') },
    { label: CARD_TITLE, onSelect: () => actions.openPanel('card') },
    { label: BAG_TITLE, onSelect: () => actions.openPanel('bag') },
    { label: 'Save', onSelect: save },
    { label: 'Options', onSelect: () => actions.openPanel('options') },
    { label: 'Recruiter Mode', hint: 'Plain resume, one page.', onSelect: () => actions.openPanel('recruiter') },
    { label: CLOSE, onSelect: actions.closePanel },
  ];
  const items = rows.map((row, i) => ({
    ...row,
    onSelect: () => {
      lastRow = i;
      row.onSelect();
    },
  }));
  return (
    <div className="pq-start pq-sheet">
      <Menu label="Start menu" items={items} initialIndex={lastRow} onCancel={actions.closePanel} />
      <p className="pq-note" data-testid="stats">
        {badgesLabel(badges, skillGroups.length)}
      </p>
      <p className="pq-note" data-testid="playtime">
        {timeLabel(playSeconds)}
      </p>
    </div>
  );
}

export function OptionsPanel() {
  const textSpeed = useGame((s) => s.textSpeed);
  const wildBugs = useGame(wildBugsOn);
  const sound = useGame((s) => s.sound);
  const [storable] = useState(canStore);
  const cycle = () => {
    const next = NEXT_SPEED[textSpeed];
    actions.setTextSpeed(next);
    writeTextSpeed(next);
    actions.requestSave();
  };
  const toggleWildBugs = () => {
    actions.setWildBugs(!wildBugs);
    writeWildBugs(!wildBugs);
  };
  const toggleSound = () => {
    actions.setSound(!sound);
    writeSound(!sound);
  };
  const items: MenuItem[] = [
    { label: `Text speed: ${TEXT_SPEED_LABELS[textSpeed]}`, onSelect: cycle },
    { label: wildBugsLabel(wildBugs), onSelect: toggleWildBugs },
    { label: soundLabel(sound), onSelect: toggleSound },
    { label: 'Back', onSelect: backToMenu },
  ];
  return (
    <div className="pq-start pq-sheet">
      <Menu label="Options" items={items} onCancel={backToMenu} />
      {storable ? null : <p className="pq-note">Progress will not be saved in this browser.</p>}
    </div>
  );
}
