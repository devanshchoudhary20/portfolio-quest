import { createStore } from 'zustand/vanilla';
import { factById } from '../content';
import type { FactId, FlagId, TownId } from '../content';
import type { Dir, Mode, SaveV1, Starter } from '../game/world/save';
import { START } from '../game/world/towns';
import { readTextSpeed } from './prefs';
import type { TextSpeed } from './prefs';

export type Phase = 'title' | 'intro' | 'play';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type Panel = 'none' | 'menu' | 'options';
export type Portrait = 'devansh' | 'mom' | 'professor';

// the title bar's first 40% is the game chunk itself, the shared atlas fills the rest
export const CHUNK_SHARE = 40;

export interface DialogState {
  speaker: string;
  portrait: Portrait | null;
  lines: string[];
  index: number;
  // what the Overworld does once the player closes this dialog
  after?: 'stepBack';
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
  pos: { x: number; y: number };
  facing: Dir;
  flags: FlagId[];
  seen: FactId[];
  starter: Starter | undefined;
  dialog: DialogState | null;
  panel: Panel;
  held: Dir | null;
  run: boolean;
  aPulse: number;
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
  setStage: (stage: Stage) => void;
  setTravel: (travel: Travel | null) => void;
  chooseTravel: (choice: 'retry' | 'back') => void;
  setTyping: (typing: boolean) => void;
  newGame: () => void;
  continueGame: () => void;
  warpGame: (warp: WorldRequest) => void;
  beginPlay: () => void;
  openDialog: (dialog: Omit<DialogState, 'index'>) => void;
  openFact: (id: FactId, speaker: Speaker, extra?: string[]) => void;
  advanceDialog: () => void;
  advanceOrFinish: () => void;
  closeDialog: () => void;
  addFlag: (flag: FlagId) => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
  setHeld: (dir: Dir | null) => void;
  setRun: (run: boolean) => void;
  pressA: () => void;
  pressB: () => void;
  pressMenu: () => void;
  requestSave: () => void;
}

const FRESH = {
  flags: [] as FlagId[],
  seen: [] as FactId[],
  starter: undefined,
  dialog: null,
  panel: 'none' as Panel,
  held: null,
  run: false,
};

export const isUiOpen = (state: Pick<State, 'phase' | 'dialog' | 'panel'>) =>
  state.phase !== 'play' || state.dialog !== null || state.panel !== 'none';

export const store = createStore<State>()((set, get) => ({
  phase: 'title',
  load: { status: 'idle', progress: 0 },
  mode: 'curious',
  textSpeed: readTextSpeed(),
  reducedMotion: false,
  town: START.town,
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
  actions: {
    setLoad: (status, progress) => set((s) => ({ load: { status, progress: progress ?? s.load.progress } })),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setContinueSave: (continueSave) => set({ continueSave }),
    setPendingWarp: (pendingWarp) => set({ pendingWarp }),
    setTextSpeed: (textSpeed) => set({ textSpeed }),
    setMode: (mode) => set({ mode }),
    setPlayer: (town, pos, facing) => set({ town, pos, facing, landed: true }),
    setStage: (stage) => set({ stage }),
    setTravel: (travel) => set({ travel }),
    chooseTravel: (choice) => set((s) => (s.travel ? { travel: { ...s.travel, choice } } : {})),
    setTyping: (typing) => set({ typing }),
    newGame: () => set({ ...FRESH, landed: false, phase: 'intro', world: { town: START.town, spawn: START.spawn } }),
    continueGame: () => {
      const save = get().continueSave;
      if (!save) return;
      set({
        ...FRESH,
        flags: save.flags,
        seen: save.seen,
        starter: save.starter,
        mode: save.mode,
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
    openFact: (id, speaker, extra = []) => {
      const { mode, seen, actions } = get();
      const fact = factById.get(id);
      if (!fact) return;
      if (!seen.includes(id)) {
        set({ seen: [...seen, id] });
        actions.requestSave();
      }
      actions.openDialog({ ...speaker, lines: [mode === 'engineer' ? (fact.long ?? fact.short) : fact.short, ...extra] });
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
    closeDialog: () => set({ dialog: null, typing: false }),
    addFlag: (flag) => {
      const { flags, actions } = get();
      if (flags.includes(flag)) return;
      set({ flags: [...flags, flag] });
      actions.requestSave();
    },
    openPanel: (panel) => set({ panel, held: null, run: false }),
    closePanel: () => set({ panel: 'none' }),
    setHeld: (held) => set({ held }),
    setRun: (run) => set({ run }),
    pressA: () => {
      const { dialog, phase, panel, actions } = get();
      if (dialog) actions.advanceOrFinish();
      else if (phase === 'play' && panel === 'none') set((s) => ({ aPulse: s.aPulse + 1 }));
    },
    pressB: () => {
      const { dialog, panel, actions } = get();
      if (dialog) actions.advanceOrFinish();
      else if (panel !== 'none') actions.closePanel();
    },
    pressMenu: () => {
      const { phase, dialog, panel, travel, actions } = get();
      if (phase !== 'play' || dialog || travel) return;
      if (panel === 'none') actions.openPanel('menu');
      else actions.closePanel();
    },
    requestSave: () => set((s) => ({ saveTick: s.saveTick + 1 })),
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
    mode: state.mode,
    savedAt: new Date().toISOString(),
  };
}
