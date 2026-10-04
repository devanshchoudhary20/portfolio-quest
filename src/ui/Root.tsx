import type { CSSProperties } from 'react';
import { isCoarsePointer, landscapeScale } from '../game/viewport';
import { battleLine } from '../game/battle/session';
import { AskPanel } from './AskPanel';
import { BagPanel } from './BagPanel';
import { Battle } from './Battle';
import { Bugdex } from './Bugdex';
import { Dialog } from './Dialog';
import { HallOfFame } from './HallOfFame';
import { Hud } from './Hud';
import { ProfessorIntro } from './ProfessorIntro';
import { RecruiterMode } from './RecruiterMode';
import { ResumeMart } from './ResumeMart';
import { Skilldex } from './Skilldex';
import { OptionsPanel, StartMenu } from './StartMenu';
import { Touch } from './Touch';
import { TrainerCard } from './TrainerCard';
import { TravelCard } from './TravelCard';
import { useDownload } from './useDownload';
import { useGame } from './useGame';

const COARSE = isCoarsePointer();

export function Root() {
  useDownload();
  const phase = useGame((s) => s.phase);
  const dialog = useGame((s) => s.dialog);
  const panel = useGame((s) => s.panel);
  const stage = useGame((s) => s.stage);
  const travel = useGame((s) => s.travel);
  const battling = useGame((s) => s.battle !== null);
  const battleText = useGame((s) => (s.battle ? battleLine(s.battle) : ''));
  const style = {
    left: stage.left,
    top: stage.top,
    width: stage.width,
    height: stage.height,
    '--px': `${stage.px}px`,
  } as CSSProperties;
  const introStyle = { '--px': `${landscapeScale(innerWidth, innerHeight)}px` } as CSSProperties;
  const announced = dialog?.lines[dialog.index] ?? battleText;

  if (phase === 'title') return null;
  if (phase === 'intro') {
    return (
      <div className="pq-stage pq-full" style={introStyle}>
        <ProfessorIntro />
      </div>
    );
  }
  return (
    <>
      <div className="pq-stage" style={style}>
        {battling ? <Battle /> : <Hud />}
        {panel === 'menu' ? <StartMenu /> : null}
        {panel === 'options' ? <OptionsPanel /> : null}
        {panel === 'recruiter' ? <RecruiterMode /> : null}
        {panel === 'ask' ? <AskPanel /> : null}
        {panel === 'skilldex' ? <Skilldex /> : null}
        {panel === 'bugdex' ? <Bugdex /> : null}
        {panel === 'card' ? <TrainerCard /> : null}
        {panel === 'bag' ? <BagPanel /> : null}
        {panel === 'mart' ? <ResumeMart /> : null}
        {panel === 'hof' ? <HallOfFame /> : null}
        {dialog ? <Dialog dialog={dialog} /> : null}
        {travel ? <TravelCard travel={travel} /> : null}
        <p className="pq-sr" aria-live="polite">
          {announced}
        </p>
      </div>
      {COARSE && !battling ? <Touch /> : null}
    </>
  );
}
