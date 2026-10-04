import { useState } from 'react';
import { facts, skillGroups } from '../content';
import { badgeFlag } from '../game/world/flags';
import { BADGE_HELD, BADGE_MISSING, SKILLDEX_TITLE, UNSEEN, factsSeenLabel, findIn, gymHint, listedUnder } from '../game/world/lines';
import { placeName } from '../game/world/towns';
import { DexFrame } from './DexFrame';
import { useGame } from './useGame';
import { backToMenu } from './usePanel';

const tabs = skillGroups.map((group) => ({ key: group.id, label: group.label }));

// every skill group of the resume with its items, its gym and the badge; the facts tagged to the group show once seen
export function Skilldex() {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const seen = useGame((s) => s.seen);
  const flags = useGame((s) => s.flags);
  // check-content fails an empty skillGroups, and the tab only moves inside it
  const group = skillGroups[tab]!;
  const item = group.items[index] ?? group.items[0] ?? group.label;
  const place = placeName(group.town);
  const held = flags.includes(badgeFlag(group.id));
  const rows = group.items.map((name) => ({ key: name, label: name, muted: false }));
  const groupFacts = facts.filter((fact) => fact.tags?.includes(group.id));
  const factLines = groupFacts.map((fact) => ({
    key: fact.id,
    text: seen.includes(fact.id) ? fact.short : `${UNSEEN} ${findIn(placeName(fact.town))}`,
  }));
  const factItems = factLines.map((line) => <li key={line.key}>{line.text}</li>);
  const badgeLine = held ? null : <p className="pq-muted">{gymHint(group.label, place)}</p>;
  const detail = (
    <>
      <h3>{item}</h3>
      <span className="pq-chip" data-group={group.id}>
        {group.label}
      </span>
      <p className="pq-muted">{listedUnder(group.label)}</p>
      <p data-testid="badge-status">{`${group.gymBadge}: ${held ? BADGE_HELD : BADGE_MISSING}`}</p>
      {badgeLine}
      <ul>{factItems}</ul>
    </>
  );

  const switchTab = (next: number) => {
    setTab(next);
    setIndex(0);
  };

  return (
    <DexFrame
      title={SKILLDEX_TITLE}
      count={factsSeenLabel(seen.length, facts.length)}
      tabs={tabs}
      tab={tab}
      onTab={switchTab}
      rows={rows}
      index={index}
      onIndex={setIndex}
      detail={detail}
      onClose={backToMenu}
    />
  );
}
