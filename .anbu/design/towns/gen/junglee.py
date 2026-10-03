from gen import *

m = M('junglee', 90, 34, 'Junglee Jungle: one forest, two eras. West of the gate (x 0-33) is the Analyst entrance with paths A and B; east of it (x 36-69) is the SE I area. The Monorepo gym room sits at x 76.')
TW, TH = 70, 34
COB = 'g:floor:6,13'
m.gfill(0, 0, TW, TH, 'GD')
open_ = set()
def op(cells, key=None):
    for (i, j) in cells:
        open_.add((i, j))
        if key: m.ground[j][i] = reg(key)
def mir(x, y, w, h): return (x, 34 - y - h, w, h)

# entrance clearing (sunlit) and the road in
clear = rect(0, 13, 13, 8); op(clear, 'G')
road_in = rect(0, 16, 11, 2)
# winding path A (north loop) and its mirror B (south loop)
A = [(9, 8, 2, 6), (9, 8, 12, 2), (19, 8, 2, 6), (19, 12, 10, 2), (27, 12, 2, 5)]
dark = set()
for r in A:
    dark |= rect(*r); dark |= rect(*mir(*r))
main = rect(27, 16, 8, 2)            # road to the gate
north = rect(56, 0, 2, 18)           # road north to Marrfa
dark |= main | north
plaza_road = rect(54, 16, 4, 2)
op(dark); op(road_in); op(plaza_road)
# 2FA gate pocket, torii across the road
op({(32, 15), (33, 15), (32, 18), (33, 18), (34, 16), (34, 17)})
# SE I plaza: sunlit clearing with cobble paving
op(rect(36, 11, 31, 12), 'G'); op(rect(38, 12, 17, 8), COB)
op(rect(35, 16, 1, 2))
autoearth(m, dark, 11)
autoearth(m, road_in, 0)
autoearth(m, plaza_road, 0)
for (x, y) in rect(35, 16, 1, 2): m.ground[y][x] = reg('g:floor:6,13')
# fork: a mossy boulder pair blocks the straight way east
m.put(11, 16, 's:nature:16,8:2x2')
# analyst entrance
m.sign('path-a', 8, 13, 'junglee-a.ab', speaker='"Path A"')
m.sign('path-b', 8, 20, 'junglee-a.ab', speaker='"Path B"')
m.put(9, 13, 't:logic:0,6') if False else None
m.npc('analyst', 4, 15, 'analyst', 'junglee-a.ab', 'Analyst', 'down')
# letters on the ground at the foot of each path
m.put(10, 12, 't:logic:0,6'); m.put(10, 21, 't:logic:0,7')
# 2FA gate: torii with a sign, two keys, the recovery path keeper
m.put(34, 13, 's:house:0,15:1x3'); m.put(34, 18, 's:house:0,15:1x3')
m.sign('gate-2fa', 33, 15, 'junglee-b.2fa', speaker='"2FA Gate"')
m.put(32, 15, 't:logic:0,1'); m.put(32, 18, 't:logic:3,1')
m.npc('recovery', 36, 18, 'reception', 'junglee-b.2fa', 'Recovery Path', 'up')
# SE I plaza
m.put(41, 13, 'news'); m.obj('signs', 'newsstand', 41, 13, factId='junglee-b.blog', speaker='"Newsstand"')
m.npc('editor', 43, 15, 'editor', 'junglee-b.blog', 'Editor', 'left')
m.item('trophy', 47, 13, 'trophy', 'junglee-b.award', 'Trophy')
m.building('H3', 50, 11, 1, 'door-gym', 'gym-door', 'gym-in')
m.ground[14][51] = reg(COB)
for x, y in [(39, 12), (54, 12), (39, 19), (54, 19)]: m.put(x, y, 's:elem:6,3:1x2')
m.put(44, 17, 's:water:0,6:3x3')
m.put(45, 12, 's:house:26,20:1x2'); m.put(49, 12, 's:house:28,20:1x2')
for x, y in [(60, 13), (62, 20), (38, 21), (64, 17), (59, 20)]: m.put(x, y, 'flower') if free(m, x, y) else None

# roads out
m.warp('route-gear-a', 0, 16, 'gear', 'junglee-road'); m.warp('route-gear-b', 0, 17, 'gear', 'junglee-road')
m.warp('route-marrfa-a', 56, 0, 'marrfa', 'junglee-road'); m.warp('route-marrfa-b', 57, 0, 'marrfa', 'junglee-road')
m.spawn('gear-road', 1, 16, 'right'); m.spawn('marrfa-road', 56, 1, 'down')
m.spawn('default', 6, 17, 'right')

# forest everywhere that is not open
rng = random.Random(11)
def solid_ok(x, y, w, h):
    return all((i, j) not in open_ and m.things[j][i] is None for j in range(y, y + h) for i in range(x, x + w) if 0 <= i < TW and 0 <= j < TH) and x + w <= TW and y + h <= TH
for y in range(0, TH, 2):
    for x in range(0, TW, 2):
        roll = rng.random()
        if roll < 0.14 and solid_ok(x, y, 3, 3): m.put(x, y, 'big')
        elif solid_ok(x, y, 2, 2):
            m.put(x, y, 'pine' if roll < 0.55 else 'tree' if roll < 0.75 else 's:nature:6,0:2x2')
for y in range(0, TH - 1):
    for x in range(0, TW - 1):
        if solid_ok(x, y, 2, 2): m.put(x, y, rng.choice(['pine', 'tree', 's:nature:6,0:2x2']))
# undergrowth in the open and the last stray cells
for y in range(TH):
    for x in range(TW):
        if m.things[y][x] is None and (x, y) not in open_:
            m.put(x, y, rng.choice(['x:nature:1,10', 'x:nature:2,10', 'x:nature:11,8' if False else 'x:nature:6,10']))
gd = [reg('GD')]
scatter(m, ['t:nature:4,11', 't:nature:5,11', 't:nature:9,11', 't:nature:3,10', 't:nature:7,10'], 70, (0, 8, 36, 26), 4, grounds=gd + [reg('G')])
scatter(m, ['t:nature:0,11', 't:nature:3,11', 't:nature:6,11', 't:nature:1,11'], 30, (36, 11, 67, 22), 5, grounds=[reg('G')])
scatter(m, ['t:nature:3,10', 't:nature:5,10', 't:nature:9,10'], 25, (36, 11, 67, 22), 6, grounds=[reg('G')])
scatter(m, ['s:nature:2,8:2x2', 's:nature:13,8:2x2'], 3, (14, 14, 18, 20), 9, size=(2, 2)) 
m.regions.append(('town', 0, 0, TW, TH, False))

# monorepo gym
x0, y0 = 76, 10
ex, ey = m.room('gym', x0, y0, 11, 10, x0 + 5, ground='FL2')
m.put(x0 + 1, y0 + 1, 'shE'); m.put(x0 + 8, y0 + 1, 'shE'); m.put(x0 + 1, y0 + 6, 'plant'); m.put(x0 + 9, y0 + 6, 'plant')
m.npc('monorepo-leader', x0 + 5, y0 + 3, 'monorepo', 'skill.monorepo', 'Tooling Leader', 'down')
m.warp('gym-exit', ex, ey, 'junglee', 'gym-door'); m.warp('gym-in', ex, ey - 1, 'junglee', 'gym-door') if False else None
m.spawn('gym-in', ex, ey - 1, 'up', door=True)
m.write()
