import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { PNG } from 'pngjs';

// Usage: tsx scripts/build-map.ts maps-src/agra.map [--pack <dir>] [--preview out.png]; turns a text layout into a Tiled JSON map with a packed tileset
const ROOT = resolve(import.meta.dirname, '..');
const T = 16;
const COLUMNS = 16;
const HEADERS = new Set(['map', 'pack', 'sheets', 'legend', 'ground', 'things', 'objects', 'regions']);
const OBJECT_LAYERS = ['npcs', 'signs', 'items', 'warps'] as const;
const KIND_OF_LAYER: Record<string, string> = { npcs: 'npc', signs: 'sign', items: 'item', warps: 'warp' };

const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const srcFile = args.find((a) => !a.startsWith('--') && a !== flag('--pack') && a !== flag('--preview'));
if (!srcFile) throw new Error('usage: build-map.ts <file.map> [--pack dir] [--preview out.png]');

const fail = (message: string): never => {
  console.error(`build-map: ${message}`);
  process.exit(1);
};

interface TileRef { sheet: string; col: number; row: number }
interface Entry { kind: 'ground' | 'tile' | 'stamp' | 'block'; ref?: TileRef; w: number; h: number; solid: boolean; walk: string[] }

function parseRef(text: string): TileRef {
  const m = /^(\w+):(\d+),(\d+)$/.exec(text);
  if (!m) return fail(`bad tile reference "${text}"`);
  return { sheet: m[1]!, col: Number(m[2]), row: Number(m[3]) };
}

const sections = new Map<string, string[]>();
let current = '';
for (const raw of readFileSync(resolve(ROOT, srcFile), 'utf8').split('\n')) {
  const head = raw.trim().split(/\s+/)[0] ?? '';
  const isHeader = !raw.startsWith(' ') && HEADERS.has(head) && (raw.trim() === head || head === 'map' || head === 'pack');
  if (isHeader) {
    current = head;
    sections.set(current, raw.trim() === head ? [] : [raw.trim().slice(head.length).trim()]);
  } else if (current && raw.trim() !== '' && !raw.trimStart().startsWith('//')) {
    sections.get(current)!.push(raw);
  }
}

const [name = '', width = '', height = ''] = (sections.get('map')?.[0] ?? '').split(/\s+/);
const W = Number(width);
const H = Number(height);
if (!name || !W || !H) fail('map header must read: map <name> <width> <height>');

const packDir = flag('--pack') ?? process.env.NINJA_PACK ?? sections.get('pack')?.[0] ?? '';
if (!existsSync(packDir)) fail(`asset pack not found at "${packDir}" (set NINJA_PACK or pass --pack)`);

const sheetPaths = new Map(
  (sections.get('sheets') ?? []).map((line) => {
    const [alias = '', path = ''] = line.trim().split(/\s+/);
    return [alias, join(packDir, path)] as const;
  }),
);

const legend = new Map<string, Entry>();
for (const line of sections.get('legend') ?? []) {
  const [char = '', kind = '', ...rest] = line.trim().split(/\s+/);
  const words = rest.filter((w) => !w.includes('='));
  const walk = rest.find((w) => w.startsWith('walk='))?.slice(5).split(';') ?? [];
  const solid = words.includes('solid');
  const size = words.find((w) => /^\d+x\d+$/.test(w))?.split('x').map(Number) ?? [1, 1];
  const ref = words.find((w) => w.includes(':'));
  if (kind === 'block') legend.set(char, { kind: 'block', w: 1, h: 1, solid: true, walk: [] });
  else if (kind === 'ground' || kind === 'tile' || kind === 'stamp') {
    legend.set(char, { kind, ref: parseRef(ref ?? ''), w: size[0]!, h: size[1]!, solid, walk });
  } else fail(`legend "${line.trim()}": unknown kind`);
}

const sheetCache = new Map<string, PNG>();
function sheet(alias: string) {
  const path = sheetPaths.get(alias);
  if (!path) return fail(`unknown sheet alias "${alias}"`);
  if (!sheetCache.has(alias)) sheetCache.set(alias, PNG.sync.read(readFileSync(path)));
  return sheetCache.get(alias)!;
}

const packed: TileRef[] = [];
const idOf = (ref: TileRef) => {
  const key = `${ref.sheet}:${ref.col},${ref.row}`;
  let i = packed.findIndex((p) => `${p.sheet}:${p.col},${p.row}` === key);
  if (i < 0) i = packed.push(ref) - 1;
  return i + 1;
};

function grid(section: string) {
  const rows = (sections.get(section) ?? []).map((r) => r.replace(/\r$/, ''));
  if (rows.length !== H) fail(`${section}: expected ${H} rows, got ${rows.length}`);
  rows.forEach((r, y) => r.length !== W && fail(`${section} row ${y}: expected ${W} chars, got ${r.length}`));
  return rows;
}

const groundRows = grid('ground');
const thingRows = grid('things');
const ground = new Array<number>(W * H).fill(0);
const things = new Array<number>(W * H).fill(0);
const solid = new Array<boolean>(W * H).fill(false);

groundRows.forEach((row, y) =>
  [...row].forEach((ch, x) => {
    if (ch === '_') return;
    const e = legend.get(ch);
    if (!e || e.kind !== 'ground') fail(`ground ${x},${y}: "${ch}" is not a ground legend char`);
    ground[y * W + x] = idOf(e!.ref!);
  }),
);

thingRows.forEach((row, y) =>
  [...row].forEach((ch, x) => {
    if (ch === '.') return;
    const e = legend.get(ch);
    if (!e || e.kind === 'ground') return fail(`things ${x},${y}: "${ch}" is not a things legend char`);
    if (e.kind === 'block') solid[y * W + x] = true;
    else if (e.kind === 'tile') {
      things[y * W + x] = idOf(e.ref!);
      solid[y * W + x] = e.solid;
    } else {
      for (let dy = 0; dy < e.h; dy++) {
        for (let dx = 0; dx < e.w; dx++) {
          if (x + dx >= W || y + dy >= H) fail(`things ${x},${y}: stamp "${ch}" leaves the map`);
          const at = (y + dy) * W + x + dx;
          things[at] = idOf({ sheet: e.ref!.sheet, col: e.ref!.col + dx, row: e.ref!.row + dy });
          solid[at] = e.solid && !e.walk.includes(`${dx},${dy}`);
        }
      }
    }
  }),
);

const markerId = packed.length + 1;
const rowsCount = Math.ceil((packed.length + 1) / COLUMNS);
const png = new PNG({ width: COLUMNS * T, height: rowsCount * T });
const blit = (src: PNG, sx: number, sy: number, index: number) => {
  const dx = (index % COLUMNS) * T;
  const dy = Math.floor(index / COLUMNS) * T;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const s = ((sy + y) * src.width + sx + x) * 4;
    const d = ((dy + y) * png.width + dx + x) * 4;
    for (let c = 0; c < 4; c++) png.data[d + c] = src.data[s + c]!;
  }
};
packed.forEach((ref, i) => blit(sheet(ref.sheet), ref.col * T, ref.row * T, i));
// the marker tile only exists so Tiled shows the collision layer: translucent red
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const d = (Math.floor(packed.length / COLUMNS) * T + y) * png.width + ((packed.length % COLUMNS) * T + x);
  png.data.set([200, 73, 63, 110], d * 4);
}

const tilesetImage = `tiles-${name}.png`;
const assetsDir = resolve(ROOT, 'public/assets/ninja-adventure');
const mapOut = resolve(ROOT, `public/maps/${name}.json`);
mkdirSync(assetsDir, { recursive: true });
mkdirSync(dirname(mapOut), { recursive: true });
writeFileSync(join(assetsDir, tilesetImage), PNG.sync.write(png));

type Prop = { name: string; type: 'string' | 'bool' | 'int'; value: string | boolean | number };
let nextObjectId = 1;
const objectLayers = OBJECT_LAYERS.map((layerName, i) => ({
  id: 10 + i,
  name: layerName,
  type: 'objectgroup',
  draworder: 'topdown',
  opacity: 1,
  visible: true,
  x: 0,
  y: 0,
  objects: [] as unknown[],
}));

for (const line of sections.get('objects') ?? []) {
  const m = /^\s*(\w+)\s+(\S+)\s+(\d+),(\d+)(.*)$/.exec(line);
  if (!m) fail(`objects: cannot read "${line.trim()}"`);
  const [, layerName = '', objName = '', ox = '0', oy = '0', rest = ''] = m!;
  const layer = objectLayers.find((l) => l.name === layerName);
  if (!layer) fail(`objects: unknown layer "${layerName}"`);
  const props: Record<string, string> = { kind: KIND_OF_LAYER[layerName] ?? '' };
  for (const kv of rest.matchAll(/(\w+)=("[^"]*"|\S+)/g)) props[kv[1]!] = kv[2]!.replace(/^"|"$/g, '');
  const properties: Prop[] = Object.entries(props).map(([k, v]) => ({ name: k, type: 'string', value: v }));
  layer!.objects.push({ id: nextObjectId++, name: objName, type: props.kind, x: Number(ox) * T, y: Number(oy) * T, width: T, height: T, rotation: 0, visible: true, properties });
}

// camera regions, "x,y,w,h" in tiles: the camera clamps to the region the player stands in, so a small room is centered
const regions = (sections.get('regions') ?? []).map((line) => {
  const rect = line.trim().split(/\s+/)[1] ?? '';
  if (!/^\d+,\d+,\d+,\d+$/.test(rect)) fail(`regions: cannot read "${line.trim()}"`);
  return rect;
});

const tileLayer = (id: number, layerName: string, data: number[], extra: object = {}) => ({
  id, name: layerName, type: 'tilelayer', x: 0, y: 0, width: W, height: H, opacity: 1, visible: true, data, ...extra,
});

const map = {
  compressionlevel: -1,
  width: W,
  height: H,
  tilewidth: T,
  tileheight: T,
  infinite: false,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.11.2',
  version: '1.10',
  type: 'map',
  properties: [{ name: 'regions', type: 'string', value: regions.join(';') }],
  nextlayerid: 20,
  nextobjectid: nextObjectId,
  layers: [
    tileLayer(1, 'ground', ground),
    tileLayer(2, 'things', things),
    tileLayer(3, 'collide', solid.map((s) => (s ? markerId : 0)), {
      visible: false,
      properties: [{ name: 'ge_collide', type: 'bool', value: true }],
    }),
    ...objectLayers,
  ],
  tilesets: [
    {
      firstgid: 1,
      name,
      image: relative(dirname(mapOut), join(assetsDir, tilesetImage)),
      imagewidth: png.width,
      imageheight: png.height,
      tilewidth: T,
      tileheight: T,
      tilecount: rowsCount * COLUMNS,
      columns: COLUMNS,
      margin: 0,
      spacing: 0,
      tiles: [{ id: markerId - 1, properties: [{ name: 'ge_collide', type: 'bool', value: true }] }],
    },
  ],
};
writeFileSync(mapOut, `${JSON.stringify(map)}\n`);
console.log(`build-map: ${relative(ROOT, mapOut)} ${W}x${H}, ${packed.length} tiles packed, ${solid.filter(Boolean).length} solid cells`);

const preview = flag('--preview');
if (preview) {
  const Z = 3;
  const out = new PNG({ width: W * T * Z, height: H * T * Z });
  for (let i = 0; i < out.data.length; i += 4) out.data.set([27, 31, 46, 255], i);
  const put = (id: number, x: number, y: number) => {
    if (!id) return;
    const sx = ((id - 1) % COLUMNS) * T;
    const sy = Math.floor((id - 1) / COLUMNS) * T;
    for (let py = 0; py < T * Z; py++) for (let px = 0; px < T * Z; px++) {
      const s = ((sy + Math.floor(py / Z)) * png.width + sx + Math.floor(px / Z)) * 4;
      const d = ((y * T * Z + py) * out.width + x * T * Z + px) * 4;
      const a = png.data[s + 3]! / 255;
      for (let c = 0; c < 3; c++) out.data[d + c] = Math.round(png.data[s + c]! * a + out.data[d + c]! * (1 - a));
    }
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { put(ground[y * W + x]!, x, y); put(things[y * W + x]!, x, y); }
  const dot = (x: number, y: number, rgb: number[]) => {
    for (let py = 4; py < T * Z - 4; py++) for (let px = 4; px < T * Z - 4; px++) out.data.set([...rgb, 255], ((y * T * Z + py) * out.width + x * T * Z + px) * 4);
  };
  const colors: Record<string, number[]> = { npcs: [255, 0, 255], signs: [255, 255, 0], items: [0, 255, 255], warps: [255, 0, 0] };
  for (const l of objectLayers) for (const o of l.objects as { x: number; y: number }[]) dot(o.x / T, o.y / T, colors[l.name]!);
  writeFileSync(resolve(preview), PNG.sync.write(out));
}
