from gen import *

W, H = 242, 36
m = M('testmu', W, H, 'TestMu City: the town at x 0-55 (formerly Lambda City), the KaneAI tower as stacked rooms at x 62-182 (lobby, four floors, basement), and the Design System and Cross-stack gym rooms at x 206 and 230. Rooms sit far apart so the camera never shows a neighbor.')
TW, TH = 56, 36
COB = 'g:floor:6,13'; SW = 'g:floor:8,1'; DARK = 'g:floor:13,13'
LAMP = 's:elem:6,3:1x2'
m.gfill(0, 0, TW, TH, 'G')
m.border('tree', gaps=[(0, 12, 2, 2), (28, 34, 2, 2)], bw=TW, bh=TH)
# paved districts
m.gfill(2, 2, 52, 9, COB); m.gfill(2, 14, 52, 10, COB); m.gfill(2, 26, 52, 1, COB)
# streets: dark asphalt with cream sidewalks
m.gfill(0, 11, TW, 1, SW); m.gfill(0, 14, TW, 1, SW); m.gfill(0, 12, TW, 2, DARK)
m.gfill(27, 15, 1, 19, SW); m.gfill(30, 15, 1, 19, SW); m.gfill(28, 14, 2, 22, DARK)
m.gfill(2, 23, 52, 1, SW); m.gfill(2, 26, 52, 1, SW); m.gfill(2, 24, 52, 2, DARK)
m.gfill(28, 24, 2, 2, DARK)
# tower plaza with the medallion
m.gfill(22, 8, 10, 3, COB)
for j in range(4):
    for i in range(4): m.ground[8 + j][25 + i] = reg('g:floor:%d,%d' % (15 + i, j))
m.gfill(28, 11, 1, 1, SW) if False else None
m.sign('rename', 3, 14, 'testmu.rename', speaker='"Welcome Sign"')
# the KaneAI tower
m.building('chalet', 25, 3, 1, 'door-tower', 'tower-door', 'lobby-in')
m.ground[8][26] = reg('g:floor:16,0')
m.put(24, 5, 's:house:27,20:1x2'); m.put(29, 5, 's:house:27,20:1x2')
m.put(23, 8, LAMP); m.put(31, 8, LAMP)
# north district: front row facing the main street, back row, a lane between
TOWERX = 's:house:19,0:4x3'; LIBX = 's:house:23,0:3x3'
front_w = [('H0x', 2), ('H3x', 6), ('H2x', 10), (TOWERX, 14), ('sushi', 18)]
front_e = [('H2x', 33), (LIBX, 37), ('H0x', 40), (TOWERX, 44), ('H3x', 48)]
for k, x in front_w + front_e: m.put(x, 8, k)
back_w = [('H3x', 2), ('cabinx', 6), ('H0x', 9), ('sushi', 13), ('H2x', 16)]
back_e = [('sushi', 33), ('H0x', 36), ('cabinx', 40), ('H2x', 43), ('H3x', 47)]
for k, x in back_w + back_e: m.put(x, 3, k)
m.put(10, 6, 's:elem:11,1:4x1'); m.put(44, 6, 's:elem:11,1:4x1')
for x in (3, 7, 15, 20, 32, 38, 49, 52): m.put(x, 6, 'x:nature:1,10')
m.put(21, 5, 'x:nature:1,10'); m.put(52, 4, 'x:nature:1,10')
for x in (21, 22, 32): m.put(x, 9, 'x:nature:2,10') if free(m, x, 9) and False else None
# the middle district: gyms and the accessibility corner
m.put(2, 16, 'H2x'); m.put(16, 16, 'H0x'); m.put(20, 17, TOWERX); m.put(33, 17, LIBX); m.put(43, 16, 'H0x'); m.put(48, 17, 'cabinx')
m.building('H3', 8, 17, 1, 'door-design', 'design-door', 'design-in'); m.ground[20][9] = reg(COB)
m.building('H2', 38, 17, 1, 'door-cross', 'cross-door', 'cross-in'); m.ground[20][39] = reg(COB)
m.npc('designer', 13, 16, 'designer', 'testmu.a11y', 'Component Designer', 'left')
m.sign('a11y-score', 14, 17, 'testmu.a11y', speaker='"Accessibility Score"')
m.put(12, 18, LAMP); m.put(36, 18, LAMP); m.put(24, 16, LAMP); m.put(32, 16, 'x:nature:1,10') if False else None
m.put(35, 16, 'x:nature:1,10'); m.put(15, 19, 'x:nature:1,10')
for k, x in [('H0x', 2), ('sushi', 12), ('H3x', 16), (TOWERX, 20), ('H2x', 33), ('H0x', 43), ('cabinx', 48)]:
    if free(m, x, 20, 4 if k in ('H0x', 'H3x', 'H2x', TOWERX) else 3, 3): m.put(x, 20, k)
# south: parks, ponds, a market block
m.put(6, 28, 's:water:0,6:3x3'); m.put(33, 29, 's:water:0,6:3x3'); m.put(18, 28, 's:water:0,6:3x3') if False else None
m.put(36, 28, 'H0x'); m.put(41, 28, 'H3x'); m.put(46, 28, 'sushi'); m.put(2, 33, 's:elem:11,1:4x1') if False else None; m.put(10, 27, 's:elem:11,1:4x1')
for x, y in [(3, 30), (11, 28), (16, 30), (21, 28), (21, 31), (50, 31), (38, 32), (9, 32), (13, 32), (24, 28), (24, 32), (45, 32), (31, 28), (3, 27)]: m.put(x, y, 'tree') if free(m, x, y, 2, 2) else None
for x, y in [(14, 27), (24, 30), (40, 32)]: m.put(x, y, LAMP) if free(m, x, y, 1, 2) else None
scatter(m, ['t:nature:0,11', 't:nature:1,11', 't:nature:3,11', 't:nature:6,11'], 22, (2, 27, 54, 34), 5, grounds=[reg('G')])
scatter(m, ['t:nature:3,10', 't:nature:5,10', 't:nature:9,10'], 22, (2, 27, 54, 34), 6, grounds=[reg('G')])
# street trees and lamps along the main street
for x in (4, 12, 20, 36, 44, 52): m.put(x, 15, 'x:nature:1,10') if free(m, x, 15) else None
m.warp('route-marrfa-a', 0, 12, 'marrfa', 'testmu-road'); m.warp('route-marrfa-b', 0, 13, 'marrfa', 'testmu-road')
m.warp('route-elite-a', 28, 35, 'elite', 'testmu-road'); m.warp('route-elite-b', 29, 35, 'elite', 'testmu-road')
m.spawn('marrfa-road', 1, 12, 'right'); m.spawn('default', 6, 12, 'right')
m.regions.append(('town', 0, 0, TW, TH, False))

# ---- KaneAI tower rooms, 11x9 each, pitch 24
Y0 = 2
SAGE = 'g:floor:12,7'; FLG_ = 'g:floor:19,7'; CREAMF = 'g:floor:8,1'; ORANGEF = 'g:floor:8,7'; PLANK = 'g:water:6,14'; BRICK = 'g:floor:13,13'
BLUE = 'x:logic:0,0'; DKBLK = 'x:logic:6,0'
def tower_room(i, name, floor, walls):
    x0 = 62 + 24 * i
    m.room(name, x0, Y0, 11, 9, -1, ground=floor, walls=walls)
    return x0

def stairs(x0, col, row, warp_name, to_spawn, my_name, my_col, my_row):
    sx, sy = x0 + col, Y0 + row
    m.put(sx, sy, 'stair'); m.warp(warp_name, sx, sy, 'testmu', to_spawn)
    m.spawn(my_name, x0 + my_col, Y0 + my_row, 'down')

# lobby: reception under a medallion
x0 = 62
ex, ey = m.room('lobby', x0, Y0, 11, 9, x0 + 5, ground=SAGE, walls=GREEN)
for j in range(4):
    for i in range(4): m.ground[Y0 + 3 + j][x0 + 4 + i] = reg('g:floor:%d,%d' % (15 + i, 6 + j))
m.warp('lobby-exit', ex, ey, 'testmu', 'tower-door'); m.spawn('lobby-in', ex, ey - 1, 'up', door=True)
stairs(x0, 9, 1, 'lobby-up', 'f1-from-below', 'lobby-from-above', 9, 2)
stairs(x0, 1, 1, 'lobby-down', 'basement-from-above', 'lobby-from-below', 2, 1)
m.put(x0 + 4, Y0 + 2, 'table')
m.npc('reception', x0 + 5, Y0 + 4, 'reception', 'testmu.sharing', 'Reception', 'up')
m.put(x0 + 1, Y0 + 5, 'plant'); m.put(x0 + 9, Y0 + 5, 'plant'); m.put(x0 + 1, Y0 + 3, 'plant'); m.put(x0 + 9, Y0 + 7, 'plant') if False else None

# floor 1: the authoring cursor maze, blue blocks in a serpentine
x0 = tower_room(1, 'floor1', FLG_, GREEN)
for r in (2, 4, 6):
    for c in range(1, 10): pass
rows = {2: set(range(1, 8)), 4: set(range(2, 10)), 6: set(range(1, 9))}
for r, cols in rows.items():
    for c in cols:
        if (r, c) != (2, 4): m.put(x0 + c, Y0 + r, BLUE)
stairs(x0, 9, 1, 'f1-up', 'f2-from-below', 'f1-from-above', 9, 2)
stairs(x0, 1, 7, 'f1-down', 'lobby-from-above', 'f1-from-below', 2, 7)
m.sign('cursor-sign', x0 + 4, Y0 + 2, 'testmu.cursor', speaker='"Cursor Maze"')
m.npc('cursor-robot', x0 + 5, Y0 + 1, 'robot', 'testmu.cursor', 'Robot', 'down')
m.put(x0 + 9, Y0 + 3, 't:logic:0,4'); m.put(x0 + 1, Y0 + 5, 't:logic:0,5')

# floor 2: if/else lanes (cream above, orange below) and a loop track
x0 = tower_room(2, 'floor2', CREAMF, GREEN)
m.gfill(x0 + 1, Y0 + 5, 9, 3, ORANGEF)
for c in range(2, 9): m.put(x0 + c, Y0 + 4, DKBLK)
stairs(x0, 9, 1, 'f2-up', 'f3-from-below', 'f2-from-above', 9, 2)
stairs(x0, 1, 7, 'f2-down', 'f1-from-above', 'f2-from-below', 2, 7)
m.npc('if-else', x0 + 4, Y0 + 2, 'analyst', 'testmu.blocks', 'If / Else', 'down')
m.npc('while-loop', x0 + 6, Y0 + 6, 'editor', 'testmu.blocks', 'While Loop', 'up')
m.put(x0 + 2, Y0 + 1, 't:logic:2,4'); m.put(x0 + 7, Y0 + 3, 't:logic:0,6'); m.put(x0 + 3, Y0 + 7, 't:logic:2,5'); m.put(x0 + 8, Y0 + 7, 't:logic:3,1')

# floor 3: the save room, cream archive
x0 = tower_room(3, 'floor3', CREAMF, CREAM)
stairs(x0, 9, 1, 'f3-up', 'f4-from-below', 'f3-from-above', 9, 2)
stairs(x0, 1, 7, 'f3-down', 'f2-from-above', 'f3-from-below', 2, 7)
m.item('save-crate', x0 + 4, Y0 + 3, 'crate', 'testmu.save', 'Save Crate')
m.item('save-envelope', x0 + 7, Y0 + 3, 'envelope', 'testmu.save', 'Save Envelope')
m.put(x0 + 2, Y0 + 1, 'shK'); m.put(x0 + 6, Y0 + 1, 'shL'); m.put(x0 + 4, Y0 + 1, 'shE') if False else None
m.put(x0 + 3, Y0 + 5, 'plant'); m.put(x0 + 7, Y0 + 5, 'table') if False else None
m.put(x0 + 5, Y0 + 3, 't:pipes:6,0') if False else None
for c in (3, 6): m.put(x0 + c, Y0 + 5, 'x:elem:1,5') if False else None
m.gfill(x0 + 5, Y0 + 3, 2, 1, 'g:floor:12,1')

# floor 4: the import dock, planks and crates
x0 = tower_room(4, 'floor4', PLANK, BROWN)
stairs(x0, 1, 7, 'f4-down', 'f3-from-above', 'f4-from-below', 2, 7)
for c, r in [(2, 2), (3, 2), (4, 2), (6, 2), (7, 2), (8, 2), (2, 3), (7, 3), (2, 5), (3, 5), (8, 5), (9, 5), (8, 6)]: m.put(x0 + c, Y0 + r, 'crate')
m.item('dock-crates', x0 + 9, Y0 + 2, 'chest', 'testmu.import', 'Import Dock')
m.npc('dock-worker', x0 + 5, Y0 + 4, 'student', 'testmu.import', 'Dock Worker', 'down')

# basement: dark bricks, graves, glitch patches, five ghosts
x0 = tower_room(5, 'basement', BRICK, BROWN)
stairs(x0, 9, 1, 'basement-up', 'lobby-from-below', 'basement-from-above', 9, 2)
for n, (c, r) in enumerate([(2, 2), (5, 3), (8, 4), (3, 5), (6, 6)], 1):
    m.npc('ghost-%d' % n, x0 + c, Y0 + r, 'ghost', 'testmu.bugs', 'Ghost Bug', 'down')
for c, r in [(1, 4), (4, 1), (7, 1), (9, 7), (1, 7), (4, 7)]: m.put(x0 + c, Y0 + r, 'x:elem:4,2')
for c, r in [(3, 3), (6, 4), (8, 6), (4, 5), (2, 6), (7, 2)]: m.put(x0 + c, Y0 + r, 't:logic:5,0')

# design system and a11y gym: a swatch strip of tokens
x0 = 62 + 24 * 6
ex, ey = m.room('design-gym', x0, Y0, 11, 10, x0 + 5, ground='FL2')
m.put(x0 + 1, Y0 + 1, 'shE'); m.put(x0 + 8, Y0 + 1, 'shE'); m.put(x0 + 1, Y0 + 6, 'plant'); m.put(x0 + 9, Y0 + 6, 'plant')
for c in range(8): m.put(x0 + 1 + c, Y0 + 5, 't:logic:%d,0' % c)
m.npc('design-leader', x0 + 5, Y0 + 3, 'design', 'skill.design-system', 'Design Leader', 'down')
m.warp('design-exit', ex, ey, 'testmu', 'design-door'); m.spawn('design-in', ex, ey - 1, 'up', door=True)

# cross-stack and AI gym: pipes between layers
x0 = 62 + 24 * 7
ex, ey = m.room('cross-gym', x0, Y0, 11, 10, x0 + 5, ground='FL2')
m.put(x0 + 1, Y0 + 1, 'shE'); m.put(x0 + 8, Y0 + 1, 'shE'); m.put(x0 + 1, Y0 + 6, 'plant'); m.put(x0 + 9, Y0 + 6, 'plant')
m.put(x0 + 2, Y0 + 5, 'x:pipes:6,0'); m.put(x0 + 3, Y0 + 5, 'x:pipes:7,0'); m.put(x0 + 4, Y0 + 5, 'x:pipes:8,0')
m.put(x0 + 6, Y0 + 5, 'x:pipes:6,0'); m.put(x0 + 7, Y0 + 5, 'x:pipes:7,0'); m.put(x0 + 8, Y0 + 5, 'x:pipes:8,0')
m.npc('cross-leader', x0 + 5, Y0 + 3, 'cross', 'skill.cross-stack', 'Stack Leader', 'down')
m.warp('cross-exit', ex, ey, 'testmu', 'cross-door'); m.spawn('cross-in', ex, ey - 1, 'up', door=True)
m.write()
