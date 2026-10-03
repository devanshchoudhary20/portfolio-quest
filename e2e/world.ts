import { FACE_BACK, OFFSETS, key, readMap } from '../scripts/tiledMap';
import type { Dir, MapObject, Tile, TownMap } from '../scripts/tiledMap';

export type { Dir, MapObject, Tile, TownMap };

export const readTown = (town: string) => readMap(`public/maps/${town}.json`);

export const factObjects = (map: TownMap) => map.objects.filter((o) => ['npcs', 'signs', 'items'].includes(o.layer) && o.props.factId);

// a free tile next to the object, with the direction that faces it
export function standingSpot(map: TownMap, target: MapObject): { tile: Tile; facing: Dir } {
  const blocked = new Set(map.objects.filter((o) => o.layer === 'npcs' || o.props.to !== undefined).map((o) => key(o.tile)));
  for (const [dir, dx, dy] of OFFSETS) {
    const tile = { x: target.tile.x + dx, y: target.tile.y + dy };
    if (map.walkable(tile) && !blocked.has(key(tile))) return { tile, facing: FACE_BACK[dir] };
  }
  throw new Error(`no free tile next to ${target.name}`);
}

// direction from a tile to the warp beside it that leads to another town
export function roadDirection(map: TownMap, from: Tile, to: string): Dir {
  for (const [dir, dx, dy] of OFFSETS) {
    const next = { x: from.x + dx, y: from.y + dy };
    if (map.objects.some((o) => o.props.to === to && o.tile.x === next.x && o.tile.y === next.y)) return dir;
  }
  throw new Error(`no road to ${to} next to ${from.x},${from.y}`);
}
