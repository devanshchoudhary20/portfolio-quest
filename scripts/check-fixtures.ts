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
