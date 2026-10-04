"""All 16 creature sprites (front + back), original shapes drawn with lib.py."""
from lib import *

PU = ramp("#C6B8E6", "#8672BC", "#52427F")
BRICK = ramp("#E59A7E", "#C0503F", "#862D2D")
STONE = ramp("#C9D3E3", "#8EA0BC", "#566580")
TEAL = ramp("#B0EBDD", "#4FB8A5", "#2B7F73")
GOLD = ramp("#FFF3C4", "#F2D277", "#C29A33")
BEE = ramp("#FFF09A", "#F0C230", "#B08410")
PINK = ramp("#F8BEDA", "#D9689E", "#9A3B6F")
WOOD = ramp("#F6E6AE", "#DDBA62", "#A07C30")
GH = ramp("#F4F9FD", "#C6D8EA", "#8CA6C6")
DARK = ramp("#4A4F63", "#2E3348", "#1B1F2E")


def mouth(c, x0, y0, x1, y1):
    c.ink(c.m().l(x0, y0, x1, y1, 1.2))


# ---------------- starters ----------------
def react_front():
    c = C()
    c.paint(c.m().e(53, 49, 5, 10), CY, rim=1, line=True)
    c.paint(c.m().p([(17, 18), (10, 5), (26, 12)]), CY, rim=1)
    c.paint(c.m().p([(42, 12), (51, 4), (45, 20)]), CY, rim=1)
    c.paint(c.m().e(13, 43, 5, 9), CY, rim=1, line=True)
    body = c.m().e(31, 42, 19, 16)
    c.paint(body, CY, rim=3)
    c.paint(c.m().e(28, 47, 11, 9), CY, flat=True, shape=None) ; c.paint(c.m().e(28, 47, 11, 9), ramp("#C8F3FA", "#C8F3FA", "#C8F3FA"), flat=True)
    c.paint(c.m().e(22, 59, 6, 3.5), CY, rim=1, line=True)
    c.paint(c.m().e(37, 59, 6, 3.5), CY, rim=1, line=True)
    c.paint(c.m().e(29, 25, 15, 13), CY, rim=3)
    c.paint(c.m().e(25, 29, 8, 5), ramp("#C8F3FA", "#C8F3FA", "#C8F3FA"), flat=True)
    c.eye(21, 23, 2.8, 4, -1)
    c.eye(32, 23, 2.8, 4, -1)
    mouth(c, 20, 31, 26, 32)
    return c


def react_back():
    c = C()
    c.paint(c.m().e(57, 52, 5, 10), CY, rim=1, line=True)
    c.paint(c.m().p([(14, 22), (6, 8), (24, 14)]), CY, rim=1)
    c.paint(c.m().p([(40, 14), (50, 6), (48, 24)]), CY, rim=1)
    c.paint(c.m().e(9, 48, 6, 11), CY, rim=1, line=True)
    c.paint(c.m().e(31, 50, 25, 20), CY, rim=3)
    c.paint(c.m().e(31, 26, 17, 15), CY, rim=3)
    c.paint(c.m().e(33, 48, 10, 8), ramp("#C8F3FA", "#C8F3FA", "#C8F3FA"), flat=True)
    c.paint(c.m().e(33, 48, 5, 4), CY, rim=1)
    return c


def node_front():
    c = C()
    c.paint(c.m().p([(36, 30), (30, 14), (24, 4), (35, 8), (40, 20)]), GR, rim=1, line=True)
    c.paint(c.m().p([(40, 28), (47, 12), (58, 8), (56, 22), (46, 30)]), GR, rim=1, line=True)
    c.paint(c.m().e(51, 52, 6, 4), GR, rim=1)
    c.paint(c.m().e(45, 59, 6, 4), GR, rim=1, line=True)
    c.paint(c.m().e(26, 59, 6, 4), GR, rim=1, line=True)
    c.paint(c.m().e(33, 44, 22, 14), GR, rim=3)
    c.paint(c.m().e(36, 32, 11, 9), ramp("#7BCB8E", "#3F9A55", "#245F34"), rim=2)
    c.ink(c.m().l(36, 25, 36, 38, 1)); c.ink(c.m().l(29, 32, 43, 32, 1))
    c.paint(c.m().e(14, 40, 10, 9), GR, rim=2)
    c.paint(c.m().e(9, 45, 5, 3), ramp("#C9ECB7", "#C9ECB7", "#C9ECB7"), flat=True)
    c.eye(11, 37, 2.4, 3.2, -1)
    c.eye(19, 37, 2, 2.8, -1)
    return c


def node_back():
    c = C()
    c.paint(c.m().p([(28, 30), (12, 12), (24, 4), (36, 28)]), GR, rim=1, line=True)
    c.paint(c.m().p([(34, 28), (38, 8), (54, 8), (48, 30)]), GR, rim=1, line=True)
    c.paint(c.m().e(10, 54, 6, 6), GR, rim=1, line=True)
    c.paint(c.m().e(54, 54, 6, 6), GR, rim=1, line=True)
    c.paint(c.m().e(32, 50, 27, 15), GR, rim=3)
    c.paint(c.m().e(32, 38, 17, 14), ramp("#7BCB8E", "#3F9A55", "#245F34"), rim=2)
    c.ink(c.m().l(32, 26, 32, 50, 1)); c.ink(c.m().l(18, 38, 46, 38, 1))
    c.paint(c.m().e(8, 41, 6, 5), GR, rim=1, line=True)
    return c


def claude_front():
    c = C()
    flame = c.m().p([(36, 52), (46, 54), (56, 46), (59, 32), (53, 18), (55, 34), (50, 40), (44, 44)])
    c.paint(flame, OR, rim=1)
    c.paint(c.m().p([(49, 44), (55, 38), (55, 28), (51, 38)]), YL, flat=True)
    c.paint(c.m().p([(15, 17), (16, 3), (27, 12)]), OR, rim=1, line=True)
    c.paint(c.m().p([(32, 12), (42, 2), (42, 18)]), OR, rim=1, line=True)
    c.paint(c.m().e(31, 42, 13, 15), OR, rim=3)
    c.paint(c.m().e(28, 46, 7, 9), CREAM, flat=True)
    c.paint(c.m().e(21, 59, 6, 3.5), OR, rim=1, line=True)
    c.paint(c.m().e(37, 59, 6, 3.5), OR, rim=1, line=True)
    c.paint(c.m().e(16, 40, 4, 7), OR, rim=1, line=True)
    c.paint(c.m().e(29, 22, 13, 11).e(17, 27, 7, 5), OR, rim=3)
    c.paint(c.m().e(15, 29, 3, 2), CREAM, flat=True)
    c.ink(c.m().e(10, 28, 1.6, 1.4))
    c.eye(22, 21, 2.4, 3.2, -1)
    c.eye(32, 21, 2.4, 3.2, -1)
    return c


def claude_back():
    c = C()
    flame = c.m().p([(40, 58), (52, 60), (60, 50), (62, 32), (54, 12), (55, 30), (49, 38), (42, 46)])
    c.paint(flame, OR, rim=1)
    c.paint(c.m().p([(52, 52), (58, 44), (58, 28), (54, 40)]), YL, flat=True)
    c.paint(c.m().p([(14, 22), (14, 6), (26, 14)]), OR, rim=1, line=True)
    c.paint(c.m().p([(34, 14), (46, 4), (44, 22)]), OR, rim=1, line=True)
    c.paint(c.m().e(30, 48, 19, 18), OR, rim=3)
    c.paint(c.m().e(22, 61, 7, 3), OR, rim=1, line=True)
    c.paint(c.m().e(38, 61, 7, 3), OR, rim=1, line=True)
    c.paint(c.m().e(30, 26, 14, 12), OR, rim=3)
    c.paint(c.m().e(30, 47, 5, 11), ramp("#F7B173", "#F7B173", "#F7B173"), flat=True)
    c.paint(c.m().e(10, 46, 5, 8), OR, rim=1, line=True)
    return c


# ---------------- wild bugs ----------------
def nullptr_front():
    c = C()
    c.paint(c.m().e(21, 59, 6, 3.5), PU, rim=1, line=True)
    c.paint(c.m().e(41, 59, 6, 3.5), PU, rim=1, line=True)
    ring = c.m().e(31, 40, 21, 19)
    c.paint(ring, PU, rim=3)
    c.ink(c.m().e(31, 43, 11, 10))
    c.paint(c.m().e(31, 43, 11, 10), DARK, flat=True)
    c.ink(c.m().e(31, 43, 8, 7.2))
    cur = c.m().p([(45, 2), (45, 21), (50, 17), (54, 25), (58, 23), (54, 15), (60, 15)])
    c.ink(c.m().p([(44, 1), (44, 23), (49, 19), (53, 27), (59, 24), (55, 17), (62, 16)]))
    c.paint(cur, WHITE, rim=1)
    c.eye(14, 29, 2.4, 3.2, -1)
    c.eye(24, 24, 2.4, 3.2, -1)
    c.paint(c.m().e(31, 31, 2, 1.2), PU, flat=True)
    return c


def nullptr_back():
    c = C()
    c.paint(c.m().e(19, 60, 7, 3), PU, rim=1, line=True)
    c.paint(c.m().e(43, 60, 7, 3), PU, rim=1, line=True)
    c.paint(c.m().e(32, 42, 26, 22), PU, rim=3)
    c.paint(c.m().e(32, 46, 13, 12), DARK, flat=True)
    c.ink(c.m().e(32, 46, 9.5, 8.5))
    c.ink(c.m().p([(23, 1), (23, 22), (28, 18), (32, 26), (38, 23), (34, 16), (41, 16)]))
    c.paint(c.m().p([(24, 2), (24, 20), (29, 16), (33, 24), (37, 22), (33, 14), (40, 14)]), WHITE, rim=1)
    return c


def cors_front():
    c = C()
    c.paint(c.m().r(15, 55, 27, 61), BRICK, rim=1, line=True)
    c.paint(c.m().r(35, 55, 47, 61), BRICK, rim=1, line=True)
    shield = c.m().p([(3, 26), (15, 24), (15, 46), (9, 54), (3, 46)])
    c.paint(shield, STONE, rim=1, line=True)
    c.ink(c.m().l(6, 31, 12, 41, 1.6)); c.ink(c.m().l(12, 31, 6, 41, 1.6))
    c.paint(c.m().r(47, 32, 58, 44), BRICK, rim=1, line=True)
    body = c.m().r(15, 22, 48, 56).r(15, 12, 23, 22).r(27, 12, 36, 22).r(40, 12, 48, 22)
    c.paint(body, BRICK, rim=3)
    for y in (28, 35, 42, 49):
        c.px[y, 16:48][c.sil[y, 16:48]] = (*BRICK[2], 255)
    for y, xs in ((25, (24, 36)), (31, (20, 30, 42)), (38, (24, 36)), (45, (20, 30, 42)), (52, (24, 36))):
        for x in xs:
            c.px[y:y + 6 if y != 25 else y + 3, x] = (*BRICK[2], 255)
    c.ink(c.m().r(19, 17, 22, 18)); 
    c.eye(22, 27, 2.2, 2.4, -1)
    c.eye(34, 27, 2.2, 2.4, -1)
    c.ink(c.m().p([(20, 56), (20, 42), (24, 38), (30, 36), (36, 38), (40, 42), (40, 56)]))
    for x in (24, 29, 34):
        c.ink(c.m().l(x, 38, x, 55, 1))
    c.ink(c.m().l(21, 46, 40, 46, 1))
    return c


def cors_back():
    c = C()
    c.paint(c.m().r(13, 56, 27, 63), BRICK, rim=1, line=True)
    c.paint(c.m().r(37, 56, 51, 63), BRICK, rim=1, line=True)
    c.paint(c.m().r(2, 30, 14, 46), BRICK, rim=1, line=True)
    c.paint(c.m().r(50, 30, 62, 46), BRICK, rim=1, line=True)
    body = c.m().r(12, 22, 52, 60).r(12, 10, 21, 22).r(26, 10, 38, 22).r(43, 10, 52, 22)
    c.paint(body, BRICK, rim=3)
    for y in range(28, 60, 7):
        c.px[y, 13:52][c.sil[y, 13:52]] = (*BRICK[2], 255)
    for i, y in enumerate(range(22, 60, 7)):
        for x in range(18 + (i % 2) * 7, 52, 14):
            c.px[y + 1:y + 7, x] = (*BRICK[2], 255)
    c.ink(c.m().l(30, 28, 34, 36, 1)); c.ink(c.m().l(34, 36, 31, 42, 1)); c.ink(c.m().l(31, 42, 36, 50, 1))
    c.ink(c.m().l(30, 10, 30, 2, 1))
    c.paint(c.m().p([(31, 2), (44, 5), (31, 9)]), STONE, rim=1)
    return c


def hydration_front():
    c = C()
    sil = c.m().e(32, 41, 20, 19).p([(32, 2), (20, 28), (44, 28)])
    s = sil.arr()
    ys, xs = np.mgrid[0:64, 0:64]
    seam = 32 + ((ys // 3) % 2) * 3 - 1
    left = s & (xs < seam)
    right = s & ~left
    c.paint(left, TEAL, rim=3, shape=s)
    c.paint(right, GOLD, rim=3, shape=s)
    c.px[(s & (xs == seam))] = (*INK, 255)
    c.paint(c.m().e(17, 60, 6, 3), TEAL, rim=1, line=True)
    c.paint(c.m().e(46, 60, 6, 3), GOLD, rim=1, line=True)
    c.eye(22, 38, 3.2, 4.2, -1)
    c.eye(40, 36, 2, 2.4, -1)
    mouth(c, 25, 49, 36, 50)
    c.dot(21, 14, (255, 255, 255), 2, 3)
    return c


def hydration_back():
    c = C()
    sil = c.m().e(32, 43, 24, 21).p([(32, 2), (16, 30), (48, 30)])
    s = sil.arr()
    ys, xs = np.mgrid[0:64, 0:64]
    seam = 32 + ((ys // 3) % 2) * 3 - 1
    left = s & (xs < seam)
    c.paint(left, TEAL, rim=3, shape=s)
    c.paint(s & ~left, GOLD, rim=3, shape=s)
    c.px[(s & (xs == seam))] = (*INK, 255)
    c.paint(c.m().e(10, 60, 7, 3), TEAL, rim=1, line=True)
    c.paint(c.m().e(54, 60, 7, 3), GOLD, rim=1, line=True)
    c.dot(24, 34, (255, 255, 255), 2, 4)
    return c


def race_front():
    c = C()
    for x in (16, 24, 34, 43):
        c.paint(c.m().e(x, 58, 3, 4), DARK, rim=1)
    c.paint(c.m().p([(10, 40), (14, 30), (22, 36)]), BEE, rim=1)
    c.paint(c.m().p([(52, 40), (49, 30), (41, 36)]), BEE, rim=1)
    c.paint(c.m().e(31, 45, 25, 11), BEE, rim=3)
    for x in (16, 28, 40):
        c.paint(c.m().p([(x, 36), (x + 5, 36), (x + 2, 56), (x - 3, 56)]) , DARK, flat=True)
    c.px[~c.sil] = 0
    c.paint(c.m().e(10, 31, 8, 7), BEE, rim=2)
    c.paint(c.m().e(53, 29, 7, 6), BEE, rim=2)
    c.eye(7, 29, 2.4, 3, -1)
    c.eye(13, 29, 1.8, 2.4, -1)
    c.eye(51, 27, 2.2, 2.8, 1)
    c.ink(c.m().l(3, 35, 9, 36, 1))
    c.ink(c.m().l(51, 33, 57, 34, 1))
    c.ink(c.m().l(7, 24, 4, 17, 1)); c.ink(c.m().l(54, 23, 58, 16, 1))
    return c


def race_back():
    c = C()
    for x in (14, 24, 40, 50):
        c.paint(c.m().e(x, 60, 3, 3), DARK, rim=1)
    c.paint(c.m().e(31, 46, 28, 14), BEE, rim=3)
    for x in (14, 26, 38, 49):
        c.paint(c.m().p([(x, 34), (x + 5, 34), (x + 3, 59), (x - 2, 59)]), DARK, flat=True)
    c.paint(c.m().e(8, 34, 7, 6), BEE, rim=2)
    c.paint(c.m().e(55, 34, 7, 6), BEE, rim=2)
    c.ink(c.m().l(5, 29, 2, 22, 1)); c.ink(c.m().l(57, 29, 61, 22, 1))
    c.paint(c.m().r(28, 14, 32, 34), DARK, flat=True)
    for i in range(3):
        for j in range(2):
            c.paint(c.m().r(32 + j * 5, 14 + i * 5, 36 + j * 5, 18 + i * 5), WHITE if (i + j) % 2 else DARK, flat=True)
    return c


def leak_front():
    c = C()
    c.paint(c.m().e(31, 58, 29, 5), PINK, rim=1)
    c.paint(c.m().e(32, 46, 24, 14), PINK, rim=3)
    c.paint(c.m().e(28, 33, 15, 14), PINK, rim=3)
    c.paint(c.m().p([(55, 20), (51, 28), (59, 28)]).e(55, 31, 4, 4), PINK, rim=1)
    c.paint(c.m().p([(5, 36), (2, 42), (8, 42)]).e(5, 44, 3, 3), PINK, rim=1)
    for (x, y, r) in ((40, 44, 3), (46, 51, 2), (18, 50, 2.5)):
        c.paint(c.m().e(x, y, r, r), ramp("#FCE0EE", "#FCE0EE", "#F4B0D0"), rim=1)
    c.eye(21, 32, 3.2, 4.2, -1)
    c.eye(33, 31, 2, 2.6, -1)
    c.ink(c.m().e(27, 42, 5, 3.6))
    c.paint(c.m().p([(24, 44), (24, 52), (28, 54), (28, 44)]), PINK, rim=1)
    return c


def leak_back():
    c = C()
    c.paint(c.m().e(32, 59, 31, 5), PINK, rim=1)
    c.paint(c.m().e(32, 46, 27, 16), PINK, rim=3)
    c.paint(c.m().e(30, 30, 19, 17), PINK, rim=3)
    c.paint(c.m().p([(48, 14), (44, 24), (53, 24)]).e(48.5, 26, 4.5, 4.5), PINK, rim=1)
    c.paint(c.m().p([(10, 40), (6, 50), (14, 50)]).e(10, 52, 4, 4), PINK, rim=1)
    for (x, y, r) in ((22, 26, 4), (36, 36, 5), (26, 46, 3), (46, 46, 3.5), (36, 22, 2.5)):
        c.paint(c.m().e(x, y, r, r), ramp("#FCE0EE", "#FCE0EE", "#F4B0D0"), rim=1)
    return c


def off1_front():
    c = C()
    c.paint(c.m().r(24, 54, 28, 61), DARK, rim=1)
    c.paint(c.m().r(38, 54, 42, 61), DARK, rim=1)
    c.paint(c.m().p([(41, 5), (48, 2), (48, 52), (41, 55)]), WOOD, rim=1, line=True)
    c.paint(c.m().r(18, 6, 41, 55), WOOD, rim=3)
    for i, y in enumerate(range(10, 54, 4)):
        L = 8 if i % 5 == 0 else 4
        c.ink(c.m().r(18, y, 18 + L, y))
    c.eye(32, 22, 4.5, 5.5, -1)
    mouth(c, 26, 36, 38, 36)
    c.paint(c.m().r(48, 44, 61, 56), WOOD, rim=2, line=True)
    for y in (47, 51, 55): c.ink(c.m().r(48, y, 51, y))
    c.ink(c.m().e(56, 50, 1.4, 1.6))
    c.ink(c.m().l(18, 30, 10, 38, 1.4)); c.ink(c.m().l(41, 30, 47, 38, 1.4))
    return c


def off1_back():
    c = C()
    c.paint(c.m().r(24, 56, 29, 63), DARK, rim=1)
    c.paint(c.m().r(38, 56, 43, 63), DARK, rim=1)
    c.paint(c.m().r(14, 3, 46, 58), WOOD, rim=3)
    c.ink(c.m().l(20, 14, 30, 16, 1)); c.ink(c.m().l(30, 16, 28, 26, 1))
    for y in (30, 36, 42):
        c.ink(c.m().r(22, y, 38, y))
    c.paint(c.m().r(47, 44, 62, 58), WOOD, rim=2, line=True)
    c.ink(c.m().r(52, 49, 57, 53))
    return c


def ghost_shape(c, big):
    sc = 1.15 if big else 1.0
    cy = 38 if big else 34
    m = c.m().e(32, cy - 6, 20 * sc, 20 * sc).r(32 - 20 * sc, cy - 6, 32 + 20 * sc, cy + 16)
    for i in range(5):
        x = 32 - 20 * sc + 4 * sc + i * 8 * sc
        m.e(x, cy + 16, 4.2 * sc, 8)
    for i in range(4):
        x = 32 - 20 * sc + 8 * sc + i * 8 * sc
        m.cut_e(x, cy + 25, 4 * sc, 6)
    return m


def ghost_front():
    c = C()
    m = c.m().e(32, 26, 19, 19).r(13, 26, 51, 50)
    for i in range(5):
        m.e(17 + i * 7.5, 50, 4.2, 8)
    for i in range(4):
        m.cut_e(21 + i * 7.5, 61, 4.1, 6)
    m.cut_e(51, 22, 6, 6); m.cut_e(48, 38, 4, 4); m.cut_e(14, 44, 3, 3)
    c.paint(m, GH, rim=3)
    c.paint(c.m().e(7, 38, 4, 7), GH, rim=1, line=True)
    c.ink(c.m().e(23, 25, 3.5, 5)); c.ink(c.m().e(37, 25, 3.5, 5))
    c.dot(21, 23, GH[1], 2, 2); c.dot(35, 23, GH[1], 2, 2)
    c.ink(c.m().l(23, 38, 37, 38, 1.2))
    for x in (25, 29, 33): c.ink(c.m().l(x, 36, x, 40, 1))
    for (x, y) in ((56, 14), (59, 20), (54, 30), (4, 52)):
        c.paint(c.m().r(x, y, x + 2, y + 2), GH, rim=1)
    return c


def ghost_back():
    c = C()
    m = c.m().e(32, 28, 22, 22).r(10, 28, 54, 52)
    for i in range(6):
        m.e(14 + i * 7.2, 52, 4.2, 9)
    for i in range(5):
        m.cut_e(17.5 + i * 7.2, 63, 4, 6)
    m.cut_e(9, 26, 6, 6); m.cut_e(22, 44, 4, 4); m.cut_e(52, 46, 3, 3)
    c.paint(m, GH, rim=3)
    for y, x0, x1 in ((22, 18, 40), (28, 18, 46), (34, 18, 34), (40, 24, 44)):
        c.ink(c.m().r(x0, y, x1, y))
    c.paint(c.m().e(57, 36, 4, 7), GH, rim=1, line=True)
    for (x, y) in ((2, 12), (5, 18), (58, 10), (60, 18)):
        c.paint(c.m().r(x, y, x + 2, y + 2), GH, rim=1)
    return c


CREATURES = {
    "react": (react_front, react_back), "node": (node_front, node_back), "claude": (claude_front, claude_back),
    "null-pointer": (nullptr_front, nullptr_back), "cors": (cors_front, cors_back),
    "hydration": (hydration_front, hydration_back), "race-condition": (race_front, race_back),
    "memory-leak": (leak_front, leak_back), "off-by-one": (off1_front, off1_back),
    "silent-data-loss": (ghost_front, ghost_back),
}


def build():
    for k, (f, b) in CREATURES.items():
        f().finish(os.path.join(OUT, "creatures", f"{k}-front.png"))
        b().finish(os.path.join(OUT, "creatures", f"{k}-back.png"))


if __name__ == "__main__":
    build()
