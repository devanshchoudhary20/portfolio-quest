export type TextSpeed = 1 | 2 | 3 | 4;

const KEY = 'pq.prefs.v1';
const DEFAULT: TextSpeed = 2;

export const INSTANT: TextSpeed = 4;

export const TEXT_SPEED_LABELS: Record<TextSpeed, string> = { 1: 'Slow', 2: 'Normal', 3: 'Fast', 4: 'Instant' };

export function readTextSpeed(): TextSpeed {
  try {
    const value = (JSON.parse(localStorage.getItem(KEY) ?? 'null') as { textSpeed?: unknown } | null)?.textSpeed;
    return value === 1 || value === 2 || value === 3 || value === 4 ? value : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function writeTextSpeed(textSpeed: TextSpeed) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ textSpeed }));
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
}
