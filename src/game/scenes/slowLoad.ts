import type Phaser from 'phaser';

// a cached or quick load never flashes the loader card
const SLOW_LOAD_MS = 300;

// calls show(progress) once a scene's load runs past 300 ms and on every progress tick after; returns a stop that cancels the card timer
export function trackSlowLoad(scene: Phaser.Scene, show: (progress: number) => void, onError?: () => void): () => void {
  let progress = 0;
  let visible = false;
  scene.load.on('loaderror', () => onError?.());
  scene.load.on('progress', (value: number) => {
    progress = value;
    if (visible) show(progress);
  });
  const timer = setTimeout(() => {
    visible = true;
    show(progress);
  }, SLOW_LOAD_MS);
  return () => clearTimeout(timer);
}
