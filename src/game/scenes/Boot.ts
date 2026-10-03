import Phaser from 'phaser';
import { store } from '../../state/store';
import { parseWarpParam } from '../world/towns';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { actions } = store.getState();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    actions.setReducedMotion(reduced.matches);
    reduced.addEventListener('change', (event) => actions.setReducedMotion(event.matches));

    actions.setPendingWarp(parseWarpParam(location.search));
    this.scene.start('Preload');
  }
}
