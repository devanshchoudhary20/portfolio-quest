import type { CSSProperties } from 'react';
import { isCoarsePointer, landscapeScale } from '../game/viewport';
import { AskPanel } from './AskPanel';
import { Dialog } from './Dialog';
import { Hud } from './Hud';
import { ProfessorIntro } from './ProfessorIntro';
import { RecruiterMode } from './RecruiterMode';
import { OptionsPanel, StartMenu } from './StartMenu';
import { Touch } from './Touch';
import { TravelCard } from './TravelCard';
import { useGame } from './useGame';

const COARSE = isCoarsePointer();

export function Root() {
  const phase = useGame((s) => s.phase);
  const dialog = useGame((s) => s.dialog);
  const panel = useGame((s) => s.panel);
  const stage = useGame((s) => s.stage);
  const travel = useGame((s) => s.travel);
  const style = {
    left: stage.left,
    top: stage.top,
    width: stage.width,
    height: stage.height,
    '--px': `${stage.px}px`,
  } as CSSProperties;
  const introStyle = { '--px': `${landscapeScale(innerWidth, innerHeight)}px` } as CSSProperties;
  const announced = dialog?.lines[dialog.index] ?? '';

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
        <Hud />
        {panel === 'menu' ? <StartMenu /> : null}
        {panel === 'options' ? <OptionsPanel /> : null}
        {panel === 'recruiter' ? <RecruiterMode /> : null}
        {panel === 'ask' ? <AskPanel /> : null}
        {dialog ? <Dialog dialog={dialog} /> : null}
        {travel ? <TravelCard travel={travel} /> : null}
        <p className="pq-sr" aria-live="polite">
          {announced}
        </p>
      </div>
      {COARSE ? <Touch /> : null}
    </>
  );
}
