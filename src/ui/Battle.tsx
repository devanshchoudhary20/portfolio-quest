import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { speciesOf } from '../game/battle/data';
import { battleAct, battleAdvance, battleRetry, closeBattle } from '../game/battle/controller';
import { moveSlots } from '../game/battle/engine';
import type { BattleState } from '../game/battle/engine';
import { battleLine } from '../game/battle/session';
import { factText } from '../game/world/factText';
import { READ_RESUME, RUN_LABEL, TRY_AGAIN } from '../game/world/lines';
import './battle.css';
import { Typed } from './Dialog';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { MoveGrid } from './MoveGrid';
import { useCaptureKeys } from './useCaptureKeys';
import { actions, useGame } from './useGame';
import { useTypedLine } from './useTypedLine';

const FALLBACK_ENEMY = 'A wild bug';
const FALLBACK_PLAYER = 'Your partner';
const ADVANCE = ['Enter', 'z', 'Z', 'x', 'X', 'Escape', ' '];
const PREVIEW_ID = 'pq-move-fact';

const hpClass = (hp: number, max: number) => (hp / max > 0.5 ? 'hp-high' : hp / max > 0.2 ? 'hp-mid' : 'hp-low');

// reads its own bar from the store, so a tweening bar redraws this box and nothing else
function InfoBox({ name, max, side }: { name: string; max: number; side: 'enemy' | 'player' }) {
  const hp = useGame((s) => s.battle?.shown[side] ?? 0);
  const safeMax = Math.max(1, max);
  const clamped = Math.min(safeMax, Math.max(0, Math.round(hp)));
  const style = { '--p': `${(clamped / safeMax) * 100}%` } as CSSProperties;
  return (
    <div className={`pq-info pq-info-${side}`} data-testid={`${side}-info`}>
      <b>{name}</b>
      <div className="pq-hp">
        <span aria-hidden="true">HP</span>
        <div className="pq-bar-hp" role="progressbar" aria-label={`${name} HP`} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={clamped}>
          <i className={hpClass(clamped, safeMax)} style={style} />
        </div>
      </div>
    </div>
  );
}

// keyed by line so each one types from zero; a press or a tap completes the line, then moves on
function Message({ line, pending, preview }: { line: string; pending: boolean; preview?: string }) {
  const { count, done } = useTypedLine(line);
  return (
    <div className="pq-msg" data-testid="battle-message" onClick={pending ? battleAdvance : undefined}>
      <div>
        <Typed line={line} count={count} testId="battle-text" />
        {preview ? (
          <p className="pq-preview" id={PREVIEW_ID}>
            {preview}
          </p>
        ) : null}
      </div>
      {pending && done ? <span className="pq-arrow" aria-hidden="true" /> : null}
    </div>
  );
}

function Controls({ state, onFocus, hasPreview }: { state: BattleState; onFocus: (index: number) => void; hasPreview: boolean }) {
  const items: MenuItem[] = [
    { label: TRY_AGAIN, onSelect: battleRetry },
    {
      label: READ_RESUME,
      onSelect: () => {
        closeBattle();
        actions.openPanel('recruiter');
      },
    },
  ];

  if (state.phase === 'lost') return <Menu className="pq-end" label="Battle over" items={items} />;
  return (
    <>
      <MoveGrid species={state.player.species} onFocus={onFocus} describedBy={hasPreview ? PREVIEW_ID : undefined} />
      <button type="button" className="pq-run" onClick={() => battleAct({ type: 'run' })}>
        {RUN_LABEL}
      </button>
    </>
  );
}

export function Battle() {
  const state = useGame((s) => s.battle?.state);
  const lines = useGame((s) => s.battle?.lines);
  const index = useGame((s) => s.battle?.index ?? 0);
  const enemyOut = useGame((s) => s.battle?.enemyOut ?? false);
  const slotOut = useGame((s) => s.battle?.slotOut ?? 0);
  const mode = useGame((s) => s.mode);
  const [focused, setFocused] = useState(0);
  const onFocus = useCallback((at: number) => setFocused(at), []);
  const queued = lines ?? [];
  const pending = index < queued.length;

  // a held key repeats; only a fresh press moves the battle on
  useCaptureKeys((event) => {
    if (!pending || !ADVANCE.includes(event.key)) return false;
    if (!event.repeat) battleAdvance();
    return true;
  });

  if (!state) return null;
  const lost = !pending && state.phase === 'lost';
  const line = battleLine({ lines: queued, index, state });
  const messageIndex = Math.min(index, queued.length - 1);
  const enemy = state.party[slotOut];
  const enemyName = (enemy ? speciesOf(enemy.species)?.name : undefined) ?? FALLBACK_ENEMY;
  const playerName = speciesOf(state.player.species)?.name ?? FALLBACK_PLAYER;
  const focusedMove = moveSlots(state.player.species)[focused];
  const preview = !pending && state.phase === 'choose' && focusedMove?.factId ? factText(focusedMove.factId, mode) : undefined;
  const showControls = !pending && state.phase !== 'ran' && state.phase !== 'won';

  return (
    <section className="pq-battle" aria-label="Battle" data-testid="battle" data-phase={state.phase}>
      {enemyOut ? <InfoBox side="enemy" name={enemyName} max={enemy?.maxHp ?? 1} /> : null}
      <InfoBox side="player" name={playerName} max={state.player.maxHp} />
      <div className={`pq-msgbox${lost ? ' is-lost' : ''}`}>{line ? <Message key={`${messageIndex}:${line}`} line={line} pending={pending} preview={preview} /> : null}</div>
      <div className="pq-controls">{showControls ? <Controls state={state} onFocus={onFocus} hasPreview={preview !== undefined} /> : null}</div>
    </section>
  );
}
