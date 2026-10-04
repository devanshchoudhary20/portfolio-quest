import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'pq-fixtures-'));

// built from pieces so no phone number or banned word sits in the repo
const spacedPhone = ['9368', '321', '127'].join('  ');
const dashedPhone = ['93', '68', '321', '127'].join(' - ');
const accented = ['Pok', 'é', 'mon'].join('');
const spaced = ['Game', '_', 'Freak'].join('');

function generated(name: string, files: Record<string, string>) {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text);
  return dir;
}

const note = (text: string) => JSON.stringify({ layers: [], note: text });

interface Case { name: string; args: string[]; expect: string }

const cases: Case[] = [
  { name: 'unknown factId', args: ['--maps', 'scripts/fixtures/bad-maps'], expect: 'unknown factId bogus.fact' },
  { name: 'dead warp', args: ['--maps', 'scripts/fixtures/bad-maps'], expect: 'dead warp' },
  { name: 'warp with no spawn', args: ['--maps', 'scripts/fixtures/no-spawn'], expect: 'has no spawn' },
  { name: 'unnamed object is not a spawn', args: ['--maps', 'scripts/fixtures/no-spawn'], expect: 'dead spawn door in gear' },
  { name: 'object inside a group layer', args: ['--maps', 'scripts/fixtures/group-layer'], expect: 'unknown factId bogus.in.group' },
  { name: 'layer name is case sensitive', args: ['--maps', 'scripts/fixtures/layer-case'], expect: 'unknown object layer "NPCs"' },
  { name: 'npc without factId', args: ['--maps', 'scripts/fixtures/npc-no-fact'], expect: 'missing factId' },
  { name: 'flavor npc with a flag and its own text', args: ['--maps', 'scripts/fixtures/flavor-text'], expect: 'property "say" is not allowed on a npc' },
  { name: 'a text key is not on the allowlist', args: ['--maps', 'scripts/fixtures/text-key'], expect: 'property "text" is not allowed on a npc' },
  { name: 'an npc walled in by collide tiles', args: ['--maps', 'scripts/fixtures/sealed-room'], expect: 'agra/npcs/guard: unreachable' },
  { name: 'an npc sprite no sheet is loaded for', args: ['--maps', 'scripts/fixtures/bad-sprite'], expect: 'unknown sprite "wizard"' },
  { name: 'a spawn on a collide tile', args: ['--maps', 'scripts/fixtures/blocked-spawn'], expect: 'spawn sits on a blocked tile' },
  { name: 'a fact on a sealed npc does not count as covered', args: ['--maps', 'scripts/fixtures/sealed-room'], expect: 'not on any reachable npc, sign or item: agra.summary' },
  { name: 'flavor text does not stand in for a fact', args: ['--maps', 'scripts/fixtures/flavor-text'], expect: 'missing factId' },
  { name: 'a fact no map references', args: ['--maps', 'scripts/fixtures/no-spawn'], expect: 'not on any reachable npc, sign or item' },
  { name: 'a gate whose key sits behind the same gate', args: ['--maps', 'scripts/fixtures/gate-deadlock'], expect: 'agra/gates/door: gate never opens, needs key.a' },
  { name: 'a gate that needs a flag no object gives', args: ['--maps', 'scripts/fixtures/gate-no-giver'], expect: 'ghost.key, which no reachable object gives' },
  { name: 'a warp with an unless flag no object gives', args: ['--maps', 'scripts/fixtures/warp-no-giver'], expect: 'never.given, which no reachable object gives' },
  { name: 'a warp that needs two flags of one exclusive cycle', args: ['--maps', 'scripts/fixtures/cycle-both'], expect: 'needs two flags of one exclusive cycle' },
  { name: 'a gate that needs a cycle flag', args: ['--maps', 'scripts/fixtures/cycle-gate'], expect: 'a gate stays open for good, so it cannot need cycle flag role.owner' },
  { name: 'an unless on a cycle flag', args: ['--maps', 'scripts/fixtures/cycle-unless'], expect: 'unless uses cycle flag role.owner' },
  { name: 'an object that grants seen.10', args: ['--maps', 'scripts/fixtures/seen-ten-flag'], expect: 'seen.10 is derived by the store' },
  { name: 'a flag with no pickup line', args: ['--maps', 'scripts/fixtures/flag-no-line'], expect: 'flag mystery.flag has no line in src/game/world/lines.ts' },
  { name: 'a grass zone the player cannot walk to', args: ['--maps', 'scripts/fixtures/grass-battle'], expect: 'agra/encounters/sealed-grass: no tile of the grass zone is reachable' },
  { name: 'a grass pool with an unknown fact', args: ['--maps', 'scripts/fixtures/grass-battle'], expect: 'unknown factId bogus.fact in pool' },
  { name: 'a gym leader with an unknown trainer', args: ['--maps', 'scripts/fixtures/grass-battle'], expect: 'unknown trainer "nobody"' },
  { name: 'a fact that only a reachable grass pool carries', args: ['--maps', 'scripts/fixtures/pool-only'], expect: 'agra/encounters/open-grass: gear.btech is only in a grass pool' },
  { name: 'a trainer with no gym leader npc on any map', args: ['--maps', 'scripts/fixtures/pool-only'], expect: 'trainer core: no reachable npc with battle=core' },
  { name: 'a road that needs badges.3 when fewer than three reachable trainers award a badge', args: ['--maps', 'scripts/fixtures/badges-three'], expect: 'badges.3, which no reachable object gives' },
  { name: 'a hall region the player cannot walk to', args: ['--maps', 'scripts/fixtures/hall-unreachable'], expect: 'agra/regions/hall: no tile of the hall region is reachable' },
  { name: 'a hall region open without the Champion win', args: ['--maps', 'scripts/fixtures/hall-open'], expect: 'agra/regions/hall: the hall region is reachable without beaten.devansh' },
  { name: 'a HUD label for a region no built map has', args: ['--maps', 'scripts/fixtures/hall-open'], expect: 'label elite.dsa: no region "dsa" in the elite map' },
  { name: 'a manifest track missing its ogg and m4a files', args: ['--audio', generated('audio-a', { 'only.ogg': '' })], expect: 'audio title: missing music/title.ogg' },
  { name: '--maps without a value', args: ['--maps'], expect: '--maps requires a directory' },
  { name: 'phone with double spaces', args: ['--maps', generated('phone-a', { 'agra.json': note(spacedPhone) })], expect: 'phone number pattern' },
  { name: 'phone with dashes', args: ['--maps', generated('phone-b', { 'agra.json': note(dashedPhone) })], expect: 'phone number pattern' },
  { name: 'banned word with accent', args: ['--maps', generated('banned-a', { 'agra.json': note(accented) })], expect: 'banned word' },
  { name: 'banned word with separator in dist css', args: ['--dist', generated('dist-a', { 'site.css': `/* ${spaced} */` })], expect: 'banned word' },
  { name: 'phone in dist svg', args: ['--dist', generated('dist-b', { 'logo.svg': `<svg><desc>${spacedPhone}</desc></svg>` })], expect: 'phone number pattern' },
];

let failed = 0;
for (const c of cases) {
  const run = spawnSync('npx', ['tsx', 'scripts/check-content.ts', ...c.args], { cwd: ROOT, encoding: 'utf8' });
  const output = `${run.stdout}${run.stderr}`;
  const ok = run.status === 1 && output.includes(c.expect);
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name} (expects exit 1 and "${c.expect}")`);
  if (!ok) console.log(output);
}
rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
