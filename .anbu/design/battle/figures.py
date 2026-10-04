"""Nine full-body trainers drawn from scratch, same footprint as the champion (about 30x62, centred, feet on bottom rows)."""
from lib import *


def R(base):
    b = hx(base)
    mix = lambda a, c, t: tuple(int(a[i] * (1 - t) + c[i] * t) for i in range(3))
    return (mix(b, (255, 255, 255), 0.3), b, mix(b, INK, 0.38))


def rect_poly(c, pts, rp, rim=1, line=False):
    c.paint(c.m().p(pts), rp, rim=rim, line=line)


def body(c, skin, shirt, pants, shoe, skirt=None, arms=None, hands=None):
    skin, shirt, pants, shoe = R(skin), R(shirt), R(pants), R(shoe)
    arms = R(arms) if arms else shirt
    hands = R(hands) if hands else skin
    if skirt:
        c.paint(c.m().e(26, 60, 4, 2.4), shoe, rim=1); c.paint(c.m().e(38, 60, 4, 2.4), shoe, rim=1)
    else:
        c.paint(c.m().r(23, 40, 31, 57), pants, rim=1)
        c.paint(c.m().r(33, 40, 41, 57), pants, rim=1)
        c.paint(c.m().e(26, 59, 5.2, 3), shoe, rim=1, line=True); c.paint(c.m().e(38, 59, 5.2, 3), shoe, rim=1, line=True)
        c.ink(c.m().r(32, 41, 32, 56))
    c.paint(c.m().e(19.5, 33, 3.6, 9.5), arms, rim=1, line=True)
    c.paint(c.m().e(44.5, 33, 3.6, 9.5), arms, rim=1, line=True)
    c.paint(c.m().e(19, 43.5, 2.6, 2.6), hands, rim=1); c.paint(c.m().e(45, 43.5, 2.6, 2.6), hands, rim=1)
    c.paint(c.m().p([(22, 25), (42, 25), (41, 42), (23, 42)]).e(32, 25, 10, 3), shirt, rim=2)
    if skirt:
        sk = R(skirt)
        c.paint(c.m().p([(23, 38), (41, 38), (46, 60), (18, 60)]), sk, rim=2)
        c.ink(c.m().l(32, 44, 32, 59, 1)) if False else None
    c.paint(c.m().r(29, 21, 35, 27), skin, rim=1)


def head(c, skin, rx=9, ry=10.5, cy=13):
    sk = R(skin)
    c.paint(c.m().e(23.2, cy + 1, 2, 3), sk, rim=1); c.paint(c.m().e(40.8, cy + 1, 2, 3), sk, rim=1)
    c.paint(c.m().e(32, cy, rx, ry), sk, rim=2)


def face(c, eyes="dots", y=15, mouth_y=20, color=INK):
    if eyes == "dots":
        c.put(c.m().r(27, y, 29, y + 2).arr(), color); c.put(c.m().r(35, y, 37, y + 2).arr(), color)
    c.ink(c.m().l(30, mouth_y, 34, mouth_y, 1))


def core():
    c = C()
    body(c, "#f2ad7d", "#8f3e56", "#6b4a3a", "#3b3643", arms="#8f3e56")
    c.paint(c.m().e(21.5, 26.5, 5, 3.4), R("#ef914f"), rim=1, line=True); c.paint(c.m().e(42.5, 26.5, 5, 3.4), R("#ef914f"), rim=1, line=True)
    c.paint(c.m().r(23, 36, 41, 39), R("#ef914f"), rim=1)
    head(c, "#f2ad7d")
    hair = R("#f1c471")
    c.paint(c.m().e(32, 10.5, 12, 8.5).r(20, 10, 24, 19).r(40, 10, 44, 19), hair, rim=2)
    c.ink(c.m().l(26, 14.5, 30, 15.5, 1.6)); c.ink(c.m().l(34, 15.5, 38, 14.5, 1.6))
    c.put(c.m().r(27, 17, 28, 18).arr(), INK); c.put(c.m().r(36, 17, 37, 18).arr(), INK)
    c.ink(c.m().l(30, 21, 34, 21, 1))
    return c


def design():
    c = C()
    c.paint(c.m().e(32, 17, 12.5, 15).r(19.5, 14, 44.5, 33), R("#f1c471"), rim=2)
    body(c, "#ef914f", "#cf736d", "#3a6466", "#2b3a5c")
    c.paint(c.m().p([(22, 26), (28, 25), (42, 41), (36, 42)]), R("#548789"), rim=1)
    c.paint(c.m().r(23, 38, 41, 41), R("#79b8ce"), rim=1)
    head(c, "#ef914f")
    c.paint(c.m().e(32, 8, 11.5, 6).r(20.5, 8, 24, 20).r(40, 8, 43.5, 20), R("#f1c471"), rim=2)
    c.paint(c.m().r(21, 7, 43, 10.5), R("#548789"), rim=1)
    c.ink(c.m().l(26.5, 16, 30, 16.5, 1.2)); c.ink(c.m().l(34, 16.5, 37.5, 16, 1.2))
    c.ink(c.m().l(30.5, 21, 33.5, 21, 1))
    return c


def monorepo():
    c = C()
    body(c, "#ef914f", "#91522c", "#3b3643", "#3b3643")
    c.paint(c.m().p([(21, 30), (43, 30), (45, 52), (19, 52)]), R("#91522c"), rim=2)
    c.paint(c.m().r(22, 38, 42, 41), R("#3b3643"), rim=1)
    c.paint(c.m().p([(23, 24), (41, 24), (39, 30), (25, 30)]).e(32, 24, 9, 3), R("#d14b34"), rim=1)
    head(c, "#ef914f")
    c.paint(c.m().r(24, 12, 40, 16.5), R("#3b3643"), rim=1)
    c.put(c.m().r(26, 13, 28, 13).arr(), (200, 215, 230))
    c.ink(c.m().l(30, 21, 34, 21, 1))
    hat = R("#f2eaf1")
    c.paint(c.m().e(32, 7, 9.5, 6.5), hat, rim=2)
    c.paint(c.m().r(22.5, 6, 41.5, 9), R("#a3754e"), rim=1)
    c.paint(c.m().e(32, 9.5, 15.5, 3.2), hat, rim=1, line=True)
    return c


def cross():
    c = C()
    body(c, "#ef914f", "#d14b34", "#f2eaf1", "#3b3643", arms="#d14b34")
    c.paint(c.m().p([(26, 25), (32, 33), (38, 25), (36, 25), (32, 30), (28, 25)]), R("#f2eaf1"), rim=1)
    c.paint(c.m().r(22, 37, 42, 40), R("#f2eaf1"), rim=1)
    head(c, "#ef914f")
    wh = R("#f2eaf1")
    c.paint(c.m().e(32, 8.5, 12.5, 8).e(21, 14, 3.5, 5.5).e(43, 14, 3.5, 5.5), wh, rim=2)
    c.ink(c.m().l(25.5, 12.5, 30, 14.5, 1.8)); c.ink(c.m().l(38.5, 12.5, 34, 14.5, 1.8))
    c.put(c.m().r(27, 16, 29, 17).arr(), INK); c.put(c.m().r(35, 16, 37, 17).arr(), INK)
    c.paint(c.m().e(32, 20.5, 6.5, 2.8).e(32, 25, 4.5, 3.5), wh, rim=1)
    return c


def backend():
    c = C()
    body(c, "#ef914f", "#d14b34", "#3b3643", "#2b2f3d")
    c.paint(c.m().p([(22, 25), (29, 25), (29, 42), (23, 42)]), R("#345a52"), rim=1)
    c.paint(c.m().p([(35, 25), (42, 25), (41, 42), (35, 42)]), R("#345a52"), rim=1)
    c.paint(c.m().r(23, 37, 41, 40), R("#d3a2c0"), rim=1)
    c.paint(c.m().e(32, 12, 12, 11.5), R("#4e484a"), rim=2)
    head(c, "#ef914f", rx=7.8, ry=8.5, cy=15)
    c.paint(c.m().p([(21, 6), (43, 6), (41, 9), (23, 9)]).e(32, 7, 10.5, 4), R("#4e484a"), rim=1)
    c.paint(c.m().p([(29, 6), (31, 1), (36, 1), (36, 6)]), R("#56864c"), rim=1)
    c.put(c.m().r(28, 15, 30, 17).arr(), INK); c.put(c.m().r(35, 15, 37, 17).arr(), INK)
    c.ink(c.m().l(30, 21, 34, 21, 1))
    return c


def dsa():
    c = C()
    body(c, "#d78b4a", "#f1c471", "#8f3e56", "#a3754e", arms="#d78b4a", hands="#f1c471")
    c.paint(c.m().r(28, 26, 36, 52), R("#8f3e56"), rim=1)
    c.paint(c.m().r(22, 37, 42, 40), R("#d14b34"), rim=1)
    c.paint(c.m().e(22, 26, 5, 3.4).e(42, 26, 5, 3.4), R("#f1c471"), rim=1, line=True)
    gold = R("#f1c471")
    c.paint(c.m().p([(20, 8), (14, 3), (14, 13), (21, 14)]), R("#f2eaf1"), rim=1)
    c.paint(c.m().p([(44, 8), (50, 3), (50, 13), (43, 14)]), R("#f2eaf1"), rim=1)
    c.paint(c.m().e(32, 13, 11.5, 11.5), gold, rim=2)
    c.paint(c.m().e(32, 17, 7.5, 6.5), R("#d78b4a"), rim=1)
    c.ink(c.m().r(26, 15, 38, 16.6))
    c.paint(c.m().e(32, 21.5, 3.4, 1.8), R("#d14b34"), flat=True)
    c.ink(c.m().e(32, 21.5, 2, 0.9))
    return c


def machine():
    c = C()
    g, gd = R("#8d977f"), R("#5f7160")
    c.paint(c.m().r(23, 39, 31, 56), gd, rim=1); c.paint(c.m().r(33, 39, 41, 56), gd, rim=1)
    c.paint(c.m().r(21, 56, 31, 61), g, rim=1, line=True); c.paint(c.m().r(33, 56, 43, 61), g, rim=1, line=True)
    c.paint(c.m().r(15, 26, 22, 42), gd, rim=1, line=True); c.paint(c.m().r(42, 26, 49, 42), gd, rim=1, line=True)
    c.paint(c.m().r(16, 42, 22, 46), g, rim=1, line=True); c.paint(c.m().r(42, 42, 48, 46), g, rim=1, line=True)
    c.paint(c.m().r(21, 24, 43, 42), g, rim=2)
    c.paint(c.m().r(26, 28, 38, 36), R("#f2eaf1"), rim=1, line=True)
    c.put(c.m().r(28, 31, 30, 33).arr(), hx("#e0394c")); c.put(c.m().r(34, 31, 36, 33).arr(), hx("#3FBF5A"))
    c.paint(c.m().r(29, 22, 35, 26), gd, rim=1)
    c.paint(c.m().e(32, 13, 11, 10.5), g, rim=2)
    for x in (27, 32, 37): c.put(c.m().r(x, 3, x, 7).arr(), gd[1])
    c.paint(c.m().r(24, 9, 40, 19), R("#f2eaf1"), rim=1, line=True)
    c.put(c.m().r(27, 12, 29, 14).arr(), hx("#e0394c")); c.put(c.m().r(35, 12, 37, 14).arr(), hx("#e0394c"))
    c.put(c.m().r(29, 16, 35, 16).arr(), hx("#e0394c"))
    return c


def system():
    c = C()
    c.paint(c.m().e(32, 15, 12.5, 13).r(19.5, 15, 44.5, 29), R("#e0394c"), rim=2)
    body(c, "#f2ad7d", "#4e484a", "#4e484a", "#2b2f3d", skirt="#4e484a", arms="#4e484a")
    c.paint(c.m().p([(26, 25), (32, 34), (38, 25), (36, 25), (32, 31), (28, 25)]), R("#cf736d"), rim=1)
    c.paint(c.m().r(23, 37, 41, 40), R("#5f7160"), rim=1)
    c.paint(c.m().r(18, 57, 46, 60), R("#cf736d"), rim=1)
    head(c, "#f2ad7d")
    c.paint(c.m().e(32, 8, 11, 6).r(21, 8, 24.5, 17).r(39.5, 8, 43, 17), R("#e0394c"), rim=2)
    c.paint(c.m().e(41, 5, 3.4, 2.6), R("#8f3e56"), rim=1)
    c.put(c.m().r(27, 15, 29, 17).arr(), hx("#8f3e56")); c.put(c.m().r(35, 15, 37, 17).arr(), hx("#8f3e56"))
    c.put(c.m().r(28, 15, 28, 15).arr(), hx("#e0394c")); c.put(c.m().r(36, 15, 36, 15).arr(), hx("#e0394c"))
    c.ink(c.m().l(30.5, 21, 33.5, 21, 1))
    return c


def behavioral():
    c = C()
    c.paint(c.m().e(32, 15, 12.5, 13).r(19.5, 15, 44.5, 34), R("#4e484a"), rim=2)
    body(c, "#a3754e", "#f1c471", "#f1c471", "#965340", skirt="#f1c471", arms="#f1c471")
    c.paint(c.m().r(22, 36, 42, 40), R("#8d977f"), rim=1)
    c.paint(c.m().p([(26, 25), (32, 31), (38, 25)]).e(32, 25, 6, 2), R("#965340"), rim=1)
    c.paint(c.m().r(18, 57, 46, 60), R("#965340"), rim=1)
    head(c, "#a3754e")
    c.paint(c.m().e(32, 8, 11, 6).r(21, 8, 24.5, 18).r(39.5, 8, 43, 18), R("#4e484a"), rim=2)
    c.paint(c.m().e(40.5, 6, 3.6, 3.6), R("#e0394c"), rim=1, line=True)
    c.put(c.m().r(27, 15, 29, 17).arr(), INK); c.put(c.m().r(35, 15, 37, 17).arr(), INK)
    c.ink(c.m().l(30, 20.5, 34, 20.5, 1))
    return c


FIG = {"core": core, "design": design, "monorepo": monorepo, "cross": cross, "backend": backend,
       "dsa": dsa, "machine-coding": machine, "system-design": system, "behavioral": behavioral}


def build():
    for k, f in FIG.items():
        f().finish(os.path.join(OUT, "trainers", f"{k}.png"))


if __name__ == "__main__":
    build()
