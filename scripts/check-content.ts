import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { education, facts, isFactId, isMapTownId, isTownId, jobs, profile, project, skillGroups, summaryFactId } from '../src/content';
import { NPC_SPRITES } from '../src/game/world/npcSprites';
import { DEFAULT_SPAWN } from '../src/game/world/towns';
import { isWarp, key, neighbors, readMap, reachableTiles } from './tiledMap';
import type { MapObject, TownMap } from './tiledMap';

const ROOT = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);

// optional value after a flag: undefined when the flag is absent, '' when it has no value
function flagValue(flag: string) {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  const next = args[i + 1];
  return next && !next.startsWith('--') ? next : '';
}

const distValue = flagValue('--dist');
const distMode = distValue !== undefined;
const distDir = resolve(ROOT, distValue || 'dist');
const mapsValue = flagValue('--maps');
const mapsDir = resolve(ROOT, mapsValue ?? 'public/maps');

// up to 3 non-digits between digits catches "93 68 - 321-127" style formatting
const PHONE = new RegExp(['9', '3', '6', '8', '3', '2', '1', '1', '2', '7'].join('\\D{0,3}'));
const BANNED = /nintendo|pokemon|pikachu|game[\s_-]?freak/i;
const OBJECT_LAYERS = new Set(['npcs', 'signs', 'items', 'warps', 'encounters']);
const FACT_LAYERS = new Set(['npcs', 'signs', 'items']);
const FACT_KINDS = new Set(['npc', 'sign', 'item']);
// maps hold no free text: any property key outside its kind's list is an error
const KEYS_BY_KIND: Record<string, string[]> = {
  npc: ['kind', 'factId', 'sprite', 'face', 'speaker', 'portrait', 'flag'],
  sign: ['kind', 'factId', 'speaker'],
  item: ['kind', 'factId', 'speaker', 'portrait'],
  warp: ['kind', 'to', 'spawn'],
  door: ['kind', 'face'],
  spawn: ['kind', 'face'],
  grass: ['kind', 'pool'],
};
// the Bedroom is where a new game starts, and no door leads back into it from the street
const EXTRA_START: Record<string, string> = { agra: 'bedroom' };
const TEXT_EXTS = ['.ts', '.tsx', '.js', '.css', '.json', '.html', '.svg', '.txt', '.xml', '.webmanifest', '.md'];

const errors: string[] = [];
const warnings: string[] = [];
const rel = (path: string) => relative(ROOT, path);

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path, exts);
    return exts.includes(extname(path)) ? [path] : [];
  });
}

function scanText(files: string[]) {
  for (const file of files) {
    const text = readFileSync(file, 'utf8').normalize('NFC');
    const unaccented = text.normalize('NFD').replace(/\p{M}/gu, '');
    if (PHONE.test(text)) errors.push(`phone number pattern in ${rel(file)}`);
    const banned = text.match(BANNED) ?? unaccented.match(BANNED);
    if (banned) errors.push(`banned word "${banned[0]}" in ${rel(file)}`);
  }
}

function loadMaps(dir: string) {
  const maps = new Map<string, TownMap>();
  for (const file of walk(dir, ['.json'])) {
    try {
      maps.set(basename(file, '.json'), readMap(file));
    } catch {
      errors.push(`${rel(file)} is not valid JSON`);
    }
  }
  return maps;
}

const blank = (value: string) => value.trim() === '';

function checkContent() {
  const seenIds = new Set<string>();
  for (const fact of facts) {
    if (seenIds.has(fact.id)) errors.push(`duplicate fact id ${fact.id}`);
    seenIds.add(fact.id);
    if (!isTownId(fact.town)) errors.push(`fact ${fact.id} has unknown town ${fact.town}`);
    if (blank(fact.short) || (fact.long !== undefined && blank(fact.long))) errors.push(`fact ${fact.id} has empty text`);
  }
  const groupIds = new Set<string>(skillGroups.map((g) => g.id));
  for (const fact of facts) {
    for (const tag of fact.tags ?? []) if (!groupIds.has(tag)) errors.push(`fact ${fact.id} has unknown skill group ${tag}`);
  }
  if (!isFactId(summaryFactId)) errors.push(`summaryFactId ${summaryFactId} is not a known factId`);
  if (!isFactId(project.id)) errors.push(`project ${project.name} has unknown factId ${project.id}`);

  // the resume renders these without fallbacks, so empty values must fail here
  const required: [string, string][] = [
    ...Object.entries(profile).map(([k, v]): [string, string] => [`profile.${k}`, v]),
    ...Object.entries(education).map(([k, v]): [string, string] => [`education.${k}`, v]),
    ...Object.entries({ name: project.name, role: project.role, url: project.url }).map(([k, v]): [string, string] => [`project.${k}`, v]),
    ...project.stack.map((item, i): [string, string] => [`project.stack[${i}]`, item]),
    ...skillGroups.flatMap((g): [string, string][] => [[`skill ${g.id} label`, g.label], [`skill ${g.id} gymBadge`, g.gymBadge], ...g.items.map((item, i): [string, string] => [`skill ${g.id} item ${i}`, item])]),
  ];
  for (const job of jobs) {
    if (!isMapTownId(job.id)) errors.push(`job ${job.id} is not a town with a map`);
    for (const id of job.facts) if (!isFactId(id)) errors.push(`job ${job.id} lists unknown factId ${id}`);
    for (const key of ['company', 'role', 'start', 'end', 'location'] as const) required.push([`job ${job.id} ${key}`, job[key]]);
  }
  for (const [label, value] of required) if (blank(value)) errors.push(`${label} is empty`);
  for (const group of skillGroups) if (!isMapTownId(group.town)) errors.push(`skill ${group.id} is set in ${group.town}, which is not a town with a map`);
  if (skillGroups.length === 0) errors.push('skillGroups is empty');
}

// returns the npc, sign and item objects the player can stand next to
function checkReach(map: TownMap) {
  const town = map.name;
  const talkable = new Set<MapObject>();
  if (!map.hasGround) {
    errors.push(`${town}: map has no ground layer`);
    return talkable;
  }
  const starts = [DEFAULT_SPAWN, EXTRA_START[town]].flatMap((name) => (name === undefined ? [] : [name]));
  const spawnObjects = map.objects.filter((o) => o.layer === 'warps' && !isWarp(o));
  for (const o of spawnObjects) {
    if (!map.walkable(o.tile)) errors.push(`${town}/warps/${o.name || '?'}: spawn sits on a blocked tile ${key(o.tile)}`);
  }
  const startTiles: MapObject[] = [];
  for (const name of starts) {
    const found = spawnObjects.find((o) => o.name === name);
    if (found) startTiles.push(found);
    else if (name === DEFAULT_SPAWN) errors.push(`${town}: no "${DEFAULT_SPAWN}" spawn`);
    else errors.push(`${town}: no "${name}" spawn`);
  }
  const reached = reachableTiles(map, startTiles.map((o) => o.tile).filter((t) => map.walkable(t)));
  const warpTiles = new Set(map.objects.filter(isWarp).map((o) => key(o.tile)));
  for (const obj of map.objects) {
    const where = `${town}/${obj.layer}/${obj.name || '?'}`;
    if (FACT_LAYERS.has(obj.layer)) {
      if (neighbors(obj.tile).some((n) => reached.has(key(n)) && !warpTiles.has(key(n)))) talkable.add(obj);
      else errors.push(`${where}: unreachable, no open tile beside ${key(obj.tile)} that the player can walk to`);
    } else if (isWarp(obj) && !reached.has(key(obj.tile))) {
      errors.push(`${where}: warp tile ${key(obj.tile)} is never reached`);
    }
  }
  return talkable;
}

function checkMaps() {
  if (mapsValue === '') {
    errors.push('--maps requires a directory');
    return;
  }
  const maps = loadMaps(mapsDir);
  const covered = new Set<string>();
  const spawns = new Map<string, Set<string>>();
  const before = errors.length;
  const talkable = new Set<MapObject>();

  for (const [town, map] of maps) {
    for (const layer of map.objectLayers) {
      if (!OBJECT_LAYERS.has(layer)) errors.push(`${town}: unknown object layer "${layer}"`);
    }
    const names = map.objects.filter((o) => OBJECT_LAYERS.has(o.layer)).map((o) => o.name).filter(Boolean);
    spawns.set(town, new Set(names));
    for (const obj of checkReach(map)) talkable.add(obj);
  }
  const reachErrors = errors.length - before;

  for (const [town, map] of maps) {
    for (const obj of map.objects.filter((o) => OBJECT_LAYERS.has(o.layer))) {
      const where = `${town}/${obj.layer}/${obj.name || '?'}`;
      const p = obj.props;
      const kind = p.kind ?? '';
      const allowed = KEYS_BY_KIND[kind];
      if (!allowed) errors.push(`${where}: missing or unknown kind "${kind}"`);
      for (const prop of Object.keys(p)) {
        if (allowed && !allowed.includes(prop)) errors.push(`${where}: property "${prop}" is not allowed on a ${kind}, maps hold no free text, use a factId`);
      }
      if (FACT_KINDS.has(kind) || FACT_LAYERS.has(obj.layer)) {
        if (!p.factId) errors.push(`${where}: missing factId`);
      }
      if (p.factId && !isFactId(p.factId)) errors.push(`${where}: unknown factId ${p.factId}`);
      // only facts a player can reach count as shown; encounter pools join once encounters ship
      if (p.factId && talkable.has(obj) && isFactId(p.factId)) covered.add(p.factId);
      for (const id of p.pool ? p.pool.split(',').map((s) => s.trim()).filter(Boolean) : []) {
        if (!isFactId(id)) errors.push(`${where}: unknown factId ${id} in pool`);
      }
      if (kind === 'npc' && !(NPC_SPRITES as readonly string[]).includes(p.sprite ?? '')) errors.push(`${where}: unknown sprite "${p.sprite ?? ''}"`);
      if (kind === 'warp') {
        const to = p.to ?? '';
        const spawn = p.spawn ?? '';
        const target = spawns.get(to);
        if (!isMapTownId(to)) errors.push(`${where}: dead warp, ${to || '(empty)'} is not a town with a map`);
        else if (!spawn) errors.push(`${where}: warp to ${to} has no spawn`);
        else if (!target) warnings.push(`${where}: warp to ${to}, map not built yet`);
        else if (!target.has(spawn)) errors.push(`${where}: dead spawn ${spawn} in ${to}`);
      }
    }
  }

  const uncovered = facts.filter((fact) => !covered.has(fact.id)).map((fact) => fact.id);
  if (uncovered.length) errors.push(`${uncovered.length} facts not on any reachable npc, sign or item: ${uncovered.join(', ')}`);
  if (reachErrors === 0) console.log(`check-content: ${facts.length} facts, ${maps.size} maps, all objects reachable`);
}

function checkLicenses() {
  const assets = join(ROOT, 'public/assets');
  if (!existsSync(assets)) return;
  for (const name of readdirSync(assets)) {
    const dir = join(assets, name);
    if (statSync(dir).isDirectory() && !readdirSync(dir).some((f) => /^licen[sc]e/i.test(f))) {
      errors.push(`public/assets/${name} has no LICENSE file`);
    }
  }
}

if (distMode) {
  scanText(walk(distDir, TEXT_EXTS));
} else {
  checkContent();
  checkMaps();
  const scanned = [...walk(join(ROOT, 'src'), TEXT_EXTS), ...walk(join(ROOT, 'public'), TEXT_EXTS)];
  if (mapsValue) scanned.push(...walk(mapsDir, ['.json']));
  scanText([...new Set(scanned)]);
  checkLicenses();
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length) {
  console.error(`check-content failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(distMode ? 'check-content: dist is clean' : 'check-content: ok');
