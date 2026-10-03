import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { education, facts, isFactId, isMapTownId, isTownId, jobs, profile, project, skillGroups, summaryFactId } from '../src/content';

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
const KINDS = new Set(['npc', 'sign', 'item', 'warp', 'grass', 'door', 'spawn']);
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

interface TiledObject { name?: string; properties?: { name: string; value: unknown }[] }
interface TiledLayer { name: string; type: string; objects?: TiledObject[]; layers?: TiledLayer[] }

const propsOf = (obj: TiledObject) => Object.fromEntries((obj.properties ?? []).map((p) => [p.name, p.value]));
const flatten = (layers: TiledLayer[]): TiledLayer[] => layers.flatMap((l) => (l.type === 'group' ? flatten(l.layers ?? []) : [l]));

function loadMaps(dir: string) {
  const maps = new Map<string, TiledLayer[]>();
  for (const file of walk(dir, ['.json'])) {
    try {
      const json = JSON.parse(readFileSync(file, 'utf8')) as { layers?: TiledLayer[] };
      maps.set(basename(file, '.json'), flatten(json.layers ?? []).filter((l) => l.type === 'objectgroup'));
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
  if (skillGroups.length === 0) errors.push('skillGroups is empty');
}

function checkMaps() {
  if (mapsValue === '') {
    errors.push('--maps requires a directory');
    return 0;
  }
  const maps = loadMaps(mapsDir);
  const covered = new Set<string>();
  const spawns = new Map<string, Set<string>>();

  for (const [town, layers] of maps) {
    for (const layer of layers) {
      if (!OBJECT_LAYERS.has(layer.name)) errors.push(`${town}: unknown object layer "${layer.name}"`);
    }
    const names = layers.filter((l) => OBJECT_LAYERS.has(l.name)).flatMap((l) => (l.objects ?? []).map((o) => o.name ?? '').filter(Boolean));
    spawns.set(town, new Set(names));
  }

  for (const [town, layers] of maps) {
    for (const layer of layers.filter((l) => OBJECT_LAYERS.has(l.name))) {
      for (const obj of layer.objects ?? []) {
        const where = `${town}/${layer.name}/${obj.name || '?'}`;
        const p = propsOf(obj);
        const kind = typeof p.kind === 'string' ? p.kind : '';
        if (!KINDS.has(kind)) errors.push(`${where}: missing or unknown kind "${kind}"`);
        if (FACT_KINDS.has(kind) || FACT_LAYERS.has(layer.name)) {
          if (typeof p.factId !== 'string' || p.factId === '') errors.push(`${where}: missing factId`);
        }
        if (typeof p.factId === 'string' && p.factId !== '') {
          covered.add(p.factId);
          if (!isFactId(p.factId)) errors.push(`${where}: unknown factId ${p.factId}`);
        }
        for (const id of typeof p.pool === 'string' ? p.pool.split(',').map((s) => s.trim()).filter(Boolean) : []) {
          covered.add(id);
          if (!isFactId(id)) errors.push(`${where}: unknown factId ${id} in pool`);
        }
        if (kind === 'warp') {
          const to = String(p.to ?? '');
          const spawn = String(p.spawn ?? '');
          const target = spawns.get(to);
          if (!isMapTownId(to)) errors.push(`${where}: dead warp, ${to || '(empty)'} is not a town with a map`);
          else if (!spawn) errors.push(`${where}: warp to ${to} has no spawn`);
          else if (!target) warnings.push(`${where}: warp to ${to}, map not built yet`);
          else if (!target.has(spawn)) errors.push(`${where}: dead spawn ${spawn} in ${to}`);
        }
      }
    }
  }

  const uncovered = facts.filter((fact) => !covered.has(fact.id)).map((fact) => fact.id);
  if (uncovered.length) warnings.push(`${uncovered.length} facts not referenced by any map: ${uncovered.join(', ')}`);
  return maps.size;
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
  const mapCount = checkMaps();
  const scanned = [...walk(join(ROOT, 'src'), TEXT_EXTS), ...walk(join(ROOT, 'public'), TEXT_EXTS)];
  if (mapsValue) scanned.push(...walk(mapsDir, ['.json']));
  scanText([...new Set(scanned)]);
  checkLicenses();
  console.log(`check-content: ${facts.length} facts, ${mapCount} maps`);
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length) {
  console.error(`check-content failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(distMode ? 'check-content: dist is clean' : 'check-content: ok');
