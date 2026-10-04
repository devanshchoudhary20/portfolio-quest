import Phaser from 'phaser';
import { store } from '../../state/store';
import type { State } from '../../state/store';
import { artFor, backArt, bgArt, frontArt, trainerArt } from '../battle/art';
import { closeBattle } from '../battle/controller';
import { bgOf, trainerFor } from '../battle/session';
import type { BattleUi } from '../battle/session';
import { BATTLE_FROZE, LOADING_BATTLE } from '../world/lines';
import { DayTint } from './DayTint';
import { trackSlowLoad } from './slowLoad';

// the battle is composed on a 320 x 180 canvas, as the frame is drawn; a taller view stretches only the background
const COMPOSITION = { w: 320, h: 180 };
// the background art carries its own platforms; these are their feet
const ENEMY_AT = { x: 249, y: 79 };
const PLAYER_AT = { x: 91, y: 133 };
const SLIDE_PX = 140;
const SLIDE_MS = 320;
const HP_MS = 450;
const FAINT_MS = 420;
const ORB_ENEMY = 0xc8493f;
const ORB_PLAYER = 0x3cc6e8;

type Figure = Phaser.GameObjects.Image | Phaser.GameObjects.Arc;

// Phaser draws the sprites, the background and the HP tween; the DOM overlay draws every word
export class Battle extends Phaser.Scene {
  private cleanups: (() => void)[] = [];
  private stopCard: (() => void) | undefined;
  private tint: DayTint | null = null;
  private backdrop: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null = null;
  private enemy: Figure | null = null;
  private player: Figure | null = null;
  private trainer: Figure | null = null;
  private hp = { player: 0, enemy: 0 };
  private shownRounded = { player: -1, enemy: -1 };
  private seen = { turn: 0, slotOut: -1, enemyOut: false, playerHp: -1, enemyHp: -1 };

  constructor() {
    super('Battle');
  }

  init() {
    this.cleanups = [];
    this.stopCard = undefined;
    this.enemy = this.player = this.trainer = this.backdrop = null;
    this.seen = { turn: 0, slotOut: -1, enemyOut: false, playerHp: -1, enemyHp: -1 };
    // registered here, not in create(), so a battle that closes while its art loads still clears the card
    this.events.once('shutdown', () => {
      this.clearCard();
      this.cleanups.forEach((fn) => fn());
    });
  }

  preload() {
    const ui = store.getState().battle;
    if (!ui) return;
    const files = artFor(ui.request, ui.state.player.species).filter((file) => !this.textures.exists(file.key));
    if (files.length === 0) return;
    // a file that fails leaves its texture missing, and create() draws an orb in its place
    for (const file of files) this.load.image(file.key, file.url);
    this.stopCard = trackSlowLoad(this, (progress) => {
      store.getState().actions.setTravel({ status: 'loading', town: store.getState().town, progress, canGoBack: false, choice: null, label: LOADING_BATTLE });
    });
  }

  create() {
    this.clearCard();
    const ui = store.getState().battle;
    if (!ui) return;
    try {
      this.compose(ui);
      // from here on the battle takes input
      const current = store.getState().battle;
      if (current) store.getState().actions.setBattle({ ...current, ready: true });
    } catch (error) {
      console.error(error);
      closeBattle();
      store.getState().actions.openDialog({ speaker: '', portrait: null, lines: [BATTLE_FROZE] });
    }
  }

  update() {
    this.tint?.sync(false);
  }

  private clearCard() {
    this.stopCard?.();
    this.stopCard = undefined;
    if (store.getState().travel?.label) store.getState().actions.setTravel(null);
  }

  private compose(ui: BattleUi) {
    const camera = this.cameras.main;
    this.layout(store.getState().stage.scale);
    this.addBackdrop(ui);
    this.hp = { ...ui.shown };
    this.shownRounded = { player: Math.round(ui.shown.player), enemy: Math.round(ui.shown.enemy) };

    const playerId = ui.state.player.species;
    this.player = this.figure(backArt(playerId).key, PLAYER_AT, ORB_PLAYER);
    const trainer = trainerFor(ui.request);
    if (trainer) this.trainer = this.figure(trainerArt(trainer.id).key, ENEMY_AT, ORB_ENEMY);
    this.slideIn(this.player, -SLIDE_PX);
    if (this.trainer) this.slideIn(this.trainer, SLIDE_PX);

    this.tint = new DayTint(this);
    camera.setBackgroundColor('#0f111a');
    this.cleanups.push(
      store.subscribe((state, prev) => {
        if (state.stage !== prev.stage) this.layout(state.stage.scale);
        // the hp tween writes the store too, so only a change of the fight itself is news
        const fight = state.battle;
        const changed = fight?.state !== prev.battle?.state || fight?.enemyOut !== prev.battle?.enemyOut || fight?.slotOut !== prev.battle?.slotOut;
        if (fight && changed) this.sync(state);
      }),
    );
    this.sync(store.getState());
  }

  // zoom to the integer scale the overlay uses, and keep the composition centered
  private layout(scale: number) {
    const camera = this.cameras.main;
    camera.setZoom(scale);
    camera.centerOn(COMPOSITION.w / 2, COMPOSITION.h / 2);
    if (!this.backdrop) return;
    const cover = Math.max(1, camera.width / scale / COMPOSITION.w, camera.height / scale / COMPOSITION.h);
    this.backdrop.setScale(cover);
  }

  private addBackdrop(ui: BattleUi) {
    const key = bgArt(bgOf(ui.request)).key;
    const drawn = this.textures.exists(key);
    this.backdrop = drawn
      ? this.add.image(COMPOSITION.w / 2, COMPOSITION.h / 2, key)
      : this.add.rectangle(COMPOSITION.w / 2, COMPOSITION.h / 2, COMPOSITION.w, COMPOSITION.h, 0x5ca84a);
    this.backdrop.setDepth(-10);
    if (!drawn) this.addPlatforms();
    this.layout(store.getState().stage.scale);
  }

  private addPlatforms() {
    const rim = 0x4a9a3f;
    const sand = 0xd9c68c;
    const draw = this.add.graphics().setDepth(-5);
    for (const [at, w, h] of [
      [ENEMY_AT, 88, 22],
      [PLAYER_AT, 100, 24],
    ] as const) {
      draw.fillStyle(rim).fillEllipse(at.x, at.y - 2, w + 6, h + 4);
      draw.fillStyle(sand).fillEllipse(at.x, at.y - 2, w, h);
    }
  }

  // the art when it loaded, a colored orb when it did not
  private figure(key: string, at: { x: number; y: number }, orb: number): Figure {
    if (this.textures.exists(key)) return this.add.image(at.x, at.y, key).setOrigin(0.5, 1);
    return this.add.circle(at.x, at.y - 24, 24, orb);
  }

  // test API only: a drawn part's bounds in native pixels, and a switch to hide it so a screenshot diff proves it was drawn
  testPart(part: 'bg' | 'enemy' | 'player' | 'trainer') {
    const object = { bg: this.backdrop, enemy: this.enemy, player: this.player, trainer: this.trainer }[part];
    if (!object) return null;
    const box = object.getBounds();
    return { x: box.x, y: box.y, width: box.width, height: box.height, alpha: object.alpha, setVisible: (on: boolean) => object.setVisible(on) };
  }

  private reduced() {
    return store.getState().reducedMotion;
  }

  private slideIn(figure: Figure, from: number) {
    if (this.reduced()) return;
    const to = figure.x;
    figure.x = to + from;
    this.tweens.add({ targets: figure, x: to, duration: SLIDE_MS, ease: 'Sine.easeOut' });
  }

  private faint(figure: Figure | null) {
    if (!figure) return;
    if (this.reduced()) figure.setVisible(false);
    else this.tweens.add({ targets: figure, y: figure.y + 24, alpha: 0, duration: FAINT_MS });
  }

  private shake(figure: Figure | null) {
    if (!figure || this.reduced()) return;
    this.tweens.add({ targets: figure, x: figure.x + 4, duration: 60, yoyo: true, repeat: 2 });
  }

  // tweens the on-screen hp toward the battle's hp; the overlay redraws its bars from the store, and only when a whole point changes
  private moveHp(side: 'player' | 'enemy', to: number) {
    // under reduced motion the controller has already put the bars where they belong
    if (store.getState().reducedMotion) {
      this.hp[side] = to;
      this.shownRounded[side] = Math.round(to);
      return;
    }
    const publish = (value: number, force = false) => {
      this.hp[side] = value;
      if (!force && Math.round(value) === this.shownRounded[side]) return;
      this.shownRounded[side] = Math.round(value);
      store.getState().actions.setShown({ ...this.hp });
    };
    this.tweens.addCounter({
      from: this.hp[side],
      to,
      duration: HP_MS,
      onUpdate: (counter) => publish(counter.getValue() ?? to),
      onComplete: () => publish(to, true),
    });
  }

  private sync(state: State) {
    const ui = state.battle;
    if (!ui) return;
    // a retry hands over a fresh battle: draw both sides again
    if (ui.state.turn === 0 && this.seen.turn > 0) this.reset(ui);
    const out = ui.state.party[ui.slotOut];
    if (!out) return;
    const last = this.seen;
    this.seen = { turn: ui.state.turn, slotOut: ui.slotOut, enemyOut: ui.enemyOut, playerHp: ui.state.player.hp, enemyHp: out.hp };
    // the old bug faints and drains first; the next one shows when the narration sends it out
    if (last.enemyHp !== -1 && last.slotOut === ui.slotOut && out.hp < last.enemyHp) {
      this.shake(this.enemy);
      if (out.hp === 0) this.faint(this.enemy);
    }
    if (last.slotOut !== -1 && last.slotOut === ui.slotOut && out.hp !== last.enemyHp) this.moveHp('enemy', out.hp);
    if (last.playerHp !== -1 && ui.state.player.hp < last.playerHp) {
      this.shake(this.player);
      if (ui.state.player.hp === 0) this.faint(this.player);
    }
    if (ui.state.player.hp !== last.playerHp && last.playerHp !== -1) this.moveHp('player', ui.state.player.hp);
    if (ui.enemyOut && (!last.enemyOut || last.slotOut !== ui.slotOut)) this.showEnemy(ui);
  }

  private showEnemy(ui: BattleUi) {
    this.trainer?.setVisible(false);
    this.enemy?.destroy();
    const out = ui.state.party[ui.slotOut];
    if (!out) return;
    this.enemy = this.figure(frontArt(out.species).key, ENEMY_AT, ORB_ENEMY);
    this.slideIn(this.enemy, SLIDE_PX);
    this.hp.enemy = out.hp;
    this.shownRounded.enemy = Math.round(out.hp);
    store.getState().actions.setShown({ ...this.hp });
  }

  private reset(ui: BattleUi) {
    // a bar still draining from the lost fight must not write into the new one
    this.tweens.killAll();
    for (const figure of [this.player, this.enemy, this.trainer]) figure?.destroy();
    this.enemy = this.trainer = null;
    this.player = this.figure(backArt(ui.state.player.species).key, PLAYER_AT, ORB_PLAYER);
    this.slideIn(this.player, -SLIDE_PX);
    const trainer = trainerFor(ui.request);
    if (trainer) this.trainer = this.figure(trainerArt(trainer.id).key, ENEMY_AT, ORB_ENEMY);
    this.hp = { ...ui.shown };
    this.shownRounded = { player: Math.round(ui.shown.player), enemy: Math.round(ui.shown.enemy) };
    this.seen = { turn: 0, slotOut: -1, enemyOut: false, playerHp: -1, enemyHp: -1 };
  }
}
