import { education, factById, factId, jobs, profile, skillGroups } from '../content';
import { badgeFlag } from '../game/world/flags';
import { countBadges } from '../game/world/conditions';
import { ALL_GYMS, BADGE_MISSING, CARD_LABELS, CARD_TITLE, MONEY_AMOUNT, TRAINER_ID, badgesLabel, gymHint, timeLabel } from '../game/world/lines';
import { placeName } from '../game/world/towns';
import { educationLine } from '../resume/view';
import { PanelShell } from './PanelShell';
import { PHOTO_URL } from './portraits';
import { useGame } from './useGame';
import { backToMenu } from './usePanel';

const MONEY_FACT = factId('gear.leetcode');
const [current] = jobs;

// name, class, the resume rows, play time and the five badge slots; the money row carries the LeetCode fact
export function TrainerCard() {
  const flags = useGame((s) => s.flags);
  const playSeconds = useGame((s) => s.playSeconds);
  const held = countBadges(flags);
  const complete = held >= skillGroups.length;
  const moneyFact = factById.get(MONEY_FACT)?.short;
  const money = moneyFact ? `${MONEY_AMOUNT} (${moneyFact.replace(/\.$/, '')})` : MONEY_AMOUNT;
  const rows = [
    { key: 'id', label: CARD_LABELS.id, value: TRAINER_ID },
    { key: 'money', label: CARD_LABELS.money, value: money },
    { key: 'education', label: CARD_LABELS.education, value: `${education.degree}, ${educationLine}` },
    { key: 'now', label: CARD_LABELS.now, value: current ? `${current.role} at ${current.company}` : profile.title },
  ];
  const rowItems = rows.map((row) => (
    <div key={row.key} className="pq-card-row">
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    </div>
  ));
  const slots = skillGroups.map((group) => {
    const earned = flags.includes(badgeFlag(group.id));
    const status = earned ? group.gymBadge : `${BADGE_MISSING}. ${gymHint(group.label, placeName(group.town))}`;
    return (
      <li key={group.id} data-earned={earned} data-group={group.id}>
        <span className="pq-badge-icon" aria-hidden="true" />
        <span>{group.label}</span>
        <span className="pq-sr">{status}</span>
      </li>
    );
  });
  const shellClass = complete ? 'pq-card is-gold' : 'pq-card';
  const allGyms = complete ? <p>{ALL_GYMS}</p> : null;

  return (
    <PanelShell title={CARD_TITLE} className={shellClass} onClose={backToMenu}>
      <div className="pq-card-top">
        <img className="pq-photo" src={PHOTO_URL} alt="" width={48} height={64} />
        <div>
          <h3>{profile.name}</h3>
          <p className="pq-muted">{profile.title}</p>
          <dl>{rowItems}</dl>
          <p data-testid="card-time">{timeLabel(playSeconds)}</p>
        </div>
      </div>
      <h3 data-testid="card-badges">{badgesLabel(held, skillGroups.length)}</h3>
      <ul className="pq-badges">{slots}</ul>
      {allGyms}
    </PanelShell>
  );
}
