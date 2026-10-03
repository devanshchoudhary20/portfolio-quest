import type Phaser from 'phaser';
import { store } from '../../state/store';
import type { WorldRequest } from '../../state/store';
import { destinationById } from '../world/destinations';
import { notOpenYet } from '../world/lines';
import { isBuiltTown } from '../world/towns';

// a cached or quick load never flashes the travel card
const SLOW_LOAD_MS = 300;

interface Hooks {
  // fade out, then run; the scene is busy until it restarts
  fadeThen: (leave: () => void) => void;
  // start the robot's walk to a named object in this map; false when the map has no such object
  walkTo: (name: string | undefined) => boolean;
  busy: () => boolean;
}

// everything about getting to a town: the load card and its error, Retry and Back, the closed road, and the robot's cross-town trips
export class Travel {
  failed = false;
  private progress = 0;
  private cardShown = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly request: WorldRequest,
    private readonly hooks: Hooks,
  ) {}

  // the one place a town (re)starts, so every caller passes a typed request
  go(request: WorldRequest) {
    this.scene.scene.restart(request);
  }

  // the card shows only when the load is slow, with live progress
  trackLoad() {
    this.scene.load.on('loaderror', () => {
      this.failed = true;
    });
    this.scene.load.on('progress', (value: number) => {
      this.progress = value;
      if (this.cardShown) this.card();
    });
    this.timer = setTimeout(() => {
      this.cardShown = true;
      this.card();
    }, SLOW_LOAD_MS);
  }

  loaded() {
    clearTimeout(this.timer);
  }

  closedRoad(to: string, after?: 'stepBack') {
    store.getState().actions.openDialog({ speaker: '', portrait: null, lines: [notOpenYet(to)], ...(after ? { after } : {}) });
  }

  card() {
    store.getState().actions.setTravel({ status: 'loading', town: this.request.town, progress: this.progress, canGoBack: false, choice: null });
  }

  // drop the half-loaded keys so Retry fetches again; Back returns to the tile the player warped from; a robot trip that failed is over
  error() {
    const { town, from } = this.request;
    this.scene.cache.tilemap.remove(`map-${town}`);
    if (this.scene.textures.exists(`tiles-${town}`)) this.scene.textures.remove(`tiles-${town}`);
    const { actions } = store.getState();
    actions.setNav(null);
    actions.setTravel({ status: 'error', town, progress: 0, canGoBack: Boolean(from), choice: null });
  }

  // the travel card only records a choice; the scene restarts the town
  watchChoice() {
    return store.subscribe((state) => {
      const choice = state.travel?.choice;
      if (!choice) return;
      const { from } = this.request;
      store.getState().actions.setTravel(null);
      this.go(choice === 'back' && from ? from : this.request);
    });
  }

  // the robot asked for a destination: another town goes through the normal warp, this map is walked
  watchNav() {
    return store.subscribe((state, prev) => {
      if (state.nav && state.nav !== prev.nav && !this.hooks.busy()) this.resumeNav();
    });
  }

  resumeNav() {
    const { nav, actions } = store.getState();
    const dest = nav ? destinationById(nav) : undefined;
    if (!dest) {
      if (nav) actions.setNav(null);
      return;
    }
    if (!isBuiltTown(dest.town)) {
      actions.setNav(null);
      this.closedRoad(dest.town);
    } else if (dest.town !== this.request.town) this.hooks.fadeThen(() => this.go({ town: dest.town, from: this.request }));
    else if (!this.hooks.walkTo(dest.at)) actions.setNav(null);
  }
}
