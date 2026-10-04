import { store } from '../state/store';
import { MIN_GAP_MS, cuesFor } from './cues';
import type { Cue } from './cues';
import { FADE_MS, duck, fadeIn, fadeOut, loopWindow } from './envelope';
import { TRACKS } from './manifest';
import type { CueId, MusicId, SoundId } from './manifest';
import { musicFor } from './music';

const BASE = '/assets/audio/';
// a place change settles over a few frames (the town id and the region land in separate sets), so wait before choosing a track
const SETTLE_MS = 100;

interface Playing {
  id: MusicId;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let current: Playing | null = null;
let wanted: MusicId | null = null;
let started = false;
let duckUntil = 0;
let settle: ReturnType<typeof setTimeout> | undefined;
const timers = new Set<ReturnType<typeof setTimeout>>();
const lastPlayed = new Map<CueId, number>();
const buffers = new Map<SoundId, Promise<AudioBuffer | null>>();

// ogg (opus) where the browser says it plays it, else the m4a pair
const extension = () => (document.createElement('audio').canPlayType('audio/ogg; codecs="opus"') === 'probably' ? 'ogg' : 'm4a');

const enabled = () => store.getState().sound;

function open() {
  if (ctx) return ctx;
  ctx = new window.AudioContext();
  master = ctx.createGain();
  master.connect(ctx.destination);
  bus = ctx.createGain();
  bus.connect(master);
  return ctx;
}

async function fetchBuffer(id: SoundId, context: AudioContext) {
  try {
    const response = await fetch(`${BASE}${TRACKS[id].file}.${extension()}`);
    if (!response.ok) return null;
    return await context.decodeAudioData(await response.arrayBuffer());
  } catch {
    return null;
  }
}

// each file is fetched once, on first need
function load(id: SoundId, context: AudioContext) {
  const known = buffers.get(id);
  if (known) return known;
  const pending = fetchBuffer(id, context);
  buffers.set(id, pending);
  // a failed load is not cached, so a later request retries
  void pending.then((buffer) => {
    if (!buffer && buffers.get(id) === pending) buffers.delete(id);
  });
  return pending;
}

async function playMusic(id: MusicId) {
  const context = ctx;
  if (!context || !bus || current?.id === id) return;
  const buffer = await load(id, context);
  if (!buffer) {
    if (wanted === id) wanted = null;
    return;
  }
  if (ctx !== context || !bus || wanted !== id || current?.id === id) return;
  const track = TRACKS[id];
  const ms = store.getState().reducedMotion ? 0 : FADE_MS;
  const now = context.currentTime;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const span = loopWindow(track.loopStart, track.loopEnd, buffer.duration);
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = span.start;
  source.loopEnd = span.end;
  source.connect(gain);
  gain.connect(bus);
  fadeIn(gain.gain, track.volume, now, ms);
  source.start(now);
  const old = current;
  current = { id, source, gain };
  source.onended = () => gain.disconnect();
  if (!old) return;
  const end = ms > 0 ? now + ms / 1000 + 0.05 : now;
  old.source.stop(end);
  if (ms > 0) fadeOut(old.gain.gain, now, ms);
  old.source.onended = () => old.gain.disconnect();
}

async function playCue(id: CueId) {
  const context = ctx;
  if (!context || !master) return;
  const at = performance.now();
  if (at - (lastPlayed.get(id) ?? -Infinity) < (MIN_GAP_MS[id] ?? 0)) return;
  lastPlayed.set(id, at);
  const buffer = await load(id, context);
  if (!buffer || ctx !== context || !master || !bus) return;
  const track = TRACKS[id];
  const source = context.createBufferSource();
  const gain = context.createGain();
  gain.gain.value = track.volume;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(master);
  source.start();
  if (track.kind === 'jingle') duckUntil = duck(bus.gain, context.currentTime, buffer.duration, duckUntil);
}

function later(cue: Cue) {
  if (cue.delayMs <= 0) return void playCue(cue.id);
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (enabled()) void playCue(cue.id);
  }, cue.delayMs);
  timers.add(timer);
}

function want(id: MusicId) {
  if (id === wanted) return;
  wanted = id;
  clearTimeout(settle);
  settle = setTimeout(() => void playMusic(id), SETTLE_MS);
}

function shutdown() {
  clearTimeout(settle);
  timers.forEach(clearTimeout);
  timers.clear();
  current?.source.stop();
  current = null;
  wanted = null;
  duckUntil = 0;
  const closing = ctx;
  ctx = master = bus = null;
  void closing?.close();
}

// no context before Sound is On and the visitor has acted on the page
function reconcile() {
  if (!enabled()) return shutdown();
  if (!store.getState().gestured || document.hidden) return;
  const context = open();
  void context.resume();
  want(musicFor(store.getState()));
}

// iOS only resumes a context from inside a gesture handler, so every gesture retries
function onGesture() {
  reconcile();
}

function onVisibility() {
  if (document.hidden) void ctx?.suspend();
  else reconcile();
}

export function startAudio() {
  if (started) return;
  started = true;
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(type, onGesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  store.subscribe((state, prev) => {
    if (state.sound !== prev.sound || state.gestured !== prev.gestured) return reconcile();
    if (!ctx || document.hidden) return;
    cuesFor(prev, state).forEach(later);
    const next = musicFor(state);
    if (next !== musicFor(prev)) want(next);
  });
  reconcile();
}
