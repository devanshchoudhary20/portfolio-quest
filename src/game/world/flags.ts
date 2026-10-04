import { flagId } from '../../content';
import type { SkillGroupId, TrainerId } from '../../content';

// every flag the code itself reads or writes; maps name flags as plain strings and check-content ties each one to a line
export const FLAGS = {
  shoes: flagId('shoes'),
  keyFirst: flagId('key.2fa.1'),
  keySecond: flagId('key.2fa.2'),
  roleOwner: flagId('role.owner'),
  roleAgent: flagId('role.agent'),
  roleTenant: flagId('role.tenant'),
  loopBreak: flagId('loop.break'),
  cursor: flagId('cursor'),
  seenTen: flagId('seen.10'),
  badgesThree: flagId('badges.3'),
  resume: flagId('resume'),
} as const;

// a gym leader beaten in battle hands over this flag; the group id is the skill group the gym reads
export const badgeFlag = (group: SkillGroupId) => flagId(`badge.${group}`);

// an Elite Four member or the Champion beaten in battle; they award no badge
export const beatenFlag = (trainer: TrainerId) => flagId(`beaten.${trainer}`);
