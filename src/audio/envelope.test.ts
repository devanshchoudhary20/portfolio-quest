import { describe, expect, it } from 'vitest';
import { DUCK_LEVEL, crossfadeGains, duck, fadeCurve, fadeIn, fadeOut, loopWindow } from './envelope';
import type { Param } from './envelope';

// a fake AudioParam that logs each call, with the value the last set call left
function fakeParam(value = 1) {
  const calls: unknown[][] = [];
  const param: Param = {
    value,
    cancelScheduledValues: (t) => calls.push(['cancel', t]),
    setValueAtTime: (v, t) => {
      param.value = v;
      calls.push(['set', v, t]);
    },
    linearRampToValueAtTime: (v, t) => calls.push(['ramp', v, t]),
    setValueCurveAtTime: (values, t, d) => calls.push(['curve', values, t, d]),
  };
  return { param, calls };
}

describe('loopWindow', () => {
  it('uses the manifest window inside the decoded length', () => {
    expect(loopWindow(0, 72, 72.02)).toEqual({ start: 0, end: 72 });
  });
  it('clamps an end past the decoded length (encoder padding trims a few ms)', () => {
    expect(loopWindow(0, 51.692, 51.69)).toEqual({ start: 0, end: 51.69 });
  });
  it('falls back to the whole buffer when the window is empty or missing', () => {
    expect(loopWindow(10, 10, 30)).toEqual({ start: 0, end: 30 });
    expect(loopWindow(undefined, undefined, 30)).toEqual({ start: 0, end: 30 });
  });
});

describe('crossfade', () => {
  it('goes from all outgoing to all incoming with constant power', () => {
    expect(crossfadeGains(0, 600)).toEqual({ incoming: 0, outgoing: 1 });
    const end = crossfadeGains(600, 600);
    expect(end.incoming).toBeCloseTo(1);
    expect(end.outgoing).toBeCloseTo(0);
    const mid = crossfadeGains(300, 600);
    expect(mid.incoming ** 2 + mid.outgoing ** 2).toBeCloseTo(1);
  });
  it('treats a zero length as finished', () => {
    expect(crossfadeGains(0, 0).incoming).toBe(1);
  });
  it('scales the curve to the track volume and spans the fade', () => {
    const { param, calls } = fakeParam();
    fadeIn(param, 0.5, 10, 600);
    const [, curve, at, seconds] = calls.find((call) => call[0] === 'curve')!;
    expect(at).toBe(10);
    expect(seconds).toBeCloseTo(0.6);
    expect((curve as Float32Array)[0]).toBe(0);
    expect((curve as Float32Array).at(-1)).toBeCloseTo(0.5);
    expect(fadeCurve('out', 0.5, 600)[0]).toBeCloseTo(0.5);
    expect(fadeCurve('out', 0.5, 600).at(-1)).toBeCloseTo(0);
  });
  it('cuts at once under reduced motion', () => {
    const { param, calls } = fakeParam();
    fadeIn(param, 0.5, 10, 0);
    expect(calls).toEqual([['cancel', 10], ['set', 0.5, 10]]);
  });
  it('fades the old track out from its current gain to silence', () => {
    const { param, calls } = fakeParam(0.5);
    fadeOut(param, 10, 600);
    expect(calls).toEqual([['cancel', 10], ['set', 0.5, 10], ['ramp', 0, 10.6]]);
  });
});

describe('duck', () => {
  it('drops to 20%, holds for the jingle, then restores', () => {
    const { param, calls } = fakeParam(1);
    const end = duck(param, 5, 2, 0);
    expect(end).toBe(7);
    expect(calls).toEqual([
      ['cancel', 5],
      ['set', 1, 5],
      ['ramp', DUCK_LEVEL, 5.08],
      ['set', DUCK_LEVEL, 7],
      ['ramp', 1, 7.4],
    ]);
  });
  it('a second jingle inside the hold keeps the later end', () => {
    const { param } = fakeParam(1);
    const first = duck(param, 5, 2, 0);
    expect(duck(param, 5.5, 1, first)).toBe(7);
    expect(duck(param, 6, 3, first)).toBe(9);
  });
});
