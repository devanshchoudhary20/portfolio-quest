import { useState } from 'react';
import { saveNow } from '../game/world/autosave';
import { SAVED, SAVE_FAILED } from '../game/world/lines';
import { canStore } from '../game/world/save';
import { TEXT_SPEED_LABELS, writeTextSpeed } from '../state/prefs';
import type { TextSpeed } from '../state/prefs';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { actions, useGame } from './useGame';

const NEXT_SPEED: Record<TextSpeed, TextSpeed> = { 1: 2, 2: 3, 3: 4, 4: 1 };

function save() {
  actions.closePanel();
  actions.openDialog({ speaker: '', portrait: null, lines: [saveNow() ? SAVED : SAVE_FAILED] });
}

export function StartMenu() {
  const items: MenuItem[] = [
    { label: 'Save', onSelect: save },
    { label: 'Options', onSelect: () => actions.openPanel('options') },
    { label: 'Recruiter Mode', hint: 'Plain resume, one page.', onSelect: () => actions.openPanel('recruiter') },
    { label: 'Close', onSelect: actions.closePanel },
  ];
  return <Menu className="pq-start" label="Start menu" items={items} onCancel={actions.closePanel} />;
}

export function OptionsPanel() {
  const textSpeed = useGame((s) => s.textSpeed);
  const [storable] = useState(canStore);
  const cycle = () => {
    const next = NEXT_SPEED[textSpeed];
    actions.setTextSpeed(next);
    writeTextSpeed(next);
    actions.requestSave();
  };
  const items: MenuItem[] = [
    { label: `Text speed: ${TEXT_SPEED_LABELS[textSpeed]}`, onSelect: cycle },
    { label: 'Back', onSelect: () => actions.openPanel('menu') },
  ];
  return (
    <div className="pq-start">
      <Menu label="Options" items={items} onCancel={() => actions.openPanel('menu')} />
      {storable ? null : <p className="pq-note">Progress will not be saved in this browser.</p>}
    </div>
  );
}
