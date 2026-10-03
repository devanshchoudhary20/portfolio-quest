import { flagId } from '../../content';
import type { FlagId } from '../../content';
import { FLAGS } from './flags';

// derived by the store once the visitor has seen 10 facts
export const SEEN_TEN = FLAGS.seenTen;
export const SEEN_TEN_COUNT = 10;

// a map property holds a comma list of flags: needs="key.2fa.1,key.2fa.2"
export const flagList = (csv: string | undefined): FlagId[] =>
  (csv ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(flagId);

// open while every needs flag is held and no unless flag is
export const isOpen = (props: { needs?: string; unless?: string }, flags: readonly string[]) =>
  flagList(props.needs).every((flag) => flags.includes(flag)) && !flagList(props.unless).some((flag) => flags.includes(flag));
