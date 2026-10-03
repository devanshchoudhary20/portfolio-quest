import Phaser from 'phaser';
import { mountUi } from '../ui/mount';
import { store } from '../state/store';
import { startKeyboard } from './input/keyboard';
import { movementPlugin } from './movement/GridMover';
import { Boot } from './scenes/Boot';
import { Overworld } from './scenes/Overworld';
import { Preload } from './scenes/Preload';
import { followViewport, viewSize } from './viewport';
import { startAutosave } from './world/autosave';
import { installTestApi } from './testApi';

export function createGame() {
  const parent = document.getElementById('game')!;
  startKeyboard();
  startAutosave();
  mountUi(document.getElementById('ui')!);

  const { view, devW, devH } = viewSize();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: devW,
    height: devH,
    pixelArt: true,
    backgroundColor: '#0f111a',
    // no audio context before a user gesture
    audio: { noAudio: true },
    input: { keyboard: false },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / view.dpr },
    scene: [Boot, Preload, Overworld],
    plugins: { scene: [movementPlugin] },
  });

  followViewport(game, parent);
  store.subscribe((state, prev) => {
    if (state.phase === 'play' && prev.phase !== 'play' && state.world) game.scene.start('Overworld', state.world);
  });
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') installTestApi(game);
  return game;
}
