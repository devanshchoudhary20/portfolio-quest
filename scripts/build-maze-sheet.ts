import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';

// Usage: tsx scripts/build-maze-sheet.ts; packs the runtime maze sprites (wall, flag) from the Ninja Adventure pack into one 16x16 sheet
const ROOT = resolve(import.meta.dirname, '..');
const PACK = join(ROOT, 'vendor/ninja-adventure/Backgrounds/Tilesets');
const T = 16;
const FRAMES = [
  { file: 'TilesetDungeon.png', col: 3, row: 1 },
  { file: 'tileset_camp.png', col: 7, row: 6 },
];

const out = new PNG({ width: T * FRAMES.length, height: T });
FRAMES.forEach(({ file, col, row }, i) => {
  const src = PNG.sync.read(readFileSync(join(PACK, file)));
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const s = ((row * T + y) * src.width + col * T + x) * 4;
    const d = (y * out.width + i * T + x) * 4;
    for (let c = 0; c < 4; c++) out.data[d + c] = src.data[s + c]!;
  }
});
writeFileSync(join(ROOT, 'public/assets/ninja-adventure/maze-sheet.png'), PNG.sync.write(out));
console.log(`build-maze-sheet: ${FRAMES.length} frames`);
