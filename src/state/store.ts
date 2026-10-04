import { createStore } from 'zustand/vanilla';
import { factById } from '../content';
import type { DestId, FactId, FlagId, SpeciesId, TownId } from '../content';
import type { BattleRequest, BattleUi } from '../game/battle/session';
import { BADGES_THREE, BADGES_THREE_COUNT, SEEN_TEN, SEEN_TEN_COUNT, countBadges } from '../game/world/conditions';
import { factText } from '../game/world/factText';
import type { Dir, Mode, SaveV1, Starter } from '../game/world/save';
import { START } from '../game/world/towns';
import { readTextSpeed, readWildBugs } from './prefs';
import type { TextSpeed } from './prefs';

export type Phase = 'title' | 'intro' | 'play';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type Panel = 'none' | 'menu' | 'options' | 'recruiter' | 'ask' | 'skilldex' | 'bugdex' | 'card' | 'bag' | 'mart' | 'hof';
export type Portrait = 'devansh' | 'mom' | 'professor';

// the title bar's first 40% is the game chunk itself, the shared atlas fills the rest
export const CHUNK_SHARE = 40;

export interface DialogState {
  speaker: string;
  portrait: Portrait | null;
  lines: string[];
  index: number;
  // what the Overworld does once the player closes this dialog
  after?: 'stepBack' | 'ask' | 'battle' | 'shop';
  // the fight a gym leader's talk leads into
  battle?: BattleRequest;
}

export interface WorldRequest {
  town: TownId;
  spawn?: string;
  pos?: { x: number; y: number };
  facing?: Dir;
  // where the player came from, so a failed trip can go back
  from?: WorldRequest;
}

export interface Travel {
  status: 'loading' | 'error';
  town: TownId;
  progress: number;
  canGoBack: boolean;
  // set by the card's menu; the Overworld acts on it and clears the card
  choice: 'retry' | 'back' | null;
  // names what is loading when it is not a town, such as the battle art
  label?: string;
}

interface Speaker {
  speaker: string;
  portrait: Portrait | null;
}

// CSS-pixel rectangle of the game canvas plus CSS px per native px; the overlays hang off it
export interface Stage {
  left: number;
  top: number;
  width: number;
  height: number;
  px: number;
  // integer camera zoom in device pixels
  scale: number;
}

export interface State {
  phase: Phase;
  load: { status: LoadStatus; progress: number };
  mode: Mode;
  textSpeed: TextSpeed;
  reducedMotion: boolean;
  town: TownId;
  // the named region of the town the player stands in, for the HUD label
  place: string | null;
  pos: { x: number; y: number };
  facing: Dir;
  flags: FlagId[];
  seen: FactId[];
  starter: Starter | undefined;
  caught: SpeciesId[];
  // the visitor's Wild bugs choice; null until they make one
  wildBugsPref: boolean | null;
  // steps since the last battle, so grass never fires twice in a row
  steps: number;
  battle: BattleUi | null;
  // how often each fact was shown by an encounter this visit
  shownCounts: Record<string, number>;
  dialog: DialogState | null;
  panel: Panel;
  held: Dir | null;
  run: boolean;
  aPulse: number;
  // times a while-loop warp sent the player back; the HUD counts them
  loops: number;
  // a destination the robot was asked for; the Overworld walks or warps there and clears it
  nav: DestId | null;
  world: WorldRequest | null;
  pendingWarp: WorldRequest | null;
  continueSave: SaveV1 | null;
  saveTick: number;
  // false until the Overworld places the player, so a save never writes the pre-load position
  landed: boolean;
  stage: Stage;
  travel: Travel | null;
  typing: boolean;
  finishTick: number;
  // seconds played with the tab visible
  playSeconds: number;
  // bumped to ask the UI layer for the resume download; Phaser never touches the DOM
  downloadTick: number;
  actions: Actions;
}

interface Actions {
  setLoad: (status: LoadStatus, progress?: number) => void;
  setReducedMotion: (value: boolean) => void;
  setContinueSave: (save: SaveV1 | null) => void;
  setPendingWarp: (warp: WorldRequest | null) => void;
  setTextSpeed: (speed: TextSpeed) => void;
  setMode: (mode: Mode) => void;
  setPlayer: (town: TownId, pos: { x: number; y: number }, facing: Dir) => void;
  setPlace: (place: string | null) => void;
  setStage: (stage: Stage) => void;
  setTravel: (travel: Travel | null) => void;
  chooseTravel: (choice: 'retry' | 'back') => void;
  setTyping: (typing: boolean) => void;
  setWildBugs: (on: boolean) => void;
  chooseStarter: (starter: Starter) => void;
  tickStep: () => void;
  // the battle itself is played by src/game/battle/controller.ts; the store only holds what it shows
  setBattle: (battle: BattleUi | null) => void;
  setShown: (shown: BattleUi['shown']) => void;
  addCaught: (species: SpeciesId) => void;
  countShown: (fact: FactId) => void;
  resetSteps: () => void;
  newGame: () => void;
  continueGame: () => void;
  warpGame: (warp: WorldRequest) => void;
  beginPlay: () => void;
  openDialog: (dialog: Omit<DialogState, 'index'>) => void;
  openFact: (id: FactId, speaker: Speaker, extra?: string[], after?: DialogState['after'], battle?: BattleRequest) => void;
  markSeen: (id: FactId) => void;
  advanceDialog: () => void;
  advanceOrFinish: () => void;
  closeDialog: () => void;
  addFlag: (flag: FlagId) => void;
  removeFlag: (flag: FlagId) => void;
  bumpLoop: () => void;
  setNav: (nav: DestId | null) => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
  setHeld: (dir: Dir | null) => void;
  setRun: (run: boolean) => void;
  pressA: () => void;
  pressB: () => void;
  pressMenu: () => void;
  requestSave: () => void;
  tickPlay: () => void;
  requestDownload: () => void;
}

const FRESH = {
  flags: [] as FlagId[],
  seen: [] as FactId[],
  starter: undefined,
  caught: [] as SpeciesId[],
  steps: 0,
  battle: null,
  shownCounts: {} as Record<string, number>,
  dialog: null,
  panel: 'none' as Panel,
  held: null,
  run: false,
  loops: 0,
  nav: null as DestId | null,
  playSeconds: 0,
};

// seen.10 and badges.3 are derived, never granted by an object
const withDerived = (flags: FlagId[], seen: FactId[]) => {
  const derived = [
    ...(seen.length >= SEEN_TEN_COUNT ? [SEEN_TEN] : []),
    ...(countBadges(flags) >= BADGES_THREE_COUNT ? [BADGES_THREE] : []),
  ].filter((flag) => !flags.includes(flag));
  return derived.length > 0 ? [...flags, ...derived] : flags;
};

export const isUiOpen = (state: Pick<State, 'phase' | 'dialog' | 'panel' | 'battle'>) =>
  state.phase !== 'play' || state.dialog !== null || state.panel !== 'none' || state.battle !== null;

// recruiters never pick a starter, and they start with wild bugs off unless they turned them on
export const wildBugsOn = (state: Pick<State, 'wildBugsPref' | 'mode'>) => state.wildBugsPref ?? state.mode !== 'recruiter';


export const store = createStore<State>()((set, get) => ({
  phase: 'title',
  load: { status: 'idle', progress: 0 },
  mode: 'curious',
  textSpeed: readTextSpeed(),
  reducedMotion: false,
  wildBugsPref: readWildBugs(),
  town: START.town,
  place: null,
  pos: { x: 0, y: 0 },
  facing: 'down',
  ...FRESH,
  aPulse: 0,
  world: null,
  pendingWarp: null,
  continueSave: null,
  saveTick: 0,
  landed: false,
  stage: { left: 0, top: 0, width: 320, height: 180, px: 1, scale: 1 },
  travel: null,
  typing: false,
  finishTick: 0,
  downloadTick: 0,
  actions: {
    setLoad: (status, progress) => set((s) => ({ load: { status, progress: progress ?? s.load.progress } })),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setContinueSave: (continueSave) => set({ continueSave }),
    setPendingWarp: (pendingWarp) => set({ pendingWarp }),
    setTextSpeed: (textSpeed) => set({ textSpeed }),
    setMode: (mode) => set({ mode }),
    setPlayer: (town, pos, facing) => set({ town, pos, facing, landed: true }),
    setPlace: (place) => set({ place }),
    setStage: (stage) => set({ stage }),
    setTravel: (travel) => set({ travel }),
    chooseTravel: (choice) => set((s) => (s.travel ? { travel: { ...s.travel, choice } } : {})),
    setTyping: (typing) => set({ typing }),
    setWildBugs: (wildBugsPref) => set({ wildBugsPref }),
    chooseStarter: (starter) => set({ starter }),
    tickStep: () => set((s) => ({ steps: s.steps + 1 })),
    setBattle: (battle) => set(battle ? { battle, held: null, run: false } : { battle: null, held: null, run: false, typing: false }),
    addCaught: (species) => {
      if (get().caught.includes(species)) return;
      set((s) => ({ caught: [...s.caught, species] }));
      get().actions.requestSave();
    },
    countShown: (fact) => set((s) => ({ shownCounts: { ...s.shownCounts, [fact]: (s.shownCounts[fact] ?? 0) + 1 } })),
    resetSteps: () => set({ steps: 0 }),
    setShown: (shown) => set((s) => (s.battle ? { battle: { ...s.battle, shown } } : {})),
    newGame: () => set({ ...FRESH, landed: false, phase: 'intro', world: { town: START.town, spawn: START.spawn } }),
    continueGame: () => {
      const save = get().continueSave;
      if (!save) return;
      set({
        ...FRESH,
        flags: withDerived(save.flags, save.seen),
        seen: save.seen,
        starter: save.starter,
        caught: save.caught,
        mode: save.mode,
        playSeconds: save.playSeconds,
        landed: false,
        phase: 'play',
        world: { town: save.town, pos: save.pos, facing: save.facing },
      });
    },
    warpGame: (warp) => set({ ...FRESH, landed: false, phase: 'play', world: warp }),
    beginPlay: () => set({ phase: 'play' }),
    openDialog: (dialog) => {
      const lines = dialog.lines.filter((line) => line.trim() !== '');
      if (lines.length > 0) set({ dialog: { ...dialog, lines, index: 0 } });
    },
    markSeen: (id) => {
      const { seen, actions } = get();
      if (seen.includes(id) || !factById.has(id)) return;
      const next = [...seen, id];
      set((s) => ({ seen: next, flags: withDerived(s.flags, next) }));
      actions.requestSave();
    },
    openFact: (id, speaker, extra = [], after, battle) => {
      const { mode, actions } = get();
      const text = factText(id, mode);
      if (text === undefined) return;
      actions.markSeen(id);
      actions.openDialog({ ...speaker, lines: [text, ...extra], ...(after ? { after } : {}), ...(battle ? { battle } : {}) });
    },
    advanceDialog: () => {
      const dialog = get().dialog;
      if (!dialog) return;
      if (dialog.index + 1 < dialog.lines.length) set({ dialog: { ...dialog, index: dialog.index + 1 } });
      else get().actions.closeDialog();
    },
    // a press while the line is still typing completes the line first
    advanceOrFinish: () => {
      const { typing, actions } = get();
      if (typing) set((s) => ({ finishTick: s.finishTick + 1 }));
      else actions.advanceDialog();
    },
    closeDialog: () => {
      const { dialog, actions } = get();
      set({ dialog: null, typing: false });
      if (dialog?.after === 'ask') actions.openPanel('ask');
      else if (dialog?.after === 'shop') actions.openPanel('mart');
    },
    addFlag: (flag) => {
      const { flags, seen, actions } = get();
      if (flags.includes(flag)) return;
      set({ flags: withDerived([...flags, flag], seen) });
      actions.requestSave();
    },
    removeFlag: (flag) => {
      const { flags, actions } = get();
      if (!flags.includes(flag)) return;
      set({ flags: flags.filter((held) => held !== flag) });
      actions.requestSave();
    },
    bumpLoop: () => set((s) => ({ loops: s.loops + 1 })),
    setNav: (nav) => set({ nav }),
    openPanel: (panel) => set({ panel, held: null, run: false }),
    closePanel: () => set({ panel: 'none' }),
    setHeld: (held) => set({ held }),
    setRun: (run) => set({ run }),
    pressA: () => {
      const { dialog, phase, panel, battle, actions } = get();
      if (dialog) actions.advanceOrFinish();
      else if (phase === 'play' && panel === 'none' && !battle) set((s) => ({ aPulse: s.aPulse + 1 }));
    },
    pressB: () => {
      const { dialog, panel, actions } = get();
      if (dialog) actions.advanceOrFinish();
      else if (panel !== 'none') actions.closePanel();
    },
    pressMenu: () => {
      const { phase, dialog, panel, travel, battle, actions } = get();
      if (phase !== 'play' || dialog || travel || battle) return;
      if (panel === 'none') actions.openPanel('menu');
      else actions.closePanel();
    },
    requestSave: () => set((s) => ({ saveTick: s.saveTick + 1 })),
    tickPlay: () => set((s) => ({ playSeconds: s.playSeconds + 1 })),
    requestDownload: () => set((s) => ({ downloadTick: s.downloadTick + 1 })),
  },
}));

export function toSave(state: State): SaveV1 {
  return {
    v: 1,
    town: state.town,
    pos: state.pos,
    facing: state.facing,
    flags: state.flags,
    seen: state.seen,
    ...(state.starter ? { starter: state.starter } : {}),
    caught: state.caught,
    mode: state.mode,
    playSeconds: state.playSeconds,
    savedAt: new Date().toISOString(),
  };
}
