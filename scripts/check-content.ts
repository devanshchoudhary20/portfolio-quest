import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { education, facts, flagId, isFactId, trainerId, isMapTownId, isTownId, jobs, profile, project, skillGroups, summaryFactId, WILD_SPECIES } from '../src/content';
import { BG_IDS, MOVES, SPECIES, TRAINERS, TRAINER_SPRITES, WILD_BY_TOWN, trainerOf } from '../src/game/battle/data';
import { backArt, bgArt, frontArt, trainerArt } from '../src/game/battle/art';
import { NPC_SPRITES } from '../src/game/world/npcSprites';
import { BADGES_THREE, BADGES_THREE_COUNT, SEEN_TEN, SEEN_TEN_COUNT, flagList, isOpen } from '../src/game/world/conditions';
import { DESTINATIONS } from '../src/game/world/destinations';
import { CLERK, FLAVOR_LINES, ITEM_LINES, PLACE_LABELS, ROLE_LINES, STARTER_LINES } from '../src/game/world/lines';
import { beatenFlag } from '../src/game/world/flags';
import { TRACKS } from '../src/audio/manifest';
import { DEFAULT_SPAWN } from '../src/game/world/towns';
import type { Region } from '../src/game/world/regions';
import { isGate, isWarp, key, neighbors, readMap, reachableTiles, warpIsActive } from './tiledMap';
import type { MapObject, TownMap } from './tiledMap';
import type { FactId } from '../src/content';

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
const audioValue = flagValue('--audio');
const audioDir = resolve(ROOT, audioValue || 'public/assets/audio');
const mapsDir = resolve(ROOT, mapsValue ?? 'public/maps');

// up to 3 non-digits between digits catches "93 68 - 321-127" style formatting
const PHONE = new RegExp(['9', '3', '6', '8', '3', '2', '1', '1', '2', '7'].join('\\D{0,3}'));
const BANNED = /nintendo|pokemon|pikachu|game[\s_-]?freak/i;
const OBJECT_LAYERS = new Set(['npcs', 'signs', 'items', 'warps', 'gates', 'encounters']);
const FACT_LAYERS = new Set(['npcs', 'signs', 'items']);
const FACT_KINDS = new Set(['npc', 'sign', 'item']);
// maps hold no free text: any property key outside its kind's list is an error
const KEYS_BY_KIND: Record<string, string[]> = {
  npc: ['kind', 'factId', 'sprite', 'face', 'speaker', 'portrait', 'flag', 'cycle', 'fills', 'guide', 'battle', 'shop', 'contact', 'tally'],
  sign: ['kind', 'factId', 'speaker'],
  item: ['kind', 'factId', 'speaker', 'portrait', 'flag'],
  warp: ['kind', 'to', 'spawn', 'needs', 'unless'],
  gate: ['kind', 'needs'],
  door: ['kind', 'face'],
  spawn: ['kind', 'face'],
  grass: ['kind', 'pool'],
};
// the Bedroom is where a new game starts, and no door leads back into it from the street; Victory Road is entered from TestMu City, so its walk starts at that landing
const EXTRA_START: Record<string, string> = { agra: 'bedroom', elite: 'testmu-road' };
// the Champion's win is what lets the player into the Hall of Fame
const CHAMPION_BEATEN = beatenFlag(trainerId('devansh'));
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

const rectTiles = (x: number, y: number, w: number, h: number) => Array.from({ length: w * h }, (_, i) => ({ x: x + (i % w), y: y + Math.floor(i / w) }));
const regionTiles = (region: Region) => rectTiles(region.x, region.y, region.w, region.h);

interface Reach {
  talkable: Set<MapObject>;
  // grass zones with at least one tile the player can walk to
  grass: Set<MapObject>;
  errors: string[];
}

// flags one talk can hand over: a flag, a whole exclusive cycle, the rest of a set once the player holds part of it, or the award of the trainer who fights there (a badge or a beaten flag)
function grantedFlags(obj: MapObject, held: ReadonlySet<string>): string[] {
  const fills = flagList(obj.props.fills);
  const award = obj.props.battle ? trainerOf(trainerId(obj.props.battle))?.award.flag : undefined;
  return [
    ...(obj.props.flag ? [obj.props.flag] : []),
    ...flagList(obj.props.cycle),
    ...(fills.some((flag) => held.has(flag)) ? fills : []),
    ...(award ? [award] : []),
  ];
}

// flags the store derives from the rest of the game; the caller decides them from every map
interface Derived {
  seenTen: boolean;
  badgesThree: boolean;
}

// walks a map from its spawns as a fixpoint: gates stay closed and warps follow the flags held so far, the flags the reachable objects give open more, repeat until stable
function computeReach(map: TownMap, derived: Derived): Reach {
  const town = map.name;
  const errs: string[] = [];
  const talkable = new Set<MapObject>();
  const grass = new Set<MapObject>();
  if (!map.hasGround) return { talkable, grass, errors: [`${town}: map has no ground layer`] };
  const starts = [DEFAULT_SPAWN, EXTRA_START[town]].flatMap((name) => (name === undefined ? [] : [name]));
  const spawnObjects = map.objects.filter((o) => o.layer === 'warps' && !isWarp(o));
  for (const o of spawnObjects) {
    if (!map.walkable(o.tile)) errs.push(`${town}/warps/${o.name || '?'}: spawn sits on a blocked tile ${key(o.tile)}`);
  }
  const startTiles: MapObject[] = [];
  for (const name of starts) {
    const found = spawnObjects.find((o) => o.name === name);
    if (found) startTiles.push(found);
    else errs.push(`${town}: no "${name}" spawn`);
  }
  const startWalkable = startTiles.map((o) => o.tile).filter((t) => map.walkable(t));
  // seen.10 and badges.3 are derived by the store from the whole game, so the caller decides them
  const flags = new Set<string>([...(derived.seenTen ? [SEEN_TEN] : []), ...(derived.badgesThree ? [BADGES_THREE] : [])]);
  let reached = new Set<string>();
  let activeWarps = new Set<string>();
  for (let grew = true; grew; ) {
    reached = reachableTiles(map, startWalkable, flags);
    activeWarps = new Set(map.objects.filter((o) => warpIsActive(o, flags)).map((o) => key(o.tile)));
    talkable.clear();
    for (const obj of map.objects) {
      if (FACT_LAYERS.has(obj.layer) && neighbors(obj.tile).some((n) => reached.has(key(n)) && !activeWarps.has(key(n)))) talkable.add(obj);
    }
    const before = flags.size;
    for (const obj of talkable) for (const flag of grantedFlags(obj, flags)) flags.add(flag);
    grew = flags.size > before;
  }
  for (const zone of map.objects.filter((o) => o.layer === 'encounters')) {
    if (rectTiles(zone.tile.x, zone.tile.y, zone.w, zone.h).some((tile) => reached.has(key(tile)))) grass.add(zone);
    else errs.push(`${town}/encounters/${zone.name || '?'}: no tile of the grass zone is reachable`);
  }
  // the Hall of Fame is the reward: reachable at the end, and never without the Champion's win
  const withoutChampion = reachableTiles(map, startWalkable, new Set([...flags].filter((flag) => flag !== CHAMPION_BEATEN)));
  for (const hall of map.regions.filter((region) => region.hall)) {
    const tiles = regionTiles(hall);
    if (!tiles.some((tile) => reached.has(key(tile)))) errs.push(`${town}/regions/${hall.name || '?'}: no tile of the hall region is reachable`);
    if (tiles.some((tile) => withoutChampion.has(key(tile)))) errs.push(`${town}/regions/${hall.name || '?'}: the hall region is reachable without ${CHAMPION_BEATEN}`);
  }
  const held = [...flags];
  const groups = map.objects.map((o) => flagList(o.props.cycle)).filter((group) => group.length > 0);
  const cycleFlags = new Set<string>(groups.flat());
  for (const obj of map.objects) {
    const where = `${town}/${obj.layer}/${obj.name || '?'}`;
    if (FACT_LAYERS.has(obj.layer) && !talkable.has(obj)) {
      errs.push(`${where}: unreachable, no open tile beside ${key(obj.tile)} that the player can walk to`);
    } else if (isWarp(obj) && !reached.has(key(obj.tile))) {
      errs.push(`${where}: warp tile ${key(obj.tile)} is never reached`);
    }
    if (isGate(obj) && flagList(obj.props.needs).length === 0) errs.push(`${where}: gate has no needs`);
    if (isGate(obj) && !isOpen(obj.props, held)) errs.push(`${where}: gate never opens, needs ${obj.props.needs ?? ''}`);
    const wanted = [...flagList(obj.props.needs), ...flagList(obj.props.unless)];
    for (const flag of wanted) if (!flags.has(flag)) errs.push(`${where}: needs or unless flag ${flag}, which no reachable object gives`);
    const needs = flagList(obj.props.needs);
    // a cycle flag is gone the moment the NPC hands out the next one, so only a warp's needs may rest on it
    for (const flag of flagList(obj.props.unless)) if (cycleFlags.has(flag)) errs.push(`${where}: unless uses cycle flag ${flag}, which comes and goes with each talk`);
    if (isGate(obj)) for (const flag of needs) if (cycleFlags.has(flag)) errs.push(`${where}: a gate stays open for good, so it cannot need cycle flag ${flag}`);
    if (obj.props.flag === SEEN_TEN || obj.props.flag === BADGES_THREE) errs.push(`${where}: ${obj.props.flag} is derived by the store, an object cannot grant it`);
    for (const flag of [...(obj.props.flag ? [obj.props.flag] : []), ...flagList(obj.props.cycle)]) {
      if (!ITEM_LINES.has(flagId(flag)) && !ROLE_LINES.has(flagId(flag))) errs.push(`${where}: flag ${flag} has no line in src/game/world/lines.ts`);
    }
    for (const group of groups) {
      if (needs.filter((flag) => group.includes(flag)).length > 1) errs.push(`${where}: needs two flags of one exclusive cycle (${group.join(', ')})`);
    }
  }
  return { talkable, grass, errors: errs };
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
  const grass = new Set<MapObject>();
  const poolFacts: [string, FactId[]][] = [];

  for (const [town, map] of maps) {
    for (const layer of map.objectLayers) {
      if (!OBJECT_LAYERS.has(layer)) errors.push(`${town}: unknown object layer "${layer}"`);
    }
    const names = map.objects.filter((o) => OBJECT_LAYERS.has(o.layer)).map((o) => o.name).filter(Boolean);
    spawns.set(town, new Set(names));
  }
  // seen.10 holds once 10 distinct facts sit on reachable objects across all maps, badges.3 once 3 reachable trainers award a badge; more flags only add reach, so a few passes settle both
  let derived: Derived = { seenTen: false, badgesThree: false };
  let results = new Map<string, Reach>();
  for (let pass = 0; pass < 4; pass++) {
    results = new Map([...maps].map(([town, map]) => [town, computeReach(map, derived)]));
    const talked = [...results.values()].flatMap((r) => [...r.talkable]);
    const shown = new Set(talked.map((o) => o.props.factId).filter(Boolean));
    const badgeLeaders = new Set(talked.map((o) => (o.props.battle ? trainerOf(trainerId(o.props.battle)) : undefined)).filter((t) => t?.award.kind === 'badge').map((t) => t?.id));
    const next = { seenTen: shown.size >= SEEN_TEN_COUNT, badgesThree: badgeLeaders.size >= BADGES_THREE_COUNT };
    if (next.seenTen === derived.seenTen && next.badgesThree === derived.badgesThree) break;
    derived = next;
  }
  for (const reach of results.values()) {
    for (const obj of reach.talkable) talkable.add(obj);
    for (const zone of reach.grass) grass.add(zone);
    errors.push(...reach.errors);
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
      // only an npc, sign or item beside a walkable tile counts a fact as shown: recruiters play with wild bugs off, so a pool alone would hide it
      if (p.factId && talkable.has(obj) && isFactId(p.factId)) covered.add(p.factId);
      const pool = p.pool ? p.pool.split(',').map((s) => s.trim()).filter(Boolean) : [];
      if (kind === 'grass' && pool.length === 0) errors.push(`${where}: grass zone has an empty pool`);
      for (const id of pool) if (!isFactId(id)) errors.push(`${where}: unknown factId ${id} in pool`);
      if (kind === 'grass' && grass.has(obj)) poolFacts.push([where, pool.filter(isFactId)]);
      if (kind === 'grass' && !WILD_BY_TOWN[town]) errors.push(`${where}: no wild bugs are listed for ${town} in src/game/battle/data.ts`);
      if (kind === 'npc' && p.battle) {
        const trainer = TRAINERS.find((t) => t.id === p.battle);
        if (!trainer) errors.push(`${where}: unknown trainer "${p.battle}"`);
        else if (trainer.factId !== p.factId) errors.push(`${where}: trainer ${trainer.id} says ${trainer.factId}, the npc says ${p.factId ?? '(none)'}`);
      }
      if (kind === 'npc' && p.shop !== undefined && p.speaker !== CLERK) errors.push(`${where}: a shop npc speaks as "${CLERK}", the map says "${p.speaker ?? ''}"`);
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

  // a HUD label names a region that the built map really has
  for (const labelKey of PLACE_LABELS.keys()) {
    const [labelTown = '', labelRegion = ''] = labelKey.split('.');
    if (!maps.get(labelTown)?.regions.some((region) => region.name === labelRegion)) errors.push(`label ${labelKey}: no region "${labelRegion}" in the ${labelTown} map`);
  }

  for (const dest of DESTINATIONS) {
    const names = spawns.get(dest.town);
    if (!names) errors.push(`destination ${dest.id}: town ${dest.town} has no map`);
    else if (dest.at && !names.has(dest.at)) errors.push(`destination ${dest.id}: no object "${dest.at}" in ${dest.town}`);
  }

  for (const [where, pool] of poolFacts) {
    for (const id of pool) if (!covered.has(id)) errors.push(`${where}: ${id} is only in a grass pool, and a reachable npc, sign or item must carry it too`);
  }
  const leaders = new Set([...talkable].filter((o) => o.layer === 'npcs' && o.props.battle).map((o) => o.props.battle));
  for (const trainer of TRAINERS) if (!leaders.has(trainer.id)) errors.push(`trainer ${trainer.id}: no reachable npc with battle=${trainer.id} on any map`);
  const uncovered = facts.filter((fact) => !covered.has(fact.id)).map((fact) => fact.id);
  if (uncovered.length) errors.push(`${uncovered.length} facts not on any reachable npc, sign or item: ${uncovered.join(', ')}`);
  if (reachErrors === 0) console.log(`check-content: ${facts.length} facts, ${maps.size} maps, all objects reachable`);
}

const duplicates = (ids: readonly string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

function checkBattle() {
  for (const id of duplicates(MOVES.map((m) => m.id))) errors.push(`duplicate move id ${id}`);
  for (const id of duplicates(SPECIES.map((s) => s.id))) errors.push(`duplicate species id ${id}`);
  for (const id of duplicates(TRAINERS.map((t) => t.id))) errors.push(`duplicate trainer id ${id}`);
  const speciesIds = new Set<string>(SPECIES.map((s) => s.id));
  const moveIds = new Set<string>(MOVES.map((m) => m.id));
  const hasFile = (url: string) => existsSync(join(ROOT, 'public', url));
  for (const move of MOVES) {
    if (move.factId !== undefined && !isFactId(move.factId)) errors.push(`move ${move.id}: unknown factId ${move.factId}`);
    if (move.factId === undefined && !FLAVOR_LINES.has(move.id)) errors.push(`move ${move.id}: no factId and no line in src/game/world/lines.ts`);
    if (move.factId !== undefined && FLAVOR_LINES.has(move.id)) errors.push(`move ${move.id}: has both a factId and a flavor line`);
    if (blank(move.name) || move.power <= 0) errors.push(`move ${move.id}: needs a name and a power above 0`);
  }
  for (const id of FLAVOR_LINES.keys()) if (!moveIds.has(id)) errors.push(`lines.ts has a flavor line for unknown move ${id}`);
  for (const species of SPECIES) {
    for (const id of species.moves) if (!moveIds.has(id)) errors.push(`species ${species.id}: unknown move ${id}`);
    const starter = species.id in STARTER_LINES;
    const moves = MOVES.filter((m) => species.moves.includes(m.id));
    if (starter && (species.moves.length !== 4 || moves.some((m) => m.factId === undefined))) errors.push(`starter ${species.id}: needs four moves that each carry a resume fact`);
    if (!starter && moves.some((m) => m.factId !== undefined)) errors.push(`bug ${species.id}: its moves use lines.ts, not resume facts`);
    for (const art of [frontArt(species.id), backArt(species.id)]) if (!hasFile(art.url)) errors.push(`species ${species.id}: missing sprite ${art.url}`);
  }
  for (const id of Object.keys(STARTER_LINES)) if (!speciesIds.has(id)) errors.push(`STARTER_LINES has unknown species ${id}`);
  const wild = SPECIES.filter((s) => !(s.id in STARTER_LINES)).map((s) => s.id);
  if ([...wild].sort().join() !== [...WILD_SPECIES].sort().join()) errors.push('WILD_SPECIES in src/content/ids.ts must list exactly the bugs in src/game/battle/data.ts');
  for (const [town, roster] of Object.entries(WILD_BY_TOWN)) for (const id of roster) if (!speciesIds.has(id)) errors.push(`wild bugs of ${town}: unknown species ${id}`);
  for (const trainer of TRAINERS) {
    if (!isFactId(trainer.factId)) errors.push(`trainer ${trainer.id}: unknown factId ${trainer.factId}`);
    if (trainer.award.kind === 'badge' && !ITEM_LINES.has(trainer.award.flag)) errors.push(`trainer ${trainer.id}: badge ${trainer.award.flag} has no line in src/game/world/lines.ts`);
    if (!BG_IDS.includes(trainer.bg)) errors.push(`trainer ${trainer.id}: unknown background ${trainer.bg}`);
    if (trainer.party.length === 0) errors.push(`trainer ${trainer.id}: empty party`);
    for (const id of trainer.party) if (!speciesIds.has(id)) errors.push(`trainer ${trainer.id}: unknown species ${id}`);
    if (!(TRAINER_SPRITES as readonly string[]).includes(trainer.id)) errors.push(`trainer ${trainer.id}: no sprite id`);
  }
  for (const id of TRAINER_SPRITES) if (!hasFile(trainerArt(id).url)) errors.push(`trainer sprite ${id}: missing ${trainerArt(id).url}`);
  for (const id of BG_IDS) if (!hasFile(bgArt(id).url)) errors.push(`battle background ${id}: missing ${bgArt(id).url}`);
}

// the player picks ogg or m4a by browser, so each track needs both
function checkAudio() {
  for (const [id, track] of Object.entries(TRACKS)) {
    for (const ext of ['ogg', 'm4a']) {
      if (!existsSync(join(audioDir, `${track.file}.${ext}`))) errors.push(`audio ${id}: missing ${track.file}.${ext} under ${rel(audioDir)}`);
    }
  }
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
  checkBattle();
  checkAudio();
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
