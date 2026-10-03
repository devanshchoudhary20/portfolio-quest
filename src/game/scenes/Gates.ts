import type { FlagId } from '../../content';
import type { GridMover, Tile } from '../movement/GridMover';
import { isOpen } from '../world/conditions';
import type { WorldObject } from '../world/objects';

interface TileArt {
  removeTileAt: (x: number, y: number) => unknown;
}

// flag-driven world state: a gate blocks its tile until its needs flags are held, then opens for good; a picked-up item loses its tile art. Both arts are tiles in the things layer
export class Gates {
  private readonly gates: WorldObject[];
  private readonly pickups: WorldObject[];
  private readonly closed = new Set<string>();

  constructor(
    private readonly mover: GridMover,
    private readonly art: TileArt | null,
    objects: WorldObject[],
    flags: readonly FlagId[],
  ) {
    this.gates = objects.filter((o) => o.kind === 'gate');
    this.pickups = objects.filter((o) => o.kind === 'item' && o.props.flag !== undefined);
    for (const gate of this.gates) {
      if (isOpen(gate.props, flags)) continue;
      this.closed.add(gate.name);
      this.mover.addBlocker(`gate:${gate.name}`, gate);
    }
    this.sync(flags);
  }

  // the tiles gates still hold shut, so a planner can tell a locked road from a lost one
  closedTiles(): Tile[] {
    return this.gates.filter((gate) => this.closed.has(gate.name)).map((gate) => ({ x: gate.x, y: gate.y }));
  }

  sync(flags: readonly FlagId[]) {
    for (const gate of this.gates) {
      if (!isOpen(gate.props, flags)) continue;
      this.closed.delete(gate.name);
      this.mover.remove(`gate:${gate.name}`);
      this.art?.removeTileAt(gate.x, gate.y);
    }
    for (const item of this.pickups) if (flags.some((flag) => flag === item.props.flag)) this.art?.removeTileAt(item.x, item.y);
  }
}
