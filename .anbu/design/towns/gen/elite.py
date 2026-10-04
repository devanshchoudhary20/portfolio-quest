"""Victory Road, the four Elite Four rooms, the Champion's room and the Hall of Fame. Writes maps-src/elite.map; every object name, prop and coordinate matches the builder's map."""
import gen
from gen import *

gen.POOL += list("абвгдежзийклмнопрстуфхцчшщыэюя")
gen.SHEETS += """
  dun     Backgrounds/Tilesets/TilesetDungeon.png
  reld    Backgrounds/Tilesets/TilesetReliefDetail.png"""

W, H = 151, 17
m = M('elite', W, H, "Victory Road: a rocky cave at x 0-29, then the Elite Four rooms (x 40, 60, 80, 100: DSA archive, Machine Coding workshop, System Design server room, Behavioral meeting room), the Champion's room (x 120) and the Hall of Fame (x 140). Each room's forward gate needs the beaten flag of the trainer inside it.")

# ---------- tiles
DIRT = 'g:ofloor:20,17'
DIRT_ALT = ['g:ofloor:19,16', 'g:ofloor:19,17', 'g:ofloor:18,17']
GOLD = 'g:floor:6,13'
DARK = 'g:floor:13,13'
SAGE = 'g:floor:12,7'
CREAMF = 'g:floor:8,1'
ORANGEF = 'g:floor:8,7'
PARQUET = 'g:floor:6,14'

ROCK2 = ['s:nature:16,8:2x2', 's:nature:15,14:2x2', 's:nature:15,16:2x2']
PILE = 's:nature:16,5:4x3'
BIG = 's:nature:17,14:4x3'
TALL = 's:nature:21,14:2x3'
PEBBLE = ['x:nature:17,17', 'x:nature:18,17', 'x:nature:19,17']
CRYSTAL = ['x:nature:0,14', 'x:nature:1,14', 'x:nature:2,14', 'x:nature:3,14']
MOUTH = 's:reld:0,7:3x3'

PC = 'x:elem:10,0'
TABLE = 's:elem:2,10:3x1'
STOOL = 'x:elem:11,0'
CHAIR = 'x:elem:0,9'
LAMP = 's:elem:6,3:1x2'
PLANT = 's:elem:0,7:1x2'
BOARD = 's:elem:11,1:3x1'
FRAME = ['x:elem:8,10', 'x:elem:6,10']
SHELF_BIG = 's:elem:8,7:2x2'
SHELF_PAIR = 's:elem:3,7:2x2'
SHELF_WIDE = 's:elem:10,7:2x2'
DRESSER = 's:elem:6,7:2x2'
CRATE = 'x:elem:0,0'
CRATE_L = 'x:elem:8,0'
RACK = ['x:dun:5,1', 'x:dun:4,1']
STATUE_ORB = 's:house:3,15:2x2'
STATUE_MONK = 's:house:5,15:2x2'
IDOL = 's:house:1,15:2x3'
PILLAR = 's:house:0,15:1x3'
BANNERS = ['s:house:%d,20:1x2' % c for c in range(22, 29)]
ORB = ['x:dun:%d,2' % c for c in range(2, 8)]
LED = ['x:dun:3,3', 'x:dun:4,3']
PIPE_H = ['x:pipes:6,0', 'x:pipes:7,0', 'x:pipes:8,0']
PAD = ['g:logic:0,0', 'g:logic:1,0', 'g:logic:2,0', 'g:logic:3,0']
EDGE = 'g:logic:6,0'
LETTER = ['t:logic:7,%d' % r for r in (6, 7, 8, 9)]
ICON = {'key': 't:logic:7,1', 'eye': 't:logic:7,2', 'chest': 't:logic:7,3', 'ask': 't:logic:7,4', 'x': 't:logic:7,5'}


def room(i, name, floor, walls, top_gap=True):
    x0, y0 = 40 + 20 * i, 7
    m.room(name, x0, y0, 11, 10, x0 + 5, ground=floor, walls=walls)
    if top_gap:
        m.clear(x0 + 5, y0)
    return x0, y0


def put_all(x0, y0, items):
    for lx, ly, key in items:
        m.put(x0 + lx, y0 + ly, key)


def pads(x0, y0, items):
    for lx, ly, key in items:
        m.ground[y0 + ly][x0 + lx] = reg(key)


def gate_set(i, ident, speaker, sprite, fact, battle=True):
    x0 = 40 + 20 * i
    return x0


# ---------- Victory Road, x 0-29, y 0-9: a cave of grey boulders on dirt, crystals, one winding route
m.gfill(0, 0, 30, 10, DIRT)
rng = random.Random(7)
for y in range(10):
    for x in range(30):
        r = rng.random()
        if r < 0.22: m.ground[y][x] = reg(rng.choice(DIRT_ALT))

# boulder bands north and south, a cave mouth in the north wall
for k, x in enumerate(range(0, 30, 2)):
    if x not in (12, 14): m.put(x, 0, ROCK2[(k * 5 + 1) % 3])
    m.put(x, 8, ROCK2[(k * 7 + 2) % 3])
m.put(12, 0, MOUTH)
# side walls leave the doorway rows open: x 0 at y 4-5, x 29 at y 4
m.put(0, 2, ROCK2[0]); m.put(0, 6, ROCK2[1])
m.put(28, 2, ROCK2[2]); m.put(28, 5, ROCK2[0])
m.put(28, 7, PEBBLE[0]); m.put(29, 7, PEBBLE[1])
m.put(27, 3, ORB[4]); m.put(27, 5, ORB[5])
# the route: a pile blocks the north lane, a rock the south lane, a tall rock the north again
m.put(7, 2, PILE)
m.put(13, 5, BIG)
m.put(19, 2, TALL)


def road_open():
    seen, q = {(3, 4)}, collections.deque([(3, 4)])
    while q:
        x, y = q.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in seen and 0 <= n[0] < 30 and 0 <= n[1] < 10 and not m.solid[n[1]][n[0]]:
                seen.add(n); q.append(n)
    return {(28, 4), (0, 4), (0, 5), (29, 4)} <= seen


def dress(x, y, key, w=1, h=1):
    # a decoration only stays if the road is still walkable end to end and keeps one open tile around the route
    if not free(m, x, y, w, h): return
    m.put(x, y, key)
    if not road_open(): m.clear(x, y, w, h)


for x, y, k in [(3, 2, 1), (3, 6, 2), (22, 6, 0), (24, 2, 1), (16, 2, 0), (10, 6, 2), (25, 6, 1)]: dress(x, y, ROCK2[k], 2, 2)
for x, y, k in [(11, 3, 2), (12, 6, 0), (17, 5, 1), (18, 7, 2), (21, 3, 0), (5, 7, 1), (6, 2, 0), (27, 3, 2), (9, 5, 1)]: dress(x, y, PEBBLE[k])
for x, y, k in [(2, 3, 1), (6, 7, 2), (11, 2, 0), (11, 7, 3), (17, 4, 2), (18, 2, 1), (21, 7, 3), (23, 3, 0), (27, 6, 1), (4, 7, 0), (15, 3, 3)]: dress(x, y, CRYSTAL[k])

m.warp('road-back-a', 0, 4, 'testmu', 'elite-road'); m.warp('road-back-b', 0, 5, 'testmu', 'elite-road')
m.spawn('testmu-road', 1, 4, 'right'); m.spawn('default', 3, 4, 'right')
m.warp('door-dsa', 29, 4, 'elite', 'dsa-in'); m.spawn('dsa-door', 28, 4, 'left', door=True)
m.regions.append(('road', 0, 0, 30, 10, False))

# ---------- the five fights, in order: same doors, npc, gate and spawns in every room
ROOMS = [
    ('dsa', 'dsa', 'gear.leetcode', 'DSA Elite'),
    ('machine-coding', 'machine-coding', 'testmu.blocks', 'Machine Coding Elite'),
    ('system-design', 'system-design', 'testmu.save', 'System Design Elite'),
    ('behavioral', 'behavioral', 'junglee-b.award', 'Behavioral Elite'),
    ('devansh', 'devansh', 'agra.summary', 'Champion Devansh'),
]


def wire(i):
    ident, sprite, fact, speaker = ROOMS[i]
    cx = 45 + 20 * i
    nxt = ROOMS[i + 1][0] + '-in' if i + 1 < len(ROOMS) else 'hall-in'
    back = 'dsa-door' if i == 0 else ROOMS[i - 1][0] + '-out'
    m.warp(ident + '-exit', cx, 16, 'elite', back)
    m.spawn(ident + '-in', cx, 15, 'up', door=True)
    m.obj('npcs', ident, cx, 11, sprite=sprite, face='down', factId=fact, speaker='"%s"' % speaker, battle=ident)
    m.obj('gates', ident + '-gate', cx, 8, needs='beaten.' + ident)
    m.spawn(ident + '-out', cx, 9, 'down')
    m.warp(ident + '-next', cx, 7, 'elite', nxt)


for i in range(5): wire(i)
m.warp('hall-exit', 145, 16, 'elite', 'devansh-out'); m.spawn('hall-in', 145, 15, 'up', door=True)
m.obj('signs', 'hall-plaque', 145, 8, factId='agra.summary', speaker='"Hall of Fame"')


def lane_check(x0, top=1):
    for ly in range(top, 9):
        assert not m.solid[7 + ly][x0 + 5], ('lane blocked', x0, ly)


# ---------- DSA: the archive. Stacks of shelves and crates, a tree, a graph painted on the floor
x0, y0 = room(0, 'dsa', ORANGEF, BROWN)
put_all(x0, y0, [
    (1, 1, SHELF_BIG), (3, 1, SHELF_PAIR), (6, 1, SHELF_PAIR), (8, 1, SHELF_BIG),
    (1, 4, SHELF_WIDE), (8, 4, SHELF_BIG),
    (3, 3, LAMP), (7, 3, LAMP),
    (8, 6, 's:nature:0,0:2x2'), (8, 8, CRATE), (9, 8, CRATE), (7, 7, PLANT),
])
# binary tree on the floor: root A over leaves B and C
pads(x0, y0, [(2, 6, PAD[0]), (1, 7, EDGE), (3, 7, EDGE), (1, 8, PAD[1]), (3, 8, PAD[2])])
put_all(x0, y0, [(2, 6, LETTER[0]), (1, 8, LETTER[1]), (3, 8, LETTER[2])])
lane_check(x0)

# ---------- Machine Coding: the workshop. Benches of terminals, stools, pipes, status lights
x0, y0 = room(1, 'machine-coding', DARK, WALL_GREEN)
put_all(x0, y0, [
    (1, 1, PC), (2, 1, PC), (3, 1, PC), (1, 2, TABLE), (2, 3, STOOL),
    (7, 1, PC), (8, 1, PC), (9, 1, PC), (7, 2, TABLE), (8, 3, STOOL),
    (4, 1, LED[0]), (6, 1, LED[1]),
    (1, 5, PC), (2, 5, PC), (3, 5, PC), (1, 6, TABLE), (2, 7, STOOL),
    (7, 5, PC), (8, 5, PC), (9, 5, PC), (7, 6, TABLE), (8, 7, STOOL),
    (1, 8, PIPE_H[0]), (2, 8, PIPE_H[1]), (3, 8, PIPE_H[2]), (7, 8, PIPE_H[0]), (8, 8, PIPE_H[1]), (9, 8, PIPE_H[2]),
    (4, 8, CRATE), (6, 8, CRATE_L),
])
lane_check(x0)

# ---------- System Design: whiteboards, server racks, a request path drawn on the floor
x0, y0 = room(2, 'system-design', SAGE, WALL_MAIN)
put_all(x0, y0, [(1, 1, BOARD), (7, 1, BOARD), (4, 1, LED[1]), (6, 1, LED[0])])
for lx in (1, 2, 8, 9):
    for ly in (3, 4, 5): m.put(x0 + lx, y0 + ly, RACK[0 if ly > 3 else 1])
put_all(x0, y0, [(3, 3, LED[0]), (7, 3, LED[1]), (1, 7, PLANT), (9, 7, PLANT), (1, 6, BOARD), (7, 6, BOARD)])
# client, balancer, database joined by edges
pads(x0, y0, [(2, 7, PAD[0]), (3, 7, EDGE), (4, 7, EDGE), (5, 7, PAD[1]), (6, 7, EDGE), (7, 7, EDGE), (8, 7, PAD[3])])
put_all(x0, y0, [(2, 7, ICON['ask']), (5, 7, ICON['eye']), (8, 7, ICON['chest'])])
lane_check(x0)

# ---------- Behavioral: a calm meeting room. Tables, stools, plants, a green rug
x0, y0 = room(3, 'behavioral', CREAMF, ORANGE_W)
for j in range(4):
    for i in range(4): m.ground[y0 + 3 + j][x0 + 4 + i] = reg('g:floor:%d,%d' % (15 + i, 6 + j))
put_all(x0, y0, [
    (1, 1, PLANT), (9, 1, PLANT), (3, 1, FRAME[0]), (7, 1, FRAME[1]),
    (1, 5, TABLE), (2, 4, STOOL), (2, 6, STOOL),
    (7, 5, TABLE), (8, 4, STOOL), (8, 6, STOOL),
    (1, 8, 'x:nature:0,10'), (9, 8, 'x:nature:1,10'), (3, 8, 't:nature:0,11'), (7, 8, 't:nature:3,11'),
])
lane_check(x0)

# ---------- Champion: banners, guardian statues, pillars, a gold medallion under the challenger
x0, y0 = room(4, 'devansh', GOLD, BROWN)
for j in range(4):
    for i in range(4): m.ground[y0 + 3 + j][x0 + 4 + i] = reg('g:floor:%d,%d' % (15 + i, j))
put_all(x0, y0, [
    (1, 1, BANNERS[1]), (3, 1, BANNERS[0]), (7, 1, BANNERS[0]), (9, 1, BANNERS[1]),
    (4, 1, ORB[2]), (6, 1, ORB[4]),
    (1, 3, STATUE_ORB), (8, 3, STATUE_MONK),
    (1, 6, PILLAR), (9, 6, PILLAR), (3, 7, ORB[0]), (7, 7, ORB[0]),
])
lane_check(x0)

# ---------- Hall of Fame: cream and bright, a plaque over four pedestals
x0, y0 = room(5, 'hall', CREAMF, WALL_MAIN, top_gap=False)
# a warm dais under the plaque and its pedestals, an octagon rug below it
for j in range(2):
    for i in range(7): m.ground[y0 + 1 + j][x0 + 2 + i] = reg('g:floor:%d,%d' % (6, 7 + j))
for j in range(3):
    for i in range(3): m.ground[y0 + 3 + j][x0 + 4 + i] = reg('g:floor:%d,%d' % (i, j))
put_all(x0, y0, [
    (4, 1, BOARD),
    (2, 1, ORB[2]), (3, 1, ORB[4]), (7, 1, ORB[5]), (8, 1, ORB[3]),
    (1, 3, PILLAR), (9, 3, PILLAR), (3, 4, LAMP), (7, 4, LAMP),
    (1, 7, PLANT), (9, 7, PLANT), (3, 7, 't:nature:0,11'), (7, 7, 't:nature:3,11'),
])
lane_check(x0, 2)
m.regions[-1] = ('hall', 140, 7, 11, 10, True)

m.write()
path = gen.OUT + '/elite.map'
text = open(path).read().replace('  hall 140,7,11,10 indoor', '  hall 140,7,11,10 indoor hall')
open(path, 'w').write(text)
