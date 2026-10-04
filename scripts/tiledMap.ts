import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { isOpen } from '../src/game/world/conditions';

const TILE = 16;
// Tiled packs flip flags into the top bits of a gid
const GID_MASK = 0x1fffffff;

export type Dir = 'up' | 'down' | 'left' | 'right';
export interface Tile { x: number; y: number }

interface RawProp { name: string; value: unknown }
interface RawObject { name?: string; x?: number; y?: number; width?: number; height?: number; properties?: RawProp[] }
interface RawLayer { name: string; type: string; data?: number[]; objects?: RawObject[]; layers?: RawLayer[] }
interface RawTileset { firstgid: number; tiles?: { id: number; properties?: RawProp[] }[] }
interface RawMap { width?: number; height?: number; layers?: RawLayer[]; tilesets?: RawTileset[] }

// w and h are in tiles; only a grass zone spans more than one
export interface MapObject { name: string; layer: string; tile: Tile; w: number; h: number; props: Record<string, string> }

export interface TownMap {
  name: string;
  width: number;
  height: number;
  hasGround: boolean;
  objectLayers: string[];
  objects: MapObject[];
  // tile terrain only: ground painted, collide empty, no ge_collide tile
  walkable: (tile: Tile) => boolean;
  spawn: (name: string) => Tile;
}

export const OFFSETS: [Dir, number, number][] = [['down', 0, 1], ['up', 0, -1], ['left', -1, 0], ['right', 1, 0]];
export const FACE_BACK: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const key = (tile: Tile) => `${tile.x},${tile.y}`;

const flatten = (layers: RawLayer[]): RawLayer[] => layers.flatMap((l) => (l.type === 'group' ? flatten(l.layers ?? []) : [l]));

// reads a built map straight from public/maps, the same file the game fetches
export function readMap(file: string): TownMap {
  const json = JSON.parse(readFileSync(file, 'utf8')) as RawMap;
  const name = basename(file, '.json');
  const layers = flatten(json.layers ?? []);
  const width = json.width ?? 0;
  const height = json.height ?? 0;
  const ground = layers.find((l) => l.name === 'ground' && l.type === 'tilelayer')?.data ?? [];
  const collide = layers.find((l) => l.name === 'collide' && l.type === 'tilelayer')?.data ?? [];
  const solidGids = new Set(
    (json.tilesets ?? []).flatMap((ts) =>
      (ts.tiles ?? []).filter((t) => t.properties?.some((p) => p.name === 'ge_collide' && p.value === true)).map((t) => ts.firstgid + t.id),
    ),
  );
  const objectLayers = layers.filter((l) => l.type === 'objectgroup');
  const objects = objectLayers.flatMap((l) =>
    (l.objects ?? []).map((o) => ({
      name: o.name ?? '',
      layer: l.name,
      tile: { x: Math.floor((o.x ?? 0) / TILE), y: Math.floor((o.y ?? 0) / TILE) },
      w: Math.max(1, Math.round((o.width ?? 0) / TILE)),
      h: Math.max(1, Math.round((o.height ?? 0) / TILE)),
      props: Object.fromEntries((o.properties ?? []).map((p) => [p.name, String(p.value)])),
    })),
  );
  const walkable = (t: Tile) => {
    if (t.x < 0 || t.y < 0 || t.x >= width || t.y >= height) return false;
    const at = t.y * width + t.x;
    const gid = (ground[at] ?? 0) & GID_MASK;
    return gid !== 0 && (collide[at] ?? 0) === 0 && !solidGids.has(gid);
  };
  const spawn = (spawnName: string) => {
    const found = objects.find((o) => o.layer === 'warps' && o.name === spawnName);
    if (!found) throw new Error(`${name} has no spawn ${spawnName}`);
    return found.tile;
  };
  return { name, width, height, hasGround: ground.length > 0, objectLayers: objectLayers.map((l) => l.name), objects, walkable, spawn };
}

export const neighbors = (tile: Tile) => OFFSETS.map(([, dx, dy]) => ({ x: tile.x + dx, y: tile.y + dy }));

export const isWarp = (o: MapObject) => o.props.kind === 'warp';

export const isGate = (o: MapObject) => o.props.kind === 'gate';

// a warp with needs or unless only fires while its condition holds
export const warpIsActive = (o: MapObject, flags: ReadonlySet<string>) => isWarp(o) && isOpen(o.props, [...flags]);

// tiles a player can stand on after starting at `starts` while holding `flags`: NPCs and closed gates block, active warps are endpoints, and an active warp inside the same town hands over to its spawn tile
export function reachableTiles(map: TownMap, starts: Tile[], flags: ReadonlySet<string> = new Set()): Set<string> {
  const held = [...flags];
  const blocked = new Set(
    map.objects.filter((o) => o.layer === 'npcs' || (isGate(o) && !isOpen(o.props, held))).map((o) => key(o.tile)),
  );
  const warps = new Map(map.objects.filter((o) => warpIsActive(o, flags)).map((o) => [key(o.tile), o]));
  const spawns = new Map(map.objects.filter((o) => o.layer === 'warps' && !isWarp(o)).map((o) => [o.name, o.tile]));
  const seen = new Set(starts.map(key));
  const queue = [...starts];
  for (let tile = queue.shift(); tile; tile = queue.shift()) {
    const warp = warps.get(key(tile));
    if (warp) {
      const landing = warp.props.to === map.name ? spawns.get(warp.props.spawn ?? '') : undefined;
      if (landing && !seen.has(key(landing))) {
        seen.add(key(landing));
        queue.push(landing);
      }
      continue;
    }
    for (const next of neighbors(tile)) {
      if (seen.has(key(next)) || !map.walkable(next) || blocked.has(key(next))) continue;
      seen.add(key(next));
      queue.push(next);
    }
  }
  return seen;
}
