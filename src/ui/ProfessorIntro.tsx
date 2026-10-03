import { useState } from 'react';
import type { Mode } from '../game/world/save';
import { Typed } from './Dialog';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { PORTRAIT_SRC } from './portraits';
import { actions } from './useGame';

type Step = 'welcome' | 'ask' | 'offer';

const SPEAKER = 'Professor Stack';
const LINES: Record<Step, string> = {
  welcome: 'Welcome to Kernel Region. I am Professor Stack.',
  ask: 'Before we start: are you a recruiter, an engineer, or just curious?',
  offer: 'Then you want the short version. Open it now?',
};

// the starter pick joins this flow in Phase 4; until then every answer walks out to Agra
export function ProfessorIntro() {
  const [step, setStep] = useState<Step>('welcome');

  const choose = (mode: Mode) => {
    actions.setMode(mode);
    if (mode === 'recruiter') setStep('offer');
    else actions.beginPlay();
  };

  const menus: Record<Step, MenuItem[]> = {
    welcome: [],
    ask: [
      { label: 'Recruiter', onSelect: () => choose('recruiter') },
      { label: 'Engineer', onSelect: () => choose('engineer') },
      { label: 'Just curious', onSelect: () => choose('curious') },
    ],
    offer: [
      { label: 'Open Recruiter Mode', onSelect: () => location.assign('/resume/') },
      { label: 'Play anyway', onSelect: actions.beginPlay },
    ],
  };
  const items = menus[step];

  return (
    <div className="pq-intro">
      <div className="pq-dialog" role="dialog" aria-label={SPEAKER}>
        <div className="pq-tab">{SPEAKER}</div>
        <div className="pq-box">
          <img className="pq-portrait" src={PORTRAIT_SRC.professor} alt="" />
          <Typed line={LINES[step]} count={LINES[step].length} />
          {step === 'welcome' ? (
            <button type="button" className="pq-next" aria-label="Next" onClick={() => setStep('ask')} autoFocus>
              <span className="pq-arrow" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      {items.length > 0 ? <Menu key={step} className="pq-choice" label="Answer" items={items} /> : null}
    </div>
  );
}
