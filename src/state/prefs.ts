export type TextSpeed = 1 | 2 | 3 | 4;

const KEY = 'pq.prefs.v1';
const DEFAULT: TextSpeed = 2;

export const INSTANT: TextSpeed = 4;

export const SOUND_LABELS = { off: 'Off', on: 'On' } as const;

export const TEXT_SPEED_LABELS: Record<TextSpeed, string> = { 1: 'Slow', 2: 'Normal', 3: 'Fast', 4: 'Instant' };

interface Prefs {
  textSpeed?: unknown;
  wildBugs?: unknown;
  sound?: unknown;
}

function readPrefs(): Prefs {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return typeof value === 'object' && value !== null ? (value as Prefs) : {};
  } catch {
    return {};
  }
}

// each setting rewrites the whole object, so changing one keeps the others
function writePref(patch: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
}

export function readTextSpeed(): TextSpeed {
  const value = readPrefs().textSpeed;
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : DEFAULT;
}

export const writeTextSpeed = (textSpeed: TextSpeed) => writePref({ textSpeed });

// null means the visitor never chose: wild bugs then follow the mode (off for recruiters)
export function readWildBugs(): boolean | null {
  const value = readPrefs().wildBugs;
  return typeof value === 'boolean' ? value : null;
}

export const writeWildBugs = (wildBugs: boolean) => writePref({ wildBugs });

// off unless the visitor turned it on: nothing plays or loads before that choice
export const readSound = () => readPrefs().sound === true;

export const writeSound = (sound: boolean) => writePref({ sound });
