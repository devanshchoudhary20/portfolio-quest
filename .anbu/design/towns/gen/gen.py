import sys, collections
import os
OUT = os.environ.get('OUT','/home/devansh/developer/personal/projects/portfolio-quest/maps-src')

SHEETS = """  field   Backgrounds/Tilesets/TilesetField.png
  house   Backgrounds/Tilesets/TilesetHouse.png
  nature  Backgrounds/Tilesets/TilesetNature.png
  elem    Backgrounds/Tilesets/TilesetElement.png
  floor   Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png
  wall    Backgrounds/Tilesets/Interior/TilesetWallSimple.png
  water   Backgrounds/Tilesets/TilesetWater.png
  pipes   Backgrounds/Tilesets/Pipes.png
  logic   Backgrounds/Tilesets/TilesetLogic.png
  ofloor  Backgrounds/Tilesets/TilesetFloor.png"""

# key -> (kind, ref, size, solid, walk)
D = {}
def d(key, kind, ref, size=(1, 1), solid=False, walk=None):
    D[key] = (kind, ref, size, solid, walk)

d('G', 'ground', 'field:3,3'); d('GD', 'ground', 'field:3,6'); d('P', 'ground', 'field:3,0')
d('FL', 'ground', 'floor:8,1'); d('FL2', 'ground', 'floor:8,7'); d('FLG', 'ground', 'floor:19,7')
d('tree', 'stamp', 'nature:0,0', (2, 2), True); d('pine', 'stamp', 'nature:2,0', (2, 2), True)
d('big', 'stamp', 'nature:3,18', (3, 3), True)
d('bush', 'tile', 'nature:0,10', solid=True); d('flower', 'tile', 'nature:0,11'); d('shrub', 'tile', 'nature:1,10', solid=True)
d('sign', 'tile', 'elem:0,2', solid=True)
d('H0', 'stamp', 'house:0,0', (4, 3), True, '1,2'); d('H1', 'stamp', 'house:4,0', (4, 3), True, '1,2')
d('H2', 'stamp', 'house:8,0', (4, 3), True, '1,2'); d('H3', 'stamp', 'house:12,0', (4, 3), True, '1,2')
d('H0x', 'stamp', 'house:0,0', (4, 3), True); d('H1x', 'stamp', 'house:4,0', (4, 3), True)
d('H2x', 'stamp', 'house:8,0', (4, 3), True); d('H3x', 'stamp', 'house:12,0', (4, 3), True)
d('lib', 'stamp', 'house:23,0', (3, 3), True, '1,2'); d('cabin', 'stamp', 'house:26,0', (3, 3), True, '1,2')
d('sushi', 'stamp', 'house:16,0', (3, 3), True); d('tower', 'stamp', 'house:19,0', (4, 3), True, '2,2')
d('cabinx', 'stamp', 'house:26,0', (3, 3), True)
d('chalet', 'stamp', 'house:25,14', (4, 5), True, '1,4')
for i, (c, r) in enumerate([(0, 0), (1, 0), (4, 0), (0, 1), (4, 1), (0, 4), (1, 4), (4, 4)]):
    d('w%d' % (i + 1), 'tile', 'wall:%d,%d' % (c, r), solid=True)
for i, (c, r) in enumerate([(5, 6), (6, 6), (9, 6), (5, 7), (9, 7), (5, 10), (6, 10), (9, 10)]):
    d('g%d' % (i + 1), 'tile', 'wall:%d,%d' % (c, r), solid=True)
d('shK', 'stamp', 'elem:3,7', (2, 2), True); d('shL', 'stamp', 'elem:8,7', (2, 2), True)
d('shE', 'stamp', 'elem:10,7', (2, 2), True); d('dres', 'stamp', 'elem:6,7', (2, 2), True)
d('plant', 'stamp', 'elem:0,7', (1, 2), True); d('table', 'stamp', 'elem:2,10', (3, 1), True)
d('pc', 'tile', 'elem:10,0', solid=True); d('stair', 'tile', 'elem:8,11'); d('crate', 'tile', 'elem:0,0', solid=True)
d('news', 'stamp', 'elem:7,1', (1, 2), True); d('trophy', 'tile', 'elem:15,0', solid=True)
d('envelope', 'tile', 'elem:5,9', solid=True); d('chest', 'tile', 'elem:6,0', solid=True)
d('chair', 'tile', 'elem:0,9'); d('pot', 'tile', 'elem:4,0', solid=True)

POOL = list('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+-~^?:;<>|' + 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßαβγδεζηθικλμνξπρστυφχψω')
WALL_MAIN = ['w%d' % i for i in range(1, 9)]
WALL_GREEN = ['g%d' % i for i in range(1, 9)]

def reg(key):
    if key in D or ':' not in key: return key
    p = key.split(':')
    kind, ref = p[0], p[1] + ':' + p[2]
    if kind == 'g': d(key, 'ground', ref)
    elif kind == 't': d(key, 'tile', ref)
    elif kind == 'x': d(key, 'tile', ref, solid=True)
    elif kind in ('s', 'w'):
        w, h = map(int, p[3].split('x'))
        d(key, 'stamp', ref, (w, h), True, p[4].replace('/', ';') if len(p) > 4 else None)
    return key

class M:
    def __init__(self, name, W, H, note):
        self.name, self.W, self.H, self.note = name, W, H, note
        self.ground = [[None] * W for _ in range(H)]
        self.things = [[None] * W for _ in range(H)]
        self.solid = [[False] * W for _ in range(H)]
        self.objs = []   # (layer, name, x, y, props)
        self.regions = []
        self.pad = collections.defaultdict(list)

    def gfill(self, x, y, w, h, key):
        key = reg(key)
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.ground[j][i] = key

    def put(self, x, y, key):
        key = reg(key)
        kind, ref, size, solid, walk = D[key]
        w, h = size
        assert x >= 0 and y >= 0 and x + w <= self.W and y + h <= self.H, (key, x, y)
        walkset = set(walk.split(';')) if walk else set()
        for dy in range(h):
            for dx in range(w):
                assert self.things[y + dy][x + dx] is None, ('overlap', key, x + dx, y + dy)
                self.things[y + dy][x + dx] = '#'
                self.solid[y + dy][x + dx] = solid and ('%d,%d' % (dx, dy)) not in walkset
        self.things[y][x] = key

    def clear(self, x, y, w=1, h=1):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.things[j][i] = None; self.solid[j][i] = False

    def obj(self, layer, name, x, y, **props):
        self.objs.append((layer, name, x, y, props))

    def sign(self, name, x, y, fact, **kw):
        self.put(x, y, 'sign'); self.obj('signs', name, x, y, factId=fact, **kw)

    def npc(self, name, x, y, sprite, fact, speaker, face='down'):
        assert self.things[y][x] is None, ('npc on thing', name, x, y)
        self.obj('npcs', name, x, y, sprite=sprite, face=face, factId=fact, speaker='"%s"' % speaker)

    def item(self, name, x, y, key, fact, speaker):
        self.put(x, y, key); self.obj('items', name, x, y, factId=fact, speaker='"%s"' % speaker)

    def warp(self, name, x, y, to, spawn):
        self.obj('warps', name, x, y, to=to, spawn=spawn)

    def spawn(self, name, x, y, face='down', door=False):
        self.obj('warps', name, x, y, kind='door' if door else 'spawn', face=face)

    # tree border with gaps: gaps is a list of (x, y, w, h) openings left clear
    def border(self, key='tree', gaps=(), bw=None, bh=None):
        bw = bw or self.W; bh = bh or self.H
        for y in range(0, bh, 2):
            for x in range(0, bw, 2):
                edge = x == 0 or y == 0 or x >= bw - 2 or y >= bh - 2
                if not edge: continue
                if any(gx < x + 2 and x < gx + gw and gy < y + 2 and y < gy + gh for gx, gy, gw, gh in gaps): continue
                self.put(x, y, key)

    def room(self, name, x, y, w, h, door_x, ground='FL', walls=WALL_MAIN):
        self.gfill(x, y, w, h, ground)
        W1, W2, W3, W4, W5, W6, W7, W8 = walls
        for i in range(x, x + w):
            top = W1 if i == x else W3 if i == x + w - 1 else W2
            bot = W6 if i == x else W8 if i == x + w - 1 else W7
            self.put(i, y, top)
            if i != door_x: self.put(i, y + h - 1, bot)
        for j in range(y + 1, y + h - 1):
            self.put(x, j, W4); self.put(x + w - 1, j, W5)
        self.regions.append((name, x, y, w, h, True))
        return door_x, y + h - 1   # exit warp tile

    def building(self, key, x, y, door_dx, in_name, out_name, interior_to):
        kind, ref, size, solid, walk = D[key]
        self.put(x, y, key)
        dx, dy = x + door_dx, y + size[1] - 1
        self.warp(in_name, dx, dy, self.name, interior_to)
        self.spawn(out_name, dx, dy + 1, 'down', door=True)
        self.ground[dy + 1][dx] = 'P'

    # --- verification
    def walkable(self, x, y):
        return 0 <= x < self.W and 0 <= y < self.H and self.ground[y][x] is not None and not self.solid[y][x]

    def check(self):
        npcs = {(o[2], o[3]) for o in self.objs if o[0] == 'npcs'}
        spawns = {o[1]: (o[2], o[3]) for o in self.objs if o[0] == 'warps' and o[4].get('kind') in ('spawn', 'door')}
        for o in self.objs:
            layer, name, x, y, p = o
            if layer in ('signs', 'items'):
                assert self.solid[y][x], ('sign/item not on a solid tile', name)
            if layer == 'npcs':
                assert self.walkable(x, y), ('npc not walkable', name, x, y)
            if layer == 'warps' and 'to' in p:
                assert self.walkable(x, y), ('warp on solid tile', name, x, y)
            if layer == 'warps' and p.get('kind') in ('spawn', 'door'):
                assert self.walkable(x, y), ('spawn on solid tile', name, x, y)
        # flood fill from default spawn, following same-map warps
        start = spawns['default']
        seen = {start}; q = collections.deque([start])
        warps = [(o[2], o[3], o[4]) for o in self.objs if o[0] == 'warps' and o[4].get('to') == self.name]
        wmap = {(x, y): spawns[p['spawn']] for x, y, p in warps}
        warptiles = {(o[2], o[3]) for o in self.objs if o[0] == 'warps' and 'to' in o[4]}
        while q:
            cx, cy = q.popleft()
            if (cx, cy) in warptiles:
                nxt = [wmap[(cx, cy)]] if (cx, cy) in wmap else []
            else:
                nxt = [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]
            for n in nxt:
                if n not in seen and self.walkable(*n) and n not in npcs:
                    seen.add(n); q.append(n)
        bad = []
        for layer, name, x, y, p in self.objs:
            if layer in ('npcs', 'signs', 'items'):
                ok = any(n in seen and n not in warptiles for n in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
                if not ok: bad.append(name)
        for sp in spawns:
            if spawns[sp] not in seen: bad.append('spawn:' + sp)
        for layer, name, x, y, p in self.objs:
            if layer == 'warps' and 'to' in p and (x, y) not in seen and not (p['to'] != self.name and False):
                bad.append('warp:' + name)
        assert not bad, ('unreachable', self.name, bad)

    def write(self):
        self.check()
        used = [k for k in D if any(k == self.ground[j][i] for j in range(self.H) for i in range(self.W)) or any(k == self.things[j][i] for j in range(self.H) for i in range(self.W))]
        chars = {k: POOL[i] for i, k in enumerate(used)}
        assert len(used) <= len(POOL), len(used)
        lines = ['// ' + self.note, 'map %s %d %d' % (self.name, self.W, self.H), 'pack vendor/ninja-adventure', '', 'sheets', SHEETS, '', 'legend']
        for k in used:
            kind, ref, size, solid, walk = D[k]
            parts = ['  %s %s %s' % (chars[k], kind, ref)]
            if size != (1, 1): parts.append('%dx%d' % size)
            if solid: parts.append('solid')
            if walk: parts.append('walk=' + walk)
            if kind == 'ground': parts = ['  %s ground %s' % (chars[k], ref)]
            lines.append(' '.join(parts))
        lines += ['', 'ground']
        for j in range(self.H):
            lines.append(''.join(chars[c] if c else '_' for c in self.ground[j]))
        lines += ['', 'things']
        for j in range(self.H):
            lines.append(''.join(chars[c] if c and c != '#' else '.' for c in self.things[j]))
        lines += ['', 'objects']
        for layer, name, x, y, p in self.objs:
            props = ' '.join('%s=%s' % kv for kv in p.items())
            lines.append('  %-8s %-14s %d,%d %s' % (layer, name, x, y, props))
        lines += ['', 'regions']
        for name, x, y, w, h, indoor in self.regions:
            lines.append('  %s %d,%d,%d,%d%s' % (name, x, y, w, h, ' indoor' if indoor else ''))
        open('%s/%s.map' % (OUT, self.name), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
        print('wrote', self.name, self.W, self.H, 'objs', len(self.objs))

def wallset(cx, cy):
    return ['x:wall:%d,%d' % (cx + a, cy + b) for a, b in [(0, 0), (1, 0), (4, 0), (0, 1), (4, 1), (0, 4), (1, 4), (4, 4)]]
CREAM, ORANGE_W, BROWN, GREEN = wallset(0, 0), wallset(5, 0), wallset(0, 6), wallset(5, 6)

import random
def free(m, x, y, w=1, h=1, grounds=None):
    for j in range(y, y + h):
        for i in range(x, x + w):
            if not (0 <= i < m.W and 0 <= j < m.H): return False
            if m.things[j][i] is not None or m.ground[j][i] is None: return False
            if grounds and m.ground[j][i] not in grounds: return False
    return True

def scatter(m, keys, n, region, seed, size=(1, 1), grounds=None, keep=()):
    rng = random.Random(seed)
    x0, y0, x1, y1 = region
    placed = 0; tries = 0
    while placed < n and tries < n * 60:
        tries += 1
        x = rng.randrange(x0, x1 - size[0] + 1); y = rng.randrange(y0, y1 - size[1] + 1)
        if any((x + i, y + j) in keep for i in range(size[0]) for j in range(size[1])): continue
        if free(m, x, y, size[0], size[1], grounds):
            m.put(x, y, rng.choice(keys)); placed += 1
    return placed

def autoearth(m, cells, off):
    cells = set(cells)
    for (x, y) in cells:
        N = (x, y - 1) in cells; S = (x, y + 1) in cells; W = (x - 1, y) in cells; E = (x + 1, y) in cells
        if not (N or S or W or E): c, r = 3, 10
        elif not N and not S: c, r = (0 if not W else 2 if not E else 1), 10
        elif not W and not E: c, r = 3, (7 if not N else 9 if not S else 8)
        else: c, r = (0 if not W else 2 if not E else 1), (7 if not N else 9 if not S else 8)
        m.ground[y][x] = reg('g:ofloor:%d,%d' % (c + off, r))

def rect(x, y, w, h): return {(i, j) for j in range(y, y + h) for i in range(x, x + w)}
