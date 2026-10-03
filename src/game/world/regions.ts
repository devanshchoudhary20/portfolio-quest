import type { Tile } from '../movement/GridMover';

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  // interiors ignore the day/night tint
  indoor: boolean;
  // the floor whose walls an LLM keeps rewriting
  maze: boolean;
}

// the map's "regions" property: "x,y,w,h[,indoor][,maze]" tile rectangles joined by semicolons
export function parseRegions(properties: unknown): Region[] {
  const raw = (Array.isArray(properties) ? (properties as { name: string; value: unknown }[]).find((p) => p.name === 'regions')?.value : '') ?? '';
  return String(raw)
    .split(';')
    .map((rect) => rect.split(','))
    .filter((parts) => parts.slice(0, 4).length === 4 && parts.slice(0, 4).every((n) => Number.isFinite(Number(n))))
    .map(([x = '0', y = '0', w = '0', h = '0', ...kinds]) => ({
      x: Number(x),
      y: Number(y),
      w: Number(w),
      h: Number(h),
      indoor: kinds.includes('indoor'),
      maze: kinds.includes('maze'),
    }));
}

export const inRegion = (region: Region, tile: Tile) => tile.x >= region.x && tile.x < region.x + region.w && tile.y >= region.y && tile.y < region.y + region.h;
