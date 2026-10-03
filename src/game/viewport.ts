import type Phaser from 'phaser';
import { store } from '../state/store';

// Native view per art-direction.md: 320x180 landscape, 240+ wide x 160..288 tall portrait, always an integer device-pixel scale.
const TILE = 16;
const CONTROLS_RESERVE = 400;
const TOP_BAR = 64;
const MIN_PORTRAIT_W = 240;

export interface View {
  scale: number;
  nativeW: number;
  nativeH: number;
  dpr: number;
  // CSS rectangle of the game canvas; the HUD hangs off it
  left: number;
  top: number;
  width: number;
  height: number;
}

// integer scale of the 320x180 landscape view in the given CSS box
export const landscapeScale = (width: number, height: number) => Math.max(1, Math.floor(Math.min(width / 320, height / 180)));

export const isCoarsePointer = () => matchMedia('(pointer: coarse)').matches;

export function computeView(cssW: number, cssH: number, dpr: number, coarse: boolean): View {
  const devW = Math.round(cssW * dpr);
  const devH = Math.round(cssH * dpr);
  const portrait = cssH > cssW;
  let scale: number;
  let nativeW: number;
  let nativeH: number;
  if (portrait) {
    scale = Math.max(1, Math.floor(devW / MIN_PORTRAIT_W));
    // the largest whole-tile width at this scale, so the view fills the screen width
    nativeW = Math.max(MIN_PORTRAIT_W, Math.floor(devW / scale / TILE) * TILE);
    const room = devH - (TOP_BAR + (coarse ? CONTROLS_RESERVE : 0)) * dpr;
    nativeH = Math.min(288, Math.max(160, Math.floor(room / scale / TILE) * TILE));
  } else {
    scale = landscapeScale(devW, devH);
    nativeW = 320;
    nativeH = 180;
  }
  const left = Math.floor((devW - nativeW * scale) / 2);
  const top = portrait ? TOP_BAR * dpr : Math.floor((devH - nativeH * scale) / 2);
  return { scale, nativeW, nativeH, dpr, left: left / dpr, top: Math.max(0, top) / dpr, width: (nativeW * scale) / dpr, height: (nativeH * scale) / dpr };
}

export function viewSize() {
  const dpr = window.devicePixelRatio || 1;
  const view = computeView(window.innerWidth, window.innerHeight, dpr, isCoarsePointer());
  return { view, devW: Math.round(view.nativeW * view.scale), devH: Math.round(view.nativeH * view.scale) };
}

// Phaser draws device pixels into a canvas that CSS shrinks back to its view rectangle
export function followViewport(game: Phaser.Game, container: HTMLElement) {
  const fit = () => {
    const { view, devW, devH } = viewSize();
    game.scale.setZoom(1 / view.dpr);
    game.scale.resize(devW, devH);
    const rect = { left: `${view.left}px`, top: `${view.top}px`, width: `${view.width}px`, height: `${view.height}px` };
    Object.assign(container.style, rect);
    Object.assign(game.canvas.style, { width: rect.width, height: rect.height });
    store.getState().actions.setStage({
      left: view.left,
      top: view.top,
      width: view.width,
      height: view.height,
      px: view.scale / view.dpr,
      scale: view.scale,
    });
  };
  // resize, orientationchange and visualViewport fire in bursts: fit once per frame, and only when the box changed
  let frame = 0;
  let last = '';
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const key = `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`;
      if (key === last) return;
      last = key;
      fit();
    });
  };
  const listen = (target: EventTarget, name: string) => target.addEventListener(name, schedule);
  listen(window, 'resize');
  listen(window, 'orientationchange');
  if (window.visualViewport) listen(window.visualViewport, 'resize');
  last = `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`;
  fit();
}
