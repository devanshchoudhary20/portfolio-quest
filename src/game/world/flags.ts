import { flagId } from '../../content';

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
} as const;
