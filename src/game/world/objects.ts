import type Phaser from 'phaser';

export type ObjectKind = 'npc' | 'sign' | 'item' | 'warp' | 'door' | 'spawn' | 'gate' | 'grass';

export interface WorldObject {
  name: string;
  kind: ObjectKind;
  x: number;
  y: number;
  // size in tiles; only a grass zone is more than one
  w: number;
  h: number;
  props: Record<string, string>;
}

const LAYERS = ['npcs', 'signs', 'items', 'warps', 'gates', 'encounters'];

// Tiled stores object positions in pixels
export function readObjects(map: Phaser.Tilemaps.Tilemap): WorldObject[] {
  return LAYERS.flatMap((layerName) =>
    (map.getObjectLayer(layerName)?.objects ?? []).map((obj) => {
      const props = Object.fromEntries(
        ((obj.properties ?? []) as { name: string; value: unknown }[]).map((p) => [p.name, String(p.value)]),
      );
      return {
        name: obj.name,
        kind: (props.kind ?? 'sign') as ObjectKind,
        x: Math.floor((obj.x ?? 0) / map.tileWidth),
        y: Math.floor((obj.y ?? 0) / map.tileHeight),
        w: Math.max(1, Math.round((obj.width ?? 0) / map.tileWidth)),
        h: Math.max(1, Math.round((obj.height ?? 0) / map.tileHeight)),
        props,
      };
    }),
  );
}

export const objectAt = (objects: WorldObject[], tile: { x: number; y: number }, kinds: ObjectKind[]) =>
  objects.find((o) => o.x === tile.x && o.y === tile.y && kinds.includes(o.kind));

// the grass zone under a tile, if any
export const zoneAt = (objects: WorldObject[], tile: { x: number; y: number }) =>
  objects.find((o) => o.kind === 'grass' && tile.x >= o.x && tile.x < o.x + o.w && tile.y >= o.y && tile.y < o.y + o.h);
