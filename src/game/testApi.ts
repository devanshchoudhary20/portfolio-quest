import type Phaser from 'phaser';
import { flagId, speciesId, townId } from '../content';
import type { TownKey } from '../content';
import { store } from '../state/store';
import { closeBattle } from './battle/controller';
import { enemyOf } from './battle/engine';
import { battleLine, bgOf } from './battle/session';
import type { Battle } from './scenes/Battle';
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
    starter: s.starter ?? null,
    caught: s.caught,
    flags: s.flags,
    seen: s.seen,
    playSeconds: s.playSeconds,
    loops: s.loops,
    held: s.held,
    panel: s.panel,
    battle: s.battle && {
      phase: s.battle.state.phase,
      turn: s.battle.state.turn,
      enemy: enemyOf(s.battle.state).species,
      bg: bgOf(s.battle.request),
      enemyHp: enemyOf(s.battle.state).hp,
      playerHp: s.battle.state.player.hp,
      shown: s.battle.shown,
      line: battleLine(s.battle),
      pending: s.battle.index < s.battle.lines.length,
    },
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
    maze() {
      return (game.scene.getScene('Overworld') as Overworld).mazeInfo();
    },
    encounter(species: string, hp: { playerHp?: number; enemyHp?: number } = {}) {
      (game.scene.getScene('Overworld') as Overworld).forceWild(speciesId(species), hp);
    },
    // a battle part on screen: its rectangle in CSS pixels, and a switch to hide it
    battlePart(part: 'bg' | 'enemy' | 'player' | 'trainer', visible?: boolean) {
      const scene = game.scene.getScene('Battle') as Battle;
      const found = scene.testPart(part);
      if (!found) return null;
      if (visible !== undefined) found.setVisible(visible);
      const camera = scene.cameras.main;
      const rect = game.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const toClient = (x: number, y: number) => ({ x: rect.left + ((x - camera.worldView.x) * camera.zoom) / dpr, y: rect.top + ((y - camera.worldView.y) * camera.zoom) / dpr });
      const from = toClient(found.x, found.y);
      const to = toClient(found.x + found.width, found.y + found.height);
      return { x: from.x, y: from.y, width: to.x - from.x, height: to.y - from.y, alpha: found.alpha };
    },
    closeBattle: () => closeBattle(),
    grant: (flag: string) => store.getState().actions.addFlag(flagId(flag)),
    // tweens in flight plus camera fades running, across the active scenes: zero means nothing on the canvas is moving by itself
    motion: () =>
      game.scene.getScenes(true).reduce((sum, scene) => sum + scene.tweens.getTweens().length + (scene.cameras.main.fadeEffect.isRunning ? 1 : 0), 0),
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
      closeBattle: () => void;
      grant: (flag: string) => void;
      motion: () => number;
      encounter: (species: string, hp?: { playerHp?: number; enemyHp?: number }) => void;
      battlePart: (part: 'bg' | 'enemy' | 'player' | 'trainer', visible?: boolean) => { x: number; y: number; width: number; height: number; alpha: number } | null;
      maze: () => ReturnType<Overworld['mazeInfo']>;
      stand: (x: number, y: number, facing: Dir) => void;
      tileToClient: (x: number, y: number) => { x: number; y: number };
    };
  }
}
