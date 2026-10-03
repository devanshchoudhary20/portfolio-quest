from gen import *

m = M('marrfa', 52, 22, 'Marrfa Estates: a small contract town at x 0-31 with three role doors, and the Backend side gym room at x 38.')
SW = 'g:floor:8,1'; RD = 'g:floor:8,7'
HEDGE = 'x:nature:1,10'
m.gfill(0, 0, 32, 22, 'G')
m.border('tree', gaps=[(14, 20, 4, 2), (30, 8, 2, 4)], bw=32, bh=22)
# terracotta road: south spur, then east to TestMu; cream sidewalks
m.gfill(15, 9, 2, 13, RD); m.gfill(15, 9, 17, 2, RD)
m.gfill(14, 11, 1, 9, SW); m.gfill(17, 11, 1, 9, SW); m.gfill(15, 11, 17, 1, SW) if False else None
m.gfill(17, 11, 14, 1, SW); m.gfill(15, 8, 16, 1, SW)
m.gfill(3, 8, 12, 1, SW)
# three identical role houses with matched paths and a flower pair each
for hx in (4, 10, 16):
    m.put(hx, 3, 'H0x')
    m.gfill(hx + 1, 6, 1, 2, SW)
    m.gfill(hx - 1, 6, 6, 1, SW) if False else None
for hx, fl in ((4, 't:nature:3,11'), (10, 't:nature:1,11'), (16, 't:nature:6,11')):
    m.put(hx, 6, fl); m.put(hx + 3, 6, fl)
    for k in range(hx, hx + 4): m.put(k, 2, HEDGE) if k not in () else None
m.sign('dashboard', 11, 7, 'marrfa.dashboard', speaker='"Dashboard"')
m.sign('sync', 18, 7, 'marrfa.dashboard', speaker='"Live Sync"')
m.npc('manager', 8, 8, 'manager', 'marrfa.dashboard', 'Property Manager', 'right')
# hedges between yards
for y in (3, 4, 5): m.put(8, y, HEDGE) if free(m, 8, y) else None
for y in (3, 4, 5): m.put(14, y, HEDGE) if free(m, 14, y) else None
# empty lots with For Sale signs
for lx, ly in ((3, 12), (3, 16)):
    for k in range(lx, lx + 7):
        m.put(k, ly, HEDGE); m.put(k, ly + 3, HEDGE)
    for k in range(ly + 1, ly + 3):
        m.put(lx, k, HEDGE); m.put(lx + 6, k, HEDGE)
m.gfill(6, 11, 1, 1, SW)
m.put(5, 13, 'x:elem:1,2') if False else None
m.put(5, 14, 'x:elem:1,2'); m.put(7, 18, 'x:elem:1,2')
m.put(7, 14, 't:nature:0,11'); m.put(4, 18, 't:nature:3,11')
# the gap in each lot hedge: open at x 6 on the north side
for ly in (12, 16):
    m.clear(6, ly)
# street trees and lamps
for y in (12, 16): m.put(12, y, 's:elem:6,3:1x2')
for x, y in [(19, 12), (23, 11), (27, 12), (19, 17)]: m.put(x, y, 'tree') if free(m, x, y, 2, 2) else None
m.put(19, 15, 's:elem:6,3:1x2'); m.put(26, 11, 's:elem:6,3:1x2')
# backend side gym
m.building('cabin', 22, 13, 1, 'door-gym', 'gym-door', 'gym-in')
m.gfill(23, 11, 1, 5, SW)
# park pond in the north-east
m.put(25, 4, 's:water:0,6:3x3'); m.put(22, 3, 'tree'); m.put(28, 3, 'tree'); m.put(23, 6, 'tree')
scatter(m, ['t:nature:0,11', 't:nature:1,11', 't:nature:6,11', 't:nature:3,11'], 20, (2, 2, 30, 20), 7, grounds=[reg('G')])
scatter(m, ['t:nature:3,10', 't:nature:5,10'], 14, (2, 2, 30, 20), 8, grounds=[reg('G')])
m.warp('route-junglee-a', 15, 21, 'junglee', 'marrfa-road'); m.warp('route-junglee-b', 16, 21, 'junglee', 'marrfa-road')
m.warp('route-testmu-a', 31, 9, 'testmu', 'marrfa-road'); m.warp('route-testmu-b', 31, 10, 'testmu', 'marrfa-road')
m.spawn('junglee-road', 15, 20, 'up'); m.spawn('testmu-road', 30, 9, 'left')
m.spawn('default', 15, 12, 'up')
m.regions.append(('town', 0, 0, 32, 22, False))

x0, y0 = 38, 7
ex, ey = m.room('gym', x0, y0, 9, 8, x0 + 4, ground='FL2')
m.put(x0 + 1, y0 + 1, 'shE'); m.put(x0 + 6, y0 + 1, 'shE'); m.put(x0 + 1, y0 + 4, 'plant'); m.put(x0 + 7, y0 + 4, 'plant')
m.npc('backend-leader', x0 + 4, y0 + 3, 'backend', 'skill.backend', 'Backend Leader', 'down')
m.warp('gym-exit', ex, ey, 'marrfa', 'gym-door'); m.spawn('gym-in', ex, ey - 1, 'up', door=True)
m.write()
