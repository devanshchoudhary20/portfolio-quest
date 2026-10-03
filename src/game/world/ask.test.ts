import { describe, expect, it } from 'vitest';
import { destId } from '../../content';
import { parseDestination } from './ask';
import { NOT_FOUND } from './lines';
import { DESTINATIONS, destinationById } from './destinations';

const where = (text: string) => parseDestination(text)?.id;

describe('parseDestination', () => {
  const cases: [string, string][] = [
    ['core gym', 'gym-core'],
    ['CORE GYM', 'gym-core'],
    ['  Core   Gym!!  ', 'gym-core'],
    ['take me to junglee', 'town-junglee'],
    ['Take me to Junglee Jungle, please', 'town-junglee'],
    ['juglee', 'town-junglee'],
    ['the basement', 'tower-basement'],
    ['basment', 'tower-basement'],
    ['where are the ghost bugs?', 'tower-basement'],
    ['where is the librarian', 'npc-librarian'],
    ['libarian', 'npc-librarian'],
    ['junglee gym', 'gym-monorepo'],
    ['marfa', 'town-marrfa'],
    ['Marrfa Estates', 'town-marrfa'],
    ['design system gym', 'gym-design'],
    ['cross-stack', 'gym-cross'],
    ['go to the 3rd floor', 'floor-3'],
    ['floor two', 'floor-2'],
    ['fourth floor', 'floor-4'],
    ['import dock', 'floor-4'],
    ['the maze', 'floor-1'],
    ['patch center', 'patch-center'],
    ['PATCH CENTRE please', 'patch-center'],
    ['test mu', 'town-testmu'],
    ['home', 'town-agra'],
    ['mom', 'npc-mom'],
    ['backend gym', 'gym-backend'],
    ['the gear gym', 'gym-core'],
    ['core gmy', 'gym-core'],
    ['gear city', 'town-gear'],
    ['look for mom', 'npc-mom'],
    ['take me to the librarian please', 'npc-librarian'],
  ];

  it.each(cases)('reads "%s" as %s', (text, id) => {
    expect(where(text)).toBe(id);
  });

  it.each(['', '   ', '???', 'pizza', 'take me to the moon', 'asdfgh qwerty', 'i have a question', 'is it safe', 'near', 'what year', 'hope', 'some help', 'watch', 'lock', 'can you help me', 'what is this', 'hello there'])('finds nothing in "%s"', (text) => {
    expect(parseDestination(text)).toBeNull();
  });

  it('has a hint line that names three real destinations', () => {
    expect(NOT_FOUND).toBe("I couldn't find that. Try: Core gym, Junglee, the basement.");
    for (const phrase of ['core gym', 'junglee', 'the basement']) expect(parseDestination(phrase)).not.toBeNull();
  });
});

describe('DESTINATIONS', () => {
  it('has unique ids that resolve back to themselves', () => {
    expect(new Set(DESTINATIONS.map((d) => d.id)).size).toBe(DESTINATIONS.length);
    for (const d of DESTINATIONS) expect(destinationById(d.id)).toBe(d);
    expect(destinationById(destId('nowhere'))).toBeUndefined();
  });

  it('reads every alias back as its own destination', () => {
    for (const d of DESTINATIONS) {
      for (const alias of d.aliases) expect(where(alias), `alias "${alias}" of ${d.id}`).toBe(d.id);
    }
  });
});
