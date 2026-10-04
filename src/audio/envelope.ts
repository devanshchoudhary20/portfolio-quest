export const FADE_MS = 600;
export const DUCK_LEVEL = 0.2;
const DUCK_IN_S = 0.08;
const DUCK_OUT_S = 0.4;

// the slice of AudioParam the envelopes use, so tests can pass a recorder
export interface Param {
  value: number;
  cancelScheduledValues: (time: number) => unknown;
  setValueAtTime: (value: number, time: number) => unknown;
  linearRampToValueAtTime: (value: number, time: number) => unknown;
  setValueCurveAtTime: (values: Float32Array, time: number, duration: number) => unknown;
}

// the encoder pads the file, so the loop runs inside the manifest's window and never past the decoded length
export function loopWindow(loopStart: number | undefined, loopEnd: number | undefined, bufferDuration: number) {
  const start = Math.min(Math.max(loopStart ?? 0, 0), bufferDuration);
  const end = Math.min(loopEnd ?? bufferDuration, bufferDuration);
  return end > start ? { start, end } : { start: 0, end: bufferDuration };
}

// equal-power pair: the two gains keep constant loudness across the fade
export function crossfadeGains(elapsedMs: number, durationMs: number) {
  const t = durationMs <= 0 ? 1 : Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  return { incoming: Math.sin((t * Math.PI) / 2), outgoing: Math.cos((t * Math.PI) / 2) };
}

const CURVE_STEPS = 24;

// the gains of one side of the equal-power fade, scaled to the track's own volume
export function fadeCurve(side: 'in' | 'out', level: number, ms: number) {
  return Float32Array.from({ length: CURVE_STEPS + 1 }, (_, i) => {
    const gains = crossfadeGains((i / CURVE_STEPS) * ms, ms);
    return level * (side === 'in' ? gains.incoming : gains.outgoing);
  });
}

// ms of 0 is a cut: the level applies at once
export function fadeIn(param: Param, level: number, now: number, ms: number) {
  param.cancelScheduledValues(now);
  if (ms > 0) param.setValueCurveAtTime(fadeCurve('in', level, ms), now, ms / 1000);
  else param.setValueAtTime(level, now);
}

// ramps down from wherever the gain is now, so a fade that starts mid-fade does not jump
export function fadeOut(param: Param, now: number, ms: number) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(0, now + ms / 1000);
}

// music drops to DUCK_LEVEL for the jingle, then climbs back; returns when the music is whole again so an overlapping jingle extends the hold
export function duck(param: Param, now: number, jingleSeconds: number, holdUntil: number) {
  const end = Math.max(holdUntil, now + jingleSeconds);
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(DUCK_LEVEL, now + DUCK_IN_S);
  param.setValueAtTime(DUCK_LEVEL, end);
  param.linearRampToValueAtTime(1, end + DUCK_OUT_S);
  return end;
}
