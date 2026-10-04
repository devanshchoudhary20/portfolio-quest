import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { flagId, townId } from '../../content';
import { readMap } from '../../../scripts/tiledMap';
import type { WorldObject } from './objects';
import { parseRegions } from './regions';
import { planStops } from './route';

// the built map files are the same ones the game fetches
function load(town: string) {
  const file = `public/maps/${town}.json`;
  const map = readMap(file);
  const objects: WorldObject[] = map.objects.map((o) => ({ name: o.name, kind: (o.props.kind ?? 'sign') as WorldObject['kind'], x: o.tile.x, y: o.tile.y, w: o.w, h: o.h, props: o.props }));
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { properties: unknown };
  return { objects, regions: parseRegions(raw.properties), at: (name: string) => map.spawn(name) };
}

const TESTMU = townId('testmu');
const MARRFA = townId('marrfa');

const names = (stops: WorldObject[] | null) => stops?.map((s) => s.name);

describe('planStops', () => {
  const testmu = load('testmu');

  it('walks straight when both tiles share an area', () => {
    expect(planStops(testmu.objects, testmu.regions, TESTMU, testmu.at('default'), testmu.at('design-door'), [])).toEqual([]);
  });

  it('goes out through the lobby door to reach the town', () => {
    expect(names(planStops(testmu.objects, testmu.regions, TESTMU, testmu.at('lobby-in'), testmu.at('design-door'), []))).toEqual(['lobby-exit']);
  });

  it('climbs the stairs floor by floor from the town', () => {
    const plan = planStops(testmu.objects, testmu.regions, TESTMU, testmu.at('default'), testmu.at('f3-from-below'), []);
    expect(names(plan)).toEqual(['door-tower', 'lobby-up', 'f1-up', 'f2-up']);
  });

  it('reaches the basement from a high floor by going back down', () => {
    const plan = planStops(testmu.objects, testmu.regions, TESTMU, testmu.at('f2-from-below'), testmu.at('basement-from-above'), []);
    expect(names(plan)).toEqual(['f2-down', 'f1-down', 'lobby-down']);
  });

  it('ignores a door that stands under a closed gate', () => {
    const door = testmu.objects.find((o) => o.name === 'lobby-exit')!;
    const plan = planStops(testmu.objects, testmu.regions, TESTMU, testmu.at('lobby-in'), testmu.at('design-door'), [], [{ x: door.x, y: door.y }]);
    expect(plan).toBeNull();
  });

  it('skips a door whose flag is missing', () => {
    const marrfa = load('marrfa');
    const goal = marrfa.at('owner-in');
    expect(planStops(marrfa.objects, marrfa.regions, MARRFA, marrfa.at('default'), goal, [])).toBeNull();
    expect(names(planStops(marrfa.objects, marrfa.regions, MARRFA, marrfa.at('default'), goal, [flagId('role.owner')]))).toEqual(['door-owner']);
  });
});
