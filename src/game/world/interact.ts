import { factId, flagId } from '../../content';
import type { Portrait } from '../../state/store';
import { store } from '../../state/store';
import type { WorldObject } from './objects';

const PORTRAITS: Portrait[] = ['devansh', 'mom', 'professor'];
const ITEM_LINES: Partial<Record<string, string>> = { shoes: 'You got the Running Shoes! Hold B to run.' };
const defaultSpeaker = (obj: WorldObject) => (obj.kind === 'npc' ? obj.name : 'Sign');

// check-content guarantees every interactive object carries a factId; a flag also hands over an item once
export function interactWith(obj: WorldObject) {
  const { actions, flags } = store.getState();
  if (!obj.props.factId) return;
  const speaker = obj.props.speaker ?? defaultSpeaker(obj);
  const portrait = PORTRAITS.find((p) => p === obj.props.portrait) ?? null;
  const flag = obj.props.flag === undefined ? undefined : flagId(obj.props.flag);
  const isNew = flag !== undefined && !flags.includes(flag);
  const itemLine = isNew ? ITEM_LINES[obj.props.flag ?? ''] : undefined;
  actions.openFact(factId(obj.props.factId), { speaker, portrait }, itemLine === undefined ? [] : [itemLine]);
  if (isNew) actions.addFlag(flag);
}
