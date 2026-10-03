import type { FlagId } from '../../content';
import { FLAGS } from './flags';
import { townName } from './towns';

// the only player-facing text that is not a fact: pickups, roles, locks, robot replies and HUD labels all live here

// said once, after the fact line, when a talk or pickup hands over this flag
export const ITEM_LINES: ReadonlyMap<FlagId, string> = new Map([
  [FLAGS.shoes, 'You got the Running Shoes! Hold B to run.'],
  [FLAGS.keyFirst, 'You got the first key! The 2FA gate needs two.'],
  [FLAGS.keySecond, 'You got the second key! Both keys fit the 2FA gate.'],
  [FLAGS.loopBreak, 'You pulled the lever. The loop breaks.'],
  [FLAGS.cursor, 'You got a cursor! Face a floor tile and press A to plant your flag.'],
]);

// the role a cycling NPC just handed out
export const ROLE_LINES: ReadonlyMap<FlagId, string> = new Map([
  [FLAGS.roleOwner, 'Your role is now Owner.'],
  [FLAGS.roleAgent, 'Your role is now Agent.'],
  [FLAGS.roleTenant, 'Your role is now Tenant.'],
]);

// what a locked door says, keyed by the flag it needs
export const LOCK_LINES: ReadonlyMap<FlagId, string> = new Map([
  [FLAGS.roleOwner, 'This door needs the Owner role.'],
  [FLAGS.roleAgent, 'This door needs the Agent role.'],
  [FLAGS.roleTenant, 'This door needs the Tenant role.'],
]);

export const RECOVERY_LINE = 'Got a recovery code! The gate accepts it as your second key.';
export const PLANTED_LINE = 'Flag planted. The cursor will find it after every rewrite.';
export const NOT_FOUND = "I couldn't find that. Try: Core gym, Junglee, the basement.";
export const ROBOT_LOCKED = 'That road is locked. Find the way to open it first.';
export const ROBOT_LOST = "I couldn't get there from here.";
export const SAVED = 'Progress saved.';
export const SAVE_FAILED = 'Could not save in this browser. Progress will not carry over.';

export const survivedLine = (rewrites: number) =>
  rewrites === 0 ? 'Your flag is here. Wait for a rewrite.' : `The cursor survived ${rewrites} ${rewrites === 1 ? 'rewrite' : 'rewrites'}.`;

export const loopLabel = (laps: number) => `Loop ${laps}`;

export const notOpenYet = (town: string) => `${townName(town) ?? 'That town'} is not open yet.`;
