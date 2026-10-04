import './title.css';
import { clearSave, lastPlayedLabel, readStoredSave } from '../game/world/save';
import { landscapeScale } from '../game/viewport';
import { START } from '../game/world/towns';
import { CHUNK_SHARE, store } from '../state/store';
import { SOUND_LABELS, TEXT_SPEED_LABELS, writeSound, writeTextSpeed } from '../state/prefs';
import type { LoadStatus } from '../state/store';
import type { TextSpeed } from '../state/prefs';
import { timeBand } from '../state/timeBand';

const TEXT = {
  loading: 'The world is loading...',
  ready: 'Press Start',
  error: 'The game could not load. Open the resume instead.',
  corrupt: 'Save data was unreadable. Starting a new game.',
};

const GESTURES = ['pointerdown', 'keydown', 'touchend'] as const;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const root = byId<HTMLElement>('title');
const strip = byId<HTMLElement>('strip');
const stripText = document.createElement('span');
const stripBar = document.createElement('span');
const stripFill = document.createElement('i');
const stripPercent = document.createElement('span');
const menu = byId<HTMLElement>('menu');
const newButton = menu.querySelector<HTMLButtonElement>('[data-act="new"]')!;
const continueButton = menu.querySelector<HTMLButtonElement>('[data-act="continue"]')!;
const optionsButton = menu.querySelector<HTMLButtonElement>('[data-act="options"]')!;
const recruiterLink = menu.querySelector<HTMLAnchorElement>('[data-act="recruiter"]')!;
const continueSub = byId<HTMLElement>('continue-sub');
const optionsSheet = byId<HTMLDialogElement>('options');
const speedGroup = byId<HTMLElement>('speed-group');
const soundGroup = byId<HTMLElement>('sound-group');
const queueNote = document.createElement('small');

const stored = readStoredSave();
const { actions } = store.getState();
let notice = '';
let lastStatus: LoadStatus = 'idle';
let started = false;
// the New Game or Continue press that waits for the engine; it starts the moment the engine is ready
let queued: { button: HTMLButtonElement; start: () => void } | null = null;
const wantsRecruiter = new URLSearchParams(location.search).get('mode') === 'recruiter';

function fitScale() {
  root.style.setProperty('--s', String(Math.min(landscapeScale(innerWidth, innerHeight), 6)));
}

// the live region keeps its nodes: only text that matters changes, so a screen reader hears start, ready and error once each
function buildStrip() {
  stripBar.className = 'bar';
  stripBar.setAttribute('role', 'progressbar');
  stripBar.setAttribute('aria-label', TEXT.loading);
  stripBar.setAttribute('aria-valuemin', '0');
  stripBar.setAttribute('aria-valuemax', '100');
  stripBar.append(stripFill);
  stripPercent.setAttribute('aria-hidden', 'true');
  strip.append(stripText, stripBar, stripPercent);
}

function stripMessage(status: LoadStatus) {
  if (notice) return notice;
  if (status === 'ready') return TEXT.ready;
  if (status === 'error') return TEXT.error;
  return TEXT.loading;
}

function setText(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}

function renderStrip(status: LoadStatus, progress: number) {
  const percent = Math.round(progress);
  const busy = status !== 'ready' && status !== 'error' && !notice;
  setText(stripText, stripMessage(status));
  stripBar.hidden = !busy;
  stripPercent.hidden = !busy;
  stripFill.style.width = `${percent}%`;
  stripBar.setAttribute('aria-valuenow', String(percent));
  setText(stripPercent, `${percent}%`);
}

// focus moves once per transition, never on a progress tick
function moveFocusOnTransition(status: LoadStatus, firstAction: HTMLElement) {
  if (status === lastStatus) return;
  lastStatus = status;
  if (optionsSheet.open) return;
  if (status === 'ready') firstAction.focus({ preventScroll: true });
  else if (status === 'error') recruiterLink.focus({ preventScroll: true });
}

function clearQueue() {
  queued?.button.classList.remove('queued');
  queued?.button.removeAttribute('aria-busy');
  queueNote.remove();
  queued = null;
}

// a queued start runs when the engine is ready and gives way to the error state if it never is
function syncQueue(status: LoadStatus, progress: number) {
  if (!queued) return;
  if (status === 'error') return clearQueue();
  if (status !== 'ready') return setText(queueNote, `${TEXT.loading} ${Math.round(progress)}%`);
  const { start } = queued;
  clearQueue();
  begin(start);
}

// a press before the engine is ready waits for it; the same press again cancels the wait, another button takes it over
function press(button: HTMLButtonElement, start: () => void) {
  const cancel = queued?.button === button;
  actions.playCue(cancel ? 'cancel' : 'confirm');
  if (store.getState().load.status === 'ready') return begin(start);
  clearQueue();
  if (cancel) return;
  queued = { button, start };
  button.classList.add('queued');
  button.setAttribute('aria-busy', 'true');
  queueNote.setAttribute('aria-hidden', 'true');
  button.append(queueNote);
  syncQueue(store.getState().load.status, store.getState().load.progress);
}

function render() {
  const { load } = store.getState();
  const ready = load.status === 'ready';
  renderStrip(load.status, load.progress);
  strip.classList.toggle('ready', ready);
  const failed = load.status === 'error';
  newButton.disabled = failed;
  continueButton.disabled = failed;
  syncQueue(load.status, load.progress);
  continueButton.hidden = stored.status === 'none';
  moveFocusOnTransition(load.status, stored.status === 'none' ? newButton : continueButton);
}

// one start per page: a second click, key press or the corrupt-save timer cannot begin a second game
function begin(start: () => void) {
  if (started) return;
  started = true;
  start();
}

function startContinue() {
  if (stored.status === 'corrupt') {
    clearSave();
    notice = TEXT.corrupt;
    render();
    setTimeout(actions.newGame, 1800);
    return;
  }
  actions.continueGame();
}

function activatePrimary() {
  if (store.getState().load.status !== 'ready') return;
  begin(stored.status === 'none' ? actions.newGame : startContinue);
}

function buildSoundOptions() {
  const current = store.getState().sound;
  for (const on of [false, true]) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'sound';
    input.checked = on === current;
    input.addEventListener('change', () => {
      actions.setSound(on);
      writeSound(on);
    });
    label.append(input, SOUND_LABELS[on ? 'on' : 'off']);
    soundGroup.append(label);
  }
}

function buildSpeedOptions() {
  const current = store.getState().textSpeed;
  const speeds = Object.keys(TEXT_SPEED_LABELS).map(Number) as TextSpeed[];
  for (const speed of speeds) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'speed';
    input.checked = speed === current;
    input.addEventListener('change', () => {
      actions.setTextSpeed(speed);
      writeTextSpeed(speed);
    });
    label.append(input, TEXT_SPEED_LABELS[speed]);
    speedGroup.append(label);
  }
}

function moveFocus(step: 1 | -1) {
  const items = [...menu.querySelectorAll<HTMLElement>('button, a')].filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled);
  actions.playCue('menu_move');
  const at = items.indexOf(document.activeElement as HTMLElement);
  items[(at + step + items.length) % items.length]?.focus();
}

function onKeydown(event: KeyboardEvent) {
  if (store.getState().phase !== 'title' || optionsSheet.open) return;
  if (event.key === 'Escape' && queued) clearQueue();
  else if (event.key === 'ArrowDown') moveFocus(1);
  else if (event.key === 'ArrowUp') moveFocus(-1);
  else if (event.key === 'z' || event.key === 'Z') (document.activeElement as HTMLElement | null)?.click();
  else return;
  event.preventDefault();
}

function loadGame() {
  actions.setLoad('loading', 0);
  const creep = setInterval(() => {
    const { load } = store.getState();
    if (load.status === 'loading' && load.progress < CHUNK_SHARE - 2) actions.setLoad('loading', load.progress + (CHUNK_SHARE - load.progress) * 0.08);
  }, 150);
  import('../game/main')
    .then((game) => {
      clearInterval(creep);
      actions.setLoad('loading', CHUNK_SHARE);
      game.createGame();
    })
    .catch(() => {
      clearInterval(creep);
      actions.setLoad('error');
    });
}

// ?mode=recruiter: the in-game panel over the paused start town, or the static resume when the engine cannot load
function openRecruiter() {
  begin(() => {
    actions.warpGame(store.getState().pendingWarp ?? { town: START.town });
    actions.openPanel('recruiter');
  });
}

function onStore() {
  const state = store.getState();
  if (state.phase !== 'title') {
    document.body.classList.add('playing');
    return;
  }
  render();
  if (wantsRecruiter && state.load.status === 'error') location.replace('/resume/');
  else if (state.load.status === 'ready' && wantsRecruiter) openRecruiter();
  else if (state.load.status === 'ready' && state.pendingWarp) {
    const warp = state.pendingWarp;
    begin(() => actions.warpGame(warp));
  }
}

// the audio code is its own chunk, fetched only once the visitor turns Sound on
function watchSound() {
  const load = () => void import('../audio').then((audio) => audio.startAudio()).catch(() => {});
  if (store.getState().sound) load();
  store.subscribe((state, prev) => {
    if (state.sound && !prev.sound) load();
  });
}

// the audio module reads this: a context may only be made after the visitor acts on the page
function watchGesture() {
  const mark = () => {
    actions.markGesture();
    for (const type of GESTURES) removeEventListener(type, mark, true);
  };
  for (const type of GESTURES) addEventListener(type, mark, { capture: true, passive: true });
}

function init() {
  const band = timeBand();
  root.classList.toggle('night', band === 'night');
  root.classList.toggle('dusk', band === 'dusk');
  fitScale();
  actions.setContinueSave(stored.status === 'ok' ? stored.save : null);
  addEventListener('resize', fitScale);
  continueSub.textContent = stored.status === 'ok' ? lastPlayedLabel(stored.save.savedAt) : lastPlayedLabel(null);
  buildSpeedOptions();
  buildSoundOptions();
  newButton.addEventListener('click', () => press(newButton, actions.newGame));
  continueButton.addEventListener('click', () => press(continueButton, startContinue));
  optionsButton.addEventListener('click', () => {
    actions.playCue('confirm');
    optionsSheet.showModal();
  });
  byId('options-close').addEventListener('click', () => {
    actions.playCue('cancel');
    optionsSheet.close();
  });
  strip.addEventListener('click', activatePrimary);
  addEventListener('keydown', onKeydown);
  store.subscribe(onStore);
  buildStrip();
  watchSound();
  watchGesture();
  root.hidden = false;
  recruiterLink.focus({ preventScroll: true });
  render();
  loadGame();
}

init();
