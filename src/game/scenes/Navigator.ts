import type { TownId } from '../../content';
import { store } from '../../state/store';
import type { GridMover, Tile, WalkResult } from '../movement/GridMover';
import { ROBOT_LOCKED, ROBOT_LOST } from '../world/lines';
import type { WorldObject } from '../world/objects';
import { planStops } from '../world/route';
import type { Region } from '../world/regions';
import type { Gates } from './Gates';

// a loop warp on the way would send the robot round forever
const MAX_HOPS = 12;

const same = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y;

// the KaneAI robot's legs: walks the player to a tile in this map, through any open doors on the way, and says why when it cannot
export class Navigator {
  private goal: Tile | null = null;
  private hops = 0;

  constructor(
    private readonly mover: GridMover,
    private readonly objects: WorldObject[],
    private readonly regions: Region[],
    private readonly town: TownId,
    private readonly player: string,
    private readonly gates: Gates,
    private readonly onDone: (goal: Tile) => void,
  ) {}

  get active() {
    return this.goal !== null;
  }

  begin(goal: Tile) {
    this.goal = goal;
    this.hops = 0;
    this.step();
  }

  // the player took over (a key, a tap): drop the walk without a word
  cancel() {
    if (!this.goal) return;
    this.goal = null;
    store.getState().actions.setNav(null);
  }

  // called after every arrival through a door, so the plan always starts from where the player stands
  step() {
    const goal = this.goal;
    if (!goal) return;
    const here = this.mover.position(this.player);
    const stops = planStops(this.objects, this.regions, this.town, here, goal, store.getState().flags, this.gates.closedTiles());
    this.hops += 1;
    if (!stops || this.hops > MAX_HOPS) {
      this.fail();
      return;
    }
    const stop = stops[0];
    if (!stop && same(here, goal)) {
      this.finish(goal);
      return;
    }
    const hop = this.hops;
    // an NPC's own tile cannot be stood on: the closest tile beside it is the goal
    const onNpc = this.objects.some((o) => o.kind === 'npc' && same(o, goal));
    this.mover.moveTo(this.player, stop ? { x: stop.x, y: stop.y } : goal, (result) => this.walked(hop, result, Boolean(stop)), !onNpc);
  }

  private walked(hop: number, result: WalkResult, towardDoor: boolean) {
    const goal = this.goal;
    if (!goal || this.hops !== hop || result === 'stopped') return;
    if (result === 'blocked') this.fail();
    // a door fires its own warp, which calls step() again
    else if (towardDoor) return;
    else if (this.near(goal)) this.finish(goal);
    else this.fail();
  }

  // on the goal, or on a neighbouring tile when the goal is an NPC
  private near(goal: Tile) {
    const here = this.mover.position(this.player);
    return Math.abs(here.x - goal.x) + Math.abs(here.y - goal.y) <= 1;
  }

  // a locked road and a lost one get different lines
  private fail() {
    const locked = this.gates.closedTiles().length > 0;
    this.goal = null;
    this.mover.stop(this.player);
    const { actions } = store.getState();
    actions.setNav(null);
    actions.openDialog({ speaker: 'KaneAI Robot', portrait: null, lines: [locked ? ROBOT_LOCKED : ROBOT_LOST] });
  }

  private finish(goal: Tile) {
    this.goal = null;
    store.getState().actions.setNav(null);
    this.onDone(goal);
  }
}
