import type { Tile } from '../movement/GridMover';
import type { FlagId, TownId } from '../../content';
import { isOpen } from './conditions';
import type { WorldObject } from './objects';
import { inRegion } from './regions';
import type { Region } from './regions';

const OUTSIDE = -1;

// the warps to step on, in order, to get from one tile to another inside one map. Regions are the areas a player can walk between freely; an open warp joins the region it stands in to the region of its spawn. Empty when both tiles share a region, null when no chain of open warps connects them; a warp buried under a closed gate does not count
export function planStops(objects: WorldObject[], regions: Region[], town: TownId, from: Tile, goal: Tile, flags: readonly FlagId[], closed: readonly Tile[] = []): WorldObject[] | null {
  const areaOf = (tile: Tile) => regions.findIndex((r) => inRegion(r, tile));
  const edges = objects.flatMap((warp) => {
    if (warp.kind !== 'warp' || warp.props.to !== town || !isOpen(warp.props, flags) || closed.some((t) => t.x === warp.x && t.y === warp.y)) return [];
    const landing = objects.find((o) => o.name === warp.props.spawn && (o.kind === 'spawn' || o.kind === 'door'));
    return landing ? [{ warp, from: areaOf(warp), to: areaOf(landing) }] : [];
  });
  const start = areaOf(from);
  const end = areaOf(goal);
  const via = new Map<number, WorldObject[]>([[start, []]]);
  const queue = [start];
  for (let area = queue.shift(); area !== undefined; area = queue.shift()) {
    const path = via.get(area) ?? [];
    for (const edge of edges.filter((e) => e.from === area && !via.has(e.to) && e.to !== OUTSIDE)) {
      via.set(edge.to, [...path, edge.warp]);
      queue.push(edge.to);
    }
  }
  return via.get(end) ?? null;
}
