import Phaser from 'phaser';
import { CHUNK_SHARE, store } from '../../state/store';
import { NPC_SPRITES, npcSheetUrl } from '../world/npcSprites';

const FRAME = { frameWidth: 16, frameHeight: 16 };

export class Preload extends Phaser.Scene {
  // Phaser keeps emitting progress after a failed file, so a later success must not undo the error
  private failed = false;

  constructor() {
    super('Preload');
  }

  preload() {
    const { actions } = store.getState();
    this.failed = false;
    this.load.on('progress', (value: number) => {
      if (!this.failed) actions.setLoad('loading', CHUNK_SHARE + value * (100 - CHUNK_SHARE));
    });
    this.load.on('loaderror', () => {
      this.failed = true;
      actions.setLoad('error');
    });
    this.load.spritesheet('player', '/assets/avatar/devansh-walk-sheet-64x64.png', FRAME);
    this.load.spritesheet('maze', '/assets/ninja-adventure/maze-sheet.png', FRAME);
    for (const key of NPC_SPRITES) this.load.spritesheet(`npc-${key}`, npcSheetUrl(key), FRAME);
  }

  create() {
    if (!this.failed) store.getState().actions.setLoad('ready', 100);
  }
}
