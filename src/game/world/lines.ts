import { moveId, skillGroups } from '../../content';
import type { FlagId, MoveId } from '../../content';
import { FLAGS, badgeFlag } from './flags';
import { townName } from './towns';

// the only player-facing text that is not a fact: pickups, roles, locks, robot replies and HUD labels all live here

// said once, after the fact line, when a talk or pickup hands over this flag
export const ITEM_LINES: ReadonlyMap<FlagId, string> = new Map([
  [FLAGS.shoes, 'You got the Running Shoes! Hold B to run.'],
  [FLAGS.keyFirst, 'You got the first key! The 2FA gate needs two.'],
  [FLAGS.keySecond, 'You got the second key! Both keys fit the 2FA gate.'],
  [FLAGS.loopBreak, 'You pulled the lever. The loop breaks.'],
  [FLAGS.cursor, 'You got a cursor! Face a floor tile and press A to plant your flag.'],
  ...skillGroups.map((group): [FlagId, string] => [badgeFlag(group.id), `You earned the ${group.gymBadge}!`]),
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

export const badgesLabel = (held: number, total: number) => `Badges ${held} / ${total}`;
export const wildBugsLabel = (on: boolean) => `Wild bugs: ${on ? 'On' : 'Off'}`;

// battle lines: names are game data, every other sentence is here or a resume fact
export const wildAppeared = (name: string) => `A wild ${name} appeared!`;
export const trainerWants = (name: string) => `${name} wants to battle!`;
export const trainerSends = (trainer: string, name: string) => `${trainer} sent out ${name}!`;
export const goLine = (name: string) => `Go! ${name}!`;
export const usedMove = (user: string, move: string) => `${user} used ${move}!`;
export const askMove = (name: string) => `What will ${name} do?`;
export const fainted = (name: string) => `${name} fainted!`;
export const caughtLine = (name: string) => `${name} was added to the Bugdex.`;
export const SUPER_EFFECTIVE = "It's super effective!";
export const NOT_EFFECTIVE = "It's not very effective.";
export const TURN_CAP_LINE = 'That is four turns. The fight is over.';
export const RAN_LINE = 'Got away safely.';
export const LOST_LINE = 'No harm done. Try again, or read the resume.';
export const BATTLE_FROZE = 'The battle froze. You got away safely.';
export const LOADING_BATTLE = 'Loading battle';
export const MOVE_EMPTY = '--';
export const TRY_AGAIN = 'Try again';
export const READ_RESUME = 'Read the resume';
export const RUN_LABEL = 'Run';
export const typeLabel = (type: string) => `${type.charAt(0).toUpperCase()}${type.slice(1)} type`;

// what a bug's own move says; a player move prints its resume fact instead
export const FLAVOR_LINES: ReadonlyMap<MoveId, string> = new Map(
  Object.entries({
    dereference: 'It reached for something that is not there.',
    'undefined-is-not': 'It called a function that is not a function.',
    'preflight-block': 'The request never left the browser.',
    'missing-header': 'A header went missing on the way.',
    mismatch: 'The server and the client disagree.',
    'flash-of-wrong': 'The wrong screen flashed for one frame.',
    'data-race': 'Two writers reached the same row at once.',
    'stale-read': 'It read a value that had already changed.',
    'slow-drip': 'Memory kept climbing, a little each tick.',
    'out-of-memory': 'The tab ran out of room.',
    fencepost: 'The loop ran one step too far.',
    'loop-once-more': 'It went around one more time.',
    'silent-drop': 'A field vanished and nothing complained.',
    vanish: 'The save said ok, and the row was gone.',
  }).map(([id, line]): [MoveId, string] => [moveId(id), line]),
);

// the starter pick: one line per partner, the confirm prompt, and the recruiter shortcut
export const STARTER_LINES: Readonly<Record<string, string>> = {
  react: 'React. Where the work lives: components and state.',
  node: 'Node.js. Backend, working knowledge.',
  claude: 'Claude Code. Writes next to me.',
};
export const chooseStarter = (name: string) => `Choose ${name}?`;
export const starterJoined = (name: string) => `${name} joined your team.`;
export const RECRUITER_STARTER = 'Recruiter Mode starts you with React, so there is nothing to pick.';
export const STARTER_PICK = 'Three partners are waiting on the table. Pick one.';
export const YES = 'Yes';
export const NO = 'No';
