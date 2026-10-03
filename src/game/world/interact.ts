import { factId, flagId } from '../../content';
import type { FlagId } from '../../content';
import type { Portrait } from '../../state/store';
import { store } from '../../state/store';
import { flagList } from './conditions';
import { ITEM_LINES, LOCK_LINES, RECOVERY_LINE, ROLE_LINES } from './lines';
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

// check-content guarantees every interactive object carries a factId; a talk may also hand over a flag
export function interactWith(obj: WorldObject) {
  const { actions, flags } = store.getState();
  if (!obj.props.factId) return;
  const speaker = obj.props.speaker ?? defaultSpeaker(obj);
  const portrait = PORTRAITS.find((p) => p === obj.props.portrait) ?? null;
  const grant = pickGrant(obj.props, flags);
  const extra = grant?.line === undefined ? [] : [grant.line];
  actions.openFact(factId(obj.props.factId), { speaker, portrait }, extra, obj.props.guide === undefined ? undefined : 'ask');
  if (!grant) return;
  grant.replaces.forEach(actions.removeFlag);
  actions.addFlag(grant.flag);
}

// what a locked door says: the line for the first flag it needs, if the table has one
export const lockedLine = (props: Record<string, string | undefined>) => {
  const flag = flagList(props.needs)[0];
  return flag === undefined ? undefined : LOCK_LINES.get(flag);
};
