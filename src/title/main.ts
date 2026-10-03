import './title.css';
import { clearSave, lastPlayedLabel, readStoredSave } from '../game/world/save';
import { landscapeScale } from '../game/viewport';
import { CHUNK_SHARE, store } from '../state/store';
import { TEXT_SPEED_LABELS, writeTextSpeed } from '../state/prefs';
import type { LoadStatus } from '../state/store';
import type { TextSpeed } from '../state/prefs';
import { timeBand } from '../state/timeBand';

const TEXT = {
  loading: 'The world is loading...',
  ready: 'Press Start',
  error: 'The game could not load. Open the resume instead.',
  corrupt: 'Save data was unreadable. Starting a new game.',
};

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

const stored = readStoredSave();
const { actions } = store.getState();
let notice = '';
let lastStatus: LoadStatus = 'idle';
let started = false;

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

function render() {
  const { load } = store.getState();
  const ready = load.status === 'ready';
  renderStrip(load.status, load.progress);
  strip.classList.toggle('ready', ready);
  newButton.disabled = !ready;
  continueButton.disabled = !ready;
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
  const at = items.indexOf(document.activeElement as HTMLElement);
  items[(at + step + items.length) % items.length]?.focus();
}

function onKeydown(event: KeyboardEvent) {
  if (store.getState().phase !== 'title' || optionsSheet.open) return;
  if (event.key === 'ArrowDown') moveFocus(1);
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

function onStore() {
  const state = store.getState();
  if (state.phase !== 'title') {
    document.body.classList.add('playing');
    return;
  }
  render();
  if (state.load.status === 'ready' && state.pendingWarp) actions.warpGame(state.pendingWarp);
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
  newButton.addEventListener('click', () => begin(actions.newGame));
  continueButton.addEventListener('click', () => begin(startContinue));
  optionsButton.addEventListener('click', () => optionsSheet.showModal());
  byId('options-close').addEventListener('click', () => optionsSheet.close());
  strip.addEventListener('click', activatePrimary);
  addEventListener('keydown', onKeydown);
  store.subscribe(onStore);
  buildStrip();
  root.hidden = false;
  recruiterLink.focus({ preventScroll: true });
  render();
  loadGame();
}

init();
