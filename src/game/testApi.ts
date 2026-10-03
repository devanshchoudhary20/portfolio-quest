import type Phaser from 'phaser';
import { townId } from '../content';
import type { TownKey } from '../content';
import { store } from '../state/store';
import type { Overworld } from './scenes/Overworld';
import type { Dir } from './world/save';

const HOLD_MS = 70;
const POLL_MS = 20;
const STEP_TIMEOUT_MS = 1500;
const SETTLE_MS = 60;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function snapshot() {
  const s = store.getState();
  return {
    phase: s.phase,
    town: s.town,
    pos: s.pos,
    facing: s.facing,
    mode: s.mode,
    flags: s.flags,
    seen: s.seen,
    panel: s.panel,
    dialog: s.dialog ? { speaker: s.dialog.speaker, text: s.dialog.lines[s.dialog.index] ?? '' } : null,
  };
}

// dev and test builds only: Playwright drives the game through this instead of pixels
export function installTestApi(game: Phaser.Game) {
  window.__pq = {
    state: snapshot,
    interact: () => store.getState().actions.pressA(),
    async walk(dir: Dir, tiles = 1) {
      const { actions } = store.getState();
      for (let i = 0; i < tiles; i++) {
        const from = store.getState().pos;
        // a tap long enough for one frame poll, released before the next tile can queue
        actions.setHeld(dir);
        await wait(HOLD_MS);
        actions.setHeld(null);
        const started = Date.now();
        while (store.getState().pos === from && Date.now() - started < STEP_TIMEOUT_MS) await wait(POLL_MS);
        await wait(SETTLE_MS);
      }
      return snapshot();
    },
    tileToClient(x: number, y: number) {
      const camera = game.scene.getScene('Overworld').cameras.main;
      const rect = game.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: rect.left + ((x * 16 + 8 - camera.worldView.x) * camera.zoom) / dpr,
        y: rect.top + ((y * 16 + 8 - camera.worldView.y) * camera.zoom) / dpr,
      };
    },
    stand(x: number, y: number, facing: Dir) {
      (game.scene.getScene('Overworld') as Overworld).stand({ x, y }, facing);
    },
    warp(town: string, spawn?: string) {
      const { phase, actions } = store.getState();
      const world = { town: townId(town as TownKey), ...(spawn ? { spawn } : {}) };
      if (phase === 'play') game.scene.getScene('Overworld').scene.restart(world);
      else actions.warpGame(world);
    },
  };
}

declare global {
  interface Window {
    __pq?: {
      state: () => ReturnType<typeof snapshot>;
      interact: () => void;
      walk: (dir: Dir, tiles?: number) => Promise<ReturnType<typeof snapshot>>;
      warp: (town: string, spawn?: string) => void;
      stand: (x: number, y: number, facing: Dir) => void;
      tileToClient: (x: number, y: number) => { x: number; y: number };
    };
  }
}
