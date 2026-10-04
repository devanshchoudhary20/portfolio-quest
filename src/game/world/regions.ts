import type { Tile } from '../movement/GridMover';

export interface Region {
  // the name in the map source, the key of a HUD label
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // interiors ignore the day/night tint
  indoor: boolean;
  // the floor whose walls an LLM keeps rewriting
  maze: boolean;
  // the Hall of Fame: entering the room opens its panel
  hall: boolean;
}

// the map's "regions" property: "x,y,w,h[,indoor][,maze][,hall],name=<name>" tile rectangles joined by semicolons
export function parseRegions(properties: unknown): Region[] {
  const raw = (Array.isArray(properties) ? (properties as { name: string; value: unknown }[]).find((p) => p.name === 'regions')?.value : '') ?? '';
  return String(raw)
    .split(';')
    .map((rect) => rect.split(','))
    .filter((parts) => parts.slice(0, 4).length === 4 && parts.slice(0, 4).every((n) => Number.isFinite(Number(n))))
    .map(([x = '0', y = '0', w = '0', h = '0', ...kinds]) => ({
      name: kinds.find((kind) => kind.startsWith('name='))?.slice('name='.length) ?? '',
      x: Number(x),
      y: Number(y),
      w: Number(w),
      h: Number(h),
      indoor: kinds.includes('indoor'),
      maze: kinds.includes('maze'),
      hall: kinds.includes('hall'),
    }));
}

export const inRegion = (region: Region, tile: Tile) => tile.x >= region.x && tile.x < region.x + region.w && tile.y >= region.y && tile.y < region.y + region.h;
