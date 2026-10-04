import { useState } from 'react';
import type { Mode } from '../game/world/save';
import { RECRUITER_STARTER, STARTER_PICK } from '../game/world/lines';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { ProfessorBox } from './ProfessorBox';
import { StarterPick } from './StarterPick';
import { actions } from './useGame';

type Step = 'welcome' | 'ask' | 'offer' | 'auto' | 'pick';

const LINES: Record<Exclude<Step, 'pick'>, string> = {
  welcome: 'Welcome to Kernel Region. I am Professor Stack.',
  ask: 'Before we start: are you a recruiter, an engineer, or just curious?',
  offer: 'Then you want the short version. Open it now?',
  auto: RECRUITER_STARTER,
};

// a recruiter plays on with React and no pick; everyone else chooses a starter
export function ProfessorIntro() {
  const [step, setStep] = useState<Step>('welcome');

  const choose = (mode: Mode) => {
    actions.setMode(mode);
    setStep(mode === 'recruiter' ? 'offer' : 'pick');
  };
  const playAnyway = () => {
    actions.chooseStarter('react');
    setStep('auto');
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
      { label: 'Play anyway', onSelect: playAnyway },
    ],
    auto: [],
    pick: [],
  };
  const items = menus[step];
  const next = step === 'welcome' ? () => setStep('ask') : step === 'auto' ? actions.beginPlay : undefined;

  if (step === 'pick') return <StarterPick prompt={STARTER_PICK} />;
  return (
    <div className="pq-intro">
      <ProfessorBox line={LINES[step]} onNext={next} />
      {items.length > 0 ? <Menu key={step} className="pq-choice" label="Answer" items={items} /> : null}
    </div>
  );
}
