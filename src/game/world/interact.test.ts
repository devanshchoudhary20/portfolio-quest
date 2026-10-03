import { describe, expect, it } from 'vitest';
import { flagId } from '../../content';
import { lockedLine, pickGrant } from './interact';

const flags = (...names: string[]) => names.map(flagId);
const ROLES = { cycle: 'role.owner,role.agent,role.tenant' };
const KEYS = { fills: 'key.2fa.1,key.2fa.2' };

describe('pickGrant', () => {
  it('cycles Owner, Agent, Tenant and wraps, replacing the others', () => {
    expect(pickGrant(ROLES, [])).toMatchObject({ flag: 'role.owner', line: 'Your role is now Owner.', replaces: ['role.agent', 'role.tenant'] });
    expect(pickGrant(ROLES, flags('role.owner'))).toMatchObject({ flag: 'role.agent', replaces: ['role.owner', 'role.tenant'] });
    expect(pickGrant(ROLES, flags('role.agent'))?.flag).toBe('role.tenant');
    expect(pickGrant(ROLES, flags('role.tenant'))?.flag).toBe('role.owner');
  });

  it('hands over the missing key only to someone holding exactly one', () => {
    expect(pickGrant(KEYS, [])).toBeNull();
    expect(pickGrant(KEYS, flags('key.2fa.2'))).toMatchObject({ flag: 'key.2fa.1', line: 'Got a recovery code! The gate accepts it as your second key.' });
    expect(pickGrant(KEYS, flags('key.2fa.1', 'key.2fa.2'))).toBeNull();
  });

  it('gives a plain flag once', () => {
    expect(pickGrant({ flag: 'shoes' }, [])).toMatchObject({ flag: 'shoes', line: 'You got the Running Shoes! Hold B to run.' });
    expect(pickGrant({ flag: 'shoes' }, flags('shoes'))).toBeNull();
    expect(pickGrant({}, [])).toBeNull();
  });
});

describe('lockedLine', () => {
  it('names the role a door needs and stays silent for other warps', () => {
    expect(lockedLine({ needs: 'role.agent' })).toBe('This door needs the Agent role.');
    expect(lockedLine({ unless: 'loop.break' })).toBeUndefined();
    expect(lockedLine({ needs: 'seen.10' })).toBeUndefined();
  });
});
