import { factId, flagId, trainerId } from '../../content';
import type { FlagId } from '../../content';
import type { Portrait } from '../../state/store';
import { store } from '../../state/store';
import { fetchTally } from '../../net/tally';
import { trainerOf } from '../battle/data';
import { BADGES_THREE, BADGES_THREE_COUNT, countBadges, flagList } from './conditions';
import { ITEM_LINES, abTally, LOCK_LINES, MART_WELCOME, RECOVERY_LINE, ROLE_LINES, victoryLocked } from './lines';
import type { WorldObject } from './objects';

const PORTRAITS: Portrait[] = ['devansh', 'mom', 'professor'];

const defaultSpeaker = (obj: WorldObject) => (obj.kind === 'npc' ? obj.name : 'Sign');

interface Grant {
  flag: FlagId;
  line: string | undefined;
  // flags of an exclusive cycle that this grant replaces
  replaces: FlagId[];
}

// what one talk hands over: a flag once, the next role of a cycle, or the missing piece of a set the player half holds
export function pickGrant(props: Record<string, string | undefined>, flags: readonly FlagId[]): Grant | null {
  const cycle = flagList(props.cycle);
  if (cycle.length > 0) {
    const held = cycle.findIndex((flag) => flags.includes(flag));
    const next = cycle[(held + 1) % cycle.length];
    return next ? { flag: next, line: ROLE_LINES.get(next), replaces: cycle.filter((flag) => flag !== next) } : null;
  }
  const fills = flagList(props.fills);
  const missing = fills.filter((flag) => !flags.includes(flag));
  if (fills.length > 0) return missing.length > 0 && missing.length < fills.length ? { flag: missing[0]!, line: RECOVERY_LINE, replaces: [] } : null;
  if (props.flag === undefined) return null;
  const flag = flagId(props.flag);
  return flags.includes(flag) ? null : { flag, line: ITEM_LINES.get(flag), replaces: [] };
}

let tallyInFlight = false;

// the live split arrives while the fact is being read; a failed or empty tally adds nothing, and a second talk during the fetch adds no second line
async function addTallyLine(speaker: string) {
  if (tallyInFlight) return;
  tallyInFlight = true;
  const tally = await fetchTally();
  tallyInFlight = false;
  if (tally && tally.a + tally.b > 0) store.getState().actions.appendDialogLine(speaker, abTally(tally.a, tally.b));
}

// check-content guarantees every interactive object carries a factId; a talk may also hand over a flag
export function interactWith(obj: WorldObject) {
  const { actions, flags } = store.getState();
  if (!obj.props.factId) return;
  const speaker = obj.props.speaker ?? defaultSpeaker(obj);
  const portrait = PORTRAITS.find((p) => p === obj.props.portrait) ?? null;
  const grant = pickGrant(obj.props, flags);
  const shop = obj.props.shop !== undefined;
  const extra = [...(shop ? [MART_WELCOME] : []), ...(grant?.line === undefined ? [] : [grant.line])];
  // a gym leader who has not been beaten says their fact, then the fight starts
  const trainer = obj.props.battle === undefined ? undefined : trainerOf(trainerId(obj.props.battle));
  const fights = trainer !== undefined && !flags.includes(trainer.award.flag);
  const contact = obj.props.contact !== undefined;
  const after = obj.props.guide !== undefined ? 'ask' : shop ? 'shop' : contact ? 'contact' : fights ? 'battle' : undefined;
  const request = fights ? ({ kind: 'trainer', trainer: trainer.id } as const) : undefined;
  actions.openFact(trainer?.factId ?? factId(obj.props.factId), { speaker, portrait }, extra, after, request);
  if (obj.props.tally !== undefined) void addTallyLine(speaker);
  if (!grant) return;
  grant.replaces.forEach(actions.removeFlag);
  actions.addFlag(grant.flag);
}

// what a locked door says: the line for the first flag it needs, if the table has one; Victory Road also counts the badges held
export const lockedLine = (props: Record<string, string | undefined>, flags: readonly FlagId[]) => {
  const flag = flagList(props.needs)[0];
  if (flag === BADGES_THREE) return victoryLocked(countBadges(flags), BADGES_THREE_COUNT);
  return flag === undefined ? undefined : LOCK_LINES.get(flag);
};
