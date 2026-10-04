import { describe, expect, it } from 'vitest';
import { TRACKS } from './manifest';
import { musicFor } from './music';

type Scene = Parameters<typeof musicFor>[0];
const scene = (patch: Partial<Scene>): Scene => ({ phase: 'play', battle: null, town: 'agra' as Scene['town'], place: null, ...patch });
const town = (name: string) => name as Scene['town'];
const fight = (request: unknown) => ({ request }) as Scene['battle'];

describe('musicFor', () => {
  it('plays the title tune until play starts', () => {
    expect(musicFor(scene({ phase: 'title' }))).toBe('title');
    expect(musicFor(scene({ phase: 'intro' }))).toBe('title');
  });
  it('gives each town its own track and the gyms theirs', () => {
    expect(musicFor(scene({ town: town('gear'), place: 'town' }))).toBe('gear');
    expect(musicFor(scene({ town: town('gear'), place: 'gym' }))).toBe('gym');
    expect(musicFor(scene({ town: town('testmu'), place: 'design-gym' }))).toBe('gym');
    expect(musicFor(scene({ town: town('testmu'), place: 'floor1' }))).toBe('testmu_tower');
    expect(musicFor(scene({ town: town('testmu'), place: 'town' }))).toBe('testmu');
  });
  it('plays elite on Victory Road and in the four rooms, the hall tune in the hall', () => {
    expect(musicFor(scene({ town: town('elite'), place: 'road' }))).toBe('elite');
    expect(musicFor(scene({ town: town('elite'), place: 'dsa' }))).toBe('elite');
    expect(musicFor(scene({ town: town('elite'), place: 'hall' }))).toBe('hall_of_fame');
  });
  it('picks the battle track by the opponent', () => {
    expect(musicFor(scene({ battle: fight({ kind: 'wild' }) }))).toBe('battle_wild');
    expect(musicFor(scene({ battle: fight({ kind: 'trainer', trainer: 'dsa' }) }))).toBe('battle_trainer');
    expect(musicFor(scene({ battle: fight({ kind: 'trainer', trainer: 'devansh' }) }))).toBe('battle_champion');
  });
  it('only names tracks the manifest has', () => {
    expect(TRACKS[musicFor(scene({ town: town('marrfa'), place: null }))].kind).toBe('music');
  });
});
