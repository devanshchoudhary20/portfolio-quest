import { factId } from '../../content';
import type { SpeciesId, TownId } from '../../content';
import { startBattle } from '../battle/controller';
import { WILD_BY_TOWN } from '../battle/data';
import { shouldEncounter } from '../battle/encounter';
import { isUiOpen, store, wildBugsOn } from '../../state/store';
import type { GridMover, Tile } from '../movement/GridMover';
import { zoneAt } from '../world/objects';
import type { WorldObject } from '../world/objects';

interface Hp {
  playerHp?: number;
  enemyHp?: number;
}

// tall grass: about one step in ten starts a fight, never within 15 steps of the last one
export class Wild {
  constructor(
    private readonly town: TownId,
    private readonly mover: GridMover,
    private readonly objects: WorldObject[],
    private readonly player: string,
    private readonly busy: () => boolean,
    // the player stops walking on their own before a fight: a tap walk or a robot walk would otherwise carry on
    private readonly halt: () => void,
  ) {}

  roll(tile: Tile) {
    const zone = zoneAt(this.objects, tile);
    const state = store.getState();
    if (!zone || this.busy() || isUiOpen(state) || !wildBugsOn(state)) return;
    if (shouldEncounter(state.steps, Math.random())) this.start(zone);
  }

  start(zone: WorldObject, species?: SpeciesId, hp: Hp = {}) {
    const roster = WILD_BY_TOWN[this.town] ?? [];
    const pick = species ?? roster[Math.floor(Math.random() * roster.length)];
    if (!pick) return;
    this.halt();
    this.mover.stop(this.player);
    const pool = (zone.props.pool ?? '').split(',').map((id) => id.trim()).filter(Boolean).map(factId);
    startBattle({ kind: 'wild', species: pick, pool, town: this.town, ...hp });
  }

  // test API only: a wild fight from this town's first grass zone
  force(species: SpeciesId, hp: Hp) {
    const zone = this.objects.find((o) => o.kind === 'grass');
    if (zone) this.start(zone, species, hp);
  }
}
