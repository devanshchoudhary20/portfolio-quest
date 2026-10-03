import { DESTINATIONS } from './destinations';
import type { Destination } from './destinations';

const FILLER = new Set(['take', 'me', 'to', 'go', 'the', 'a', 'an', 'please', 'pls', 'where', 'is', 'walk', 'show', 'find', 'i', 'want', 'need', 'bring', 'us', 'can', 'you', 'lets', 'let', 's', 'head', 'navigate', 'visit', 'at']);
const NUMBER_WORDS: Record<string, string> = { one: '1', first: '1', '1st': '1', two: '2', second: '2', '2nd': '2', three: '3', third: '3', '3rd': '3', four: '4', fourth: '4', '4th': '4' };

const tokens = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => NUMBER_WORDS[word] ?? word)
    .filter((word) => !FILLER.has(word));

// short words must be exact ("near" is not "gear"), one typo is forgiven in a mid-length word, two in a long one
const allowed = (word: string) => (word.length <= 5 ? 0 : word.length <= 8 ? 1 : 2);

// edit distance where swapping two neighbors costs one
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) best = Math.min(best, rows[i - 2]![j - 2]! + 1);
      rows[i]![j] = best;
    }
  }
  return rows[a.length]![b.length]!;
}

interface Match {
  score: number;
  exact: number;
}

// how well the alias words sit in the query: letters matched minus typos, then how many words matched exactly; null when any word is too far off
function score(alias: string[], query: string[]): Match | null {
  let best: Match | null = null;
  for (let start = 0; start + alias.length <= query.length; start++) {
    const here: Match = { score: 0, exact: 0 };
    const fits = alias.every((word, i) => {
      const dist = distance(word, query[start + i]!);
      here.score += word.length - dist;
      if (dist === 0) here.exact += 1;
      return dist <= allowed(word);
    });
    if (fits && (best === null || here.score > best.score || (here.score === best.score && here.exact > best.exact))) best = here;
  }
  return best;
}

// rule-based and offline: the best alias in the text decides, a longer alias beats a shorter one ("junglee gym" over "junglee")
export function parseDestination(text: string): Destination | null {
  const query = tokens(text);
  if (query.length === 0) return null;
  let winner: Destination | null = null;
  let best: Match = { score: 0, exact: 0 };
  for (const destination of DESTINATIONS) {
    for (const alias of destination.aliases) {
      const match = score(tokens(alias), query);
      if (match && (match.score > best.score || (match.score === best.score && match.exact > best.exact))) {
        winner = destination;
        best = match;
      }
    }
  }
  return winner;
}
