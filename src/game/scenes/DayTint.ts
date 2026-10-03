import type Phaser from 'phaser';
import { timeBand } from '../../state/timeBand';
import type { TimeBand } from '../../state/timeBand';

const TINTS: Record<TimeBand, { color: number; alpha: number; blend: string } | null> = {
  day: null,
  dusk: { color: 0xe8793a, alpha: 0.2, blend: 'NORMAL' },
  night: { color: 0x1b2a6e, alpha: 0.55, blend: 'MULTIPLY' },
};

// the visitor's clock tints the outdoor world; interiors skip it
export class DayTint {
  private readonly rect: Phaser.GameObjects.Rectangle | null;

  constructor(private readonly scene: Phaser.Scene) {
    const config = TINTS[timeBand()];
    this.rect = config ? scene.add.rectangle(0, 0, 1, 1, config.color, config.alpha).setDepth(1_000_000).setBlendMode(config.blend) : null;
  }

  sync(indoor: boolean) {
    if (!this.rect) return;
    this.rect.setVisible(!indoor);
    const view = this.scene.cameras.main.worldView;
    this.rect.setPosition(view.centerX, view.centerY).setSize(view.width + 64, view.height + 64);
  }
}
