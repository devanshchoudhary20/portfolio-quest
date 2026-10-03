from gen import *

m = M('gear', 108, 24, 'Gear City: the town at x 0-43, then the library (x 50), the Core gym (x 72) and the Patch Center (x 94). Rooms sit far apart so the camera never shows a neighbor.')
COB = 'g:floor:6,13'; SW = 'g:floor:8,1'; DARK = 'g:floor:13,13'
CHALET = 's:house:25,14:4x5:1,4'
m.gfill(0, 0, 44, 24, 'G')
m.border('tree', gaps=[(0, 10, 2, 2), (42, 10, 2, 2)], bw=44, bh=24)
# paved main road with sidewalks
m.gfill(0, 10, 44, 2, COB); m.gfill(0, 9, 44, 1, SW); m.gfill(0, 12, 44, 1, SW)
# quad: medallion plaza, spokes and a promenade
for j in range(4):
    for i in range(4): m.ground[14 + j][20 + i] = reg('g:floor:%d,%d' % (15 + i, j))
m.gfill(21, 13, 2, 1, COB); m.gfill(4, 18, 33, 2, COB)
m.gfill(21, 18, 2, 0 + 1, COB)
for y in range(14, 18): m.gfill(18, y, 2, 1, COB) if False else None
# industrial corner: dark slab floor
m.gfill(31, 13, 10, 9, DARK); m.gfill(30, 18, 1, 2, DARK)
# academic row (decor), back row
m.put(2, 2, 'H0x'); m.put(7, 2, 'sushi'); m.put(11, 2, CHALET.replace('1,4', '9,9')); m.put(17, 2, 'H2x'); m.put(22, 2, 'tower')
m.put(28, 2, 'cabinx'); m.put(32, 2, 'H1x'); m.put(37, 2, 'sushi')
# front row (decor)
m.put(2, 5, 'H1x'); m.put(23, 6, 'H0x'); m.put(33, 5, 'H0x'); m.put(38, 6, 'cabinx')
# library
m.building('lib', 6, 6, 1, 'door-library', 'library-door', 'library-in')
# core gym
m.building('H3', 17, 6, 1, 'door-gym', 'gym-door', 'gym-in')
m.sign('gym-sign', 15, 9, 'skill.core', speaker='"Core Gym"')
# patch center
m.building('cabin', 29, 6, 1, 'door-patch', 'patch-door', 'patch-in')
for sx in (7, 18, 30): m.ground[9][sx] = reg(SW)
# IIT Patna main building: tall chalet with a sign and a student
m.put(9, 13, CHALET)
m.sign('iit-sign', 3, 12, 'gear.btech', speaker='"IIT Patna"')
m.npc('student', 15, 13, 'student', 'gear.btech', 'Student', 'left')
m.ground[13][15] = reg(COB)
for x, y in [(14, 14), (15, 14), (14, 13)]: m.ground[y][x] = reg(COB)
# lamps on the plaza, pond in the south-west
m.put(19, 14, 's:elem:6,3:1x2'); m.put(24, 14, 's:elem:6,3:1x2')
m.put(4, 14, 's:water:0,6:3x3'); 
# the forge yard: kilns, chimney kiln, anvil, cart, pipes, barrels
m.put(32, 14, 's:house:29,11:2x2'); m.put(35, 14, 's:house:29,13:2x2'); m.put(38, 13, 's:house:31,12:2x3')
m.put(32, 18, 's:house:29,8:2x2'); m.put(35, 19, 's:elem:0,3:2x2')
m.put(40, 19, 'x:elem:4,0'); m.put(40, 20, 'x:elem:4,0'); m.put(39, 20, 'x:elem:5,0')
m.put(31, 16, 's:pipes:6,0:3x1'); m.put(31, 15, 'x:pipes:5,0') if False else None
m.put(33, 12, 'x:elem:4,0') if False else None
m.put(34, 16, 'x:pipes:5,0'); m.put(34, 17, 'x:pipes:5,1')
# trees, flowers, tufts
scatter(m, ['tree', 'pine'], 9, (2, 13, 42, 21), 3, size=(2, 2), grounds=[reg('G')], keep={(x, y) for x in range(8, 30) for y in range(12, 14)})
scatter(m, ['t:nature:0,11', 't:nature:1,11', 't:nature:3,11', 't:nature:6,11'], 26, (2, 2, 42, 22), 5, grounds=[reg('G')])
scatter(m, ['t:nature:3,10', 't:nature:5,10', 't:nature:9,10'], 22, (2, 2, 42, 22), 6, grounds=[reg('G')])
# roads
m.warp('route-agra-a', 0, 10, 'agra', 'gear-road'); m.warp('route-agra-b', 0, 11, 'agra', 'gear-road')
m.warp('route-junglee-a', 43, 10, 'junglee', 'gear-road'); m.warp('route-junglee-b', 43, 11, 'junglee', 'gear-road')
m.spawn('agra-road', 1, 10, 'right'); m.spawn('junglee-road', 42, 10, 'left')
m.spawn('default', 8, 10, 'right')
m.regions.append(('town', 0, 0, 44, 24, False))

# library, 11x9
x0, y0 = 50, 8
ex, ey = m.room('library', x0, y0, 11, 9, x0 + 5)
m.put(x0 + 1, y0 + 1, 'shK'); m.put(x0 + 3, y0 + 1, 'shL'); m.put(x0 + 5, y0 + 1, 'shL'); m.put(x0 + 7, y0 + 1, 'shK')
m.put(x0 + 2, y0 + 5, 'table'); m.put(x0 + 7, y0 + 5, 'plant')
m.npc('librarian', x0 + 5, y0 + 3, 'librarian', 'gear.leetcode', 'Librarian', 'down')
m.warp('library-exit', ex, ey, 'gear', 'library-door')
m.spawn('library-in', ex, ey - 1, 'up', door=True)

# core gym, 11x10
x0, y0 = 72, 7
ex, ey = m.room('gym', x0, y0, 11, 10, x0 + 5, ground='FL2')
m.put(x0 + 1, y0 + 1, 'shE'); m.put(x0 + 8, y0 + 1, 'shE')
m.put(x0 + 1, y0 + 6, 'plant'); m.put(x0 + 9, y0 + 6, 'plant')
m.npc('core-leader', x0 + 5, y0 + 3, 'core', 'skill.core', 'Core Leader', 'down')
m.warp('gym-exit', ex, ey, 'gear', 'gym-door')
m.spawn('gym-in', ex, ey - 1, 'up', door=True)

# patch center, 9x8: the PC box holds the KoalaLab project
x0, y0 = 94, 8
ex, ey = m.room('patch', x0, y0, 9, 8, x0 + 4)
m.item('pc-box', x0 + 4, y0 + 1, 'pc', 'patch-center.koalalab', 'PC')
m.put(x0 + 1, y0 + 1, 'shE'); m.put(x0 + 6, y0 + 1, 'shE')
m.put(x0 + 1, y0 + 4, 'plant'); m.put(x0 + 7, y0 + 4, 'plant')
m.warp('patch-exit', ex, ey, 'gear', 'patch-door')
m.spawn('patch-in', ex, ey - 1, 'up', door=True)
m.write()
