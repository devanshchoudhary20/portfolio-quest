import { flagId, isFactId, isMapTownId } from '../../content';
import type { FactId, FlagId, TownId } from '../../content';

const DIRS = ['up', 'down', 'left', 'right'] as const;
const MODES = ['recruiter', 'engineer', 'curious'] as const;
const STARTERS = ['react', 'node', 'claude'] as const;

export type Dir = (typeof DIRS)[number];
export type Mode = (typeof MODES)[number];
export type Starter = (typeof STARTERS)[number];

export interface SaveV1 {
  v: 1;
  town: TownId;
  pos: { x: number; y: number };
  facing: Dir;
  flags: FlagId[];
  seen: FactId[];
  starter?: Starter;
  mode: Mode;
  // null when the stored timestamp is unreadable: the UI shows "Last played: unknown"
  savedAt: string | null;
}

const oneOf =
  <T extends readonly string[]>(list: T) =>
  (value: unknown): value is T[number] =>
    typeof value === 'string' && list.includes(value);

const isDir = oneOf(DIRS);
const isMode = oneOf(MODES);
const isStarter = oneOf(STARTERS);

type Migration = (save: Record<string, unknown>) => Record<string, unknown>;
// migrations[n] upgrades a version n save to n + 1; empty until v2 exists
const migrations: Record<number, Migration> = {};
const CURRENT = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCoord = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

const strings = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;

function parseV1(raw: Record<string, unknown>): SaveV1 | null {
  const { town, pos, facing, flags, seen, starter, mode, savedAt } = raw;
  const flagList = strings(flags);
  const seenList = strings(seen);
  if (!isMapTownId(town) || !isRecord(pos) || !isCoord(pos.x) || !isCoord(pos.y)) return null;
  if (!isDir(facing) || !isMode(mode) || !flagList || !seenList) return null;
  if (starter !== undefined && !isStarter(starter)) return null;

  return {
    v: 1,
    town,
    pos: { x: pos.x, y: pos.y },
    facing,
    flags: flagList.map(flagId),
    // facts removed from the resume since the save was written are dropped
    seen: seenList.filter(isFactId),
    ...(starter !== undefined ? { starter } : {}),
    mode,
    savedAt: typeof savedAt === 'string' && !Number.isNaN(Date.parse(savedAt)) ? savedAt : null,
  };
}

export function loadSave(raw: unknown): SaveV1 | null {
  if (!isRecord(raw)) return null;
  let current: Record<string, unknown> = raw;
  while (typeof current.v === 'number' && current.v < CURRENT) {
    const step = migrations[current.v];
    if (!step) return null;
    current = { ...step(current), v: current.v + 1 };
  }
  return current.v === CURRENT ? parseV1(current) : null;
}

export const SAVE_KEY = 'pq.save.v1';

export type StoredSave = { status: 'none' } | { status: 'ok'; save: SaveV1 } | { status: 'corrupt' };

export function readStoredSave(): StoredSave {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return { status: 'none' };
  }
  if (raw === null) return { status: 'none' };
  try {
    const save = loadSave(JSON.parse(raw));
    return save ? { status: 'ok', save } : { status: 'corrupt' };
  } catch {
    return { status: 'corrupt' };
  }
}

export function writeSave(save: SaveV1): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage blocked: nothing to clear
  }
}

export function lastPlayedLabel(savedAt: string | null): string {
  const time = savedAt === null ? Number.NaN : Date.parse(savedAt);
  if (Number.isNaN(time)) return 'Last played: unknown';
  return `Last played: ${new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function canStore(): boolean {
  try {
    localStorage.setItem('pq.probe', '1');
    localStorage.removeItem('pq.probe');
    return true;
  } catch {
    return false;
  }
}
