"""Battle backgrounds, 320x180: wall/sky band, ground, two ellipse platforms (enemy top right, player bottom left)."""
from lib import *

W, H, HOR = 320, 180, 60
ENEMY = (248, 74, 52, 10)
PLAYER = (90, 126, 60, 13)


def ell(cx, cy, rx, ry):
    ys, xs = np.mgrid[0:H, 0:W]
    return ((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2 <= 1


class B:
    def __init__(self):
        self.a = np.zeros((H, W, 3), np.uint8)
        self.rng = np.random.RandomState(7)

    def fill(self, y0, y1, c):
        self.a[y0:y1] = hx(c)

    def rect(self, x0, y0, x1, y1, c):
        self.a[max(y0, 0):y1, max(x0, 0):x1] = hx(c)

    def blob(self, cx, cy, rx, ry, c):
        self.a[ell(cx, cy, rx, ry)] = hx(c)

    def stripes(self, y0, y1, c1, c2, step=4):
        for y in range(y0, y1):
            self.a[y] = hx(c1 if ((y - y0) // step) % 2 == 0 else c2)

    def platform(self, spec, top, rim, shade):
        cx, cy, rx, ry = spec
        self.a[ell(cx, cy + 2, rx + 3, ry + 3)] = hx(shade)
        self.a[ell(cx, cy, rx + 2, ry + 2)] = hx(rim)
        self.a[ell(cx, cy, rx, ry)] = hx(top)
        hi = ell(cx, cy, rx, ry) & ~ell(cx + 2, cy + 2, rx, ry)
        self.a[hi] = tuple(min(255, v + 18) for v in hx(top))

    def save(self, name):
        p = os.path.join(OUT, "bg", f"{name}.png")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        Image.fromarray(self.a, "RGB").save(p)
        return p


def cloud(b, x, y, s=1):
    for dx, dy, rx, ry in ((0, 0, 14, 5), (-9, 2, 9, 4), (10, 2, 10, 4), (2, -4, 8, 4)):
        b.blob(x + dx * s, y + dy * s, rx * s, ry * s, "#F4FAFF")
    b.rect(int(x - 20 * s), int(y + 4 * s), int(x + 20 * s), int(y + 7 * s), "#F4FAFF")
    b.rect(int(x - 20 * s), int(y + 7 * s), int(x + 20 * s), int(y + 8 * s), "#D6EAF7")


def grass():
    b = B()
    b.fill(0, HOR, "#A8DCF4")
    for i, y in enumerate((0, 20, 36)):
        b.fill(y, y + (20 if i == 0 else 16), ["#A0D6F2", "#A8DCF4", "#B4E2F6"][i])
    cloud(b, 58, 22); cloud(b, 170, 14, 0.8); cloud(b, 262, 30, 0.9)
    for cx, r in ((20, 14), (62, 20), (120, 12), (176, 18), (230, 13), (290, 20)):
        b.blob(cx, HOR, r, r * 0.8, "#6DB65F")
    b.rect(0, HOR - 2, W, HOR, "#4E9A41")
    b.stripes(HOR, H, "#5DAA4E", "#56A247", 4)
    b.rect(0, HOR, W, HOR + 2, "#4E9A41")
    for _ in range(46):
        x, y = b.rng.randint(0, W), b.rng.randint(HOR + 6, H - 2)
        c = ["#F7F5EA", "#F2D277", "#7BC46C"][b.rng.randint(0, 3)]
        b.rect(x, y, x + 2, y + 1, c)
    b.platform(ENEMY, "#D9C58A", "#4E9A41", "#468C3A"); b.platform(PLAYER, "#D9C58A", "#4E9A41", "#468C3A")
    return b.save("grass")


def jungle():
    b = B()
    b.fill(0, HOR, "#1F5A3A")
    b.stripes(0, HOR, "#1F5A3A", "#246442", 6)
    for _ in range(70):
        x, y, r = b.rng.randint(0, W), b.rng.randint(0, HOR - 6), b.rng.randint(5, 13)
        b.blob(x, y, r, r * 0.6, ["#2E7A4A", "#3A8F55", "#17482F"][b.rng.randint(0, 3)])
    for x in (30, 112, 206, 296):
        b.rect(x, 0, x + 8, HOR + 4, "#5C4630"); b.rect(x, 0, x + 2, HOR + 4, "#78603F"); b.rect(x + 6, 0, x + 8, HOR + 4, "#43321F")
    for x in (14, 70, 160, 250, 310):
        b.rect(x, 0, x + 2, b.rng.randint(22, 48), "#3A8F55")
    b.rect(0, HOR - 6, W, HOR, "#123A26")
    b.stripes(HOR, H, "#3E8A45", "#37803E", 4)
    b.rect(0, HOR, W, HOR + 2, "#2B6A33")
    for _ in range(60):
        x, y = b.rng.randint(0, W), b.rng.randint(HOR + 4, H - 2)
        b.rect(x, y, x + 3, y + 1, ["#2B6A33", "#5BAA55", "#7BC46C"][b.rng.randint(0, 3)])
    for x in (150, 275):
        b.blob(x, HOR + 30, 8, 4, "#C8493F"); b.rect(x - 1, HOR + 30, x + 1, HOR + 36, "#F7F5EA")
    b.platform(ENEMY, "#A58B5A", "#5E7F3A", "#2B6A33"); b.platform(PLAYER, "#A58B5A", "#5E7F3A", "#2B6A33")
    return b.save("jungle")


def city():
    b = B()
    b.fill(0, HOR, "#BCD0E6"); b.fill(0, 24, "#AFC6E0"); b.fill(40, HOR, "#CBDAEA")
    for x0, w, h, c in ((0, 30, 38, "#7E8BA6"), (34, 22, 28, "#92A0B8"), (60, 36, 46, "#6F7C96"), (100, 26, 30, "#8794AE"),
                        (130, 40, 40, "#7A88A3"), (176, 24, 26, "#93A1B9"), (204, 34, 48, "#6F7C96"), (242, 28, 34, "#8996B0"), (274, 46, 42, "#7E8BA6")):
        b.rect(x0, HOR - h, x0 + w, HOR, c)
        for wy in range(HOR - h + 5, HOR - 4, 7):
            for wx in range(x0 + 4, x0 + w - 4, 7):
                b.rect(wx, wy, wx + 3, wy + 3, "#FFD878" if b.rng.rand() < 0.35 else "#566580")
    b.rect(0, HOR - 1, W, HOR + 6, "#9AA3B8"); b.rect(0, HOR + 6, W, HOR + 7, "#6B7283")
    b.stripes(HOR + 7, H, "#7C8497", "#757D90", 4)
    for x in range(8, W, 40): b.rect(x, HOR + 34, x + 20, HOR + 36, "#F2D277")
    for x in range(0, W, 24): b.rect(x, HOR + 80, x + 12, HOR + 81, "#8F97AB")
    b.platform(ENEMY, "#C9CDDA", "#8E96AB", "#5E667B"); b.platform(PLAYER, "#C9CDDA", "#8E96AB", "#5E667B")
    return b.save("city")


def gym():
    b = B()
    b.fill(0, HOR, "#E8E1C8")
    for x in range(0, W, 32): b.rect(x, 0, x + 1, HOR, "#D2CAA8")
    b.rect(0, 0, W, 4, "#B5AC88"); b.rect(0, HOR - 8, W, HOR, "#B5AC88"); b.rect(0, HOR - 9, W, HOR - 8, "#CFC7A6")
    for x, c in ((40, "#3CC6E8"), (140, "#E8793A"), (220, "#5AB552"), (290, "#C8493F")):
        b.rect(x, 4, x + 22, 36, c); b.rect(x, 36, x + 22, 40, c)
        b.rect(x + 9, 40, x + 13, 44, c)
        b.blob(x + 11, 18, 6, 6, "#F7F5EA"); b.blob(x + 11, 18, 3, 3, c)
        b.rect(x, 4, x + 22, 6, "#1B1F2E")
    b.stripes(HOR, H, "#C98E5A", "#BE8450", 8)
    for y in range(HOR, H, 8): b.rect(0, y, W, y + 1, "#A66E3F")
    for y in range(HOR, H, 16):
        for x in range((y // 16) % 2 * 20, W, 40): b.rect(x, y, x + 1, y + 8, "#A66E3F")
    b.rect(0, HOR, W, HOR + 2, "#8E5A33")
    b.platform(ENEMY, "#4A90C8", "#F7F5EA", "#8E5A33"); b.platform(PLAYER, "#4A90C8", "#F7F5EA", "#8E5A33")
    for spec in (ENEMY, PLAYER):
        cx, cy, rx, ry = spec
        ring = ell(cx, cy, rx * 0.6, ry * 0.6) & ~ell(cx, cy, rx * 0.5, ry * 0.5)
        b.a[ring] = hx("#7DB6E0")
    return b.save("gym")


def elite():
    b = B()
    b.fill(0, HOR, "#141B3E")
    b.stripes(0, HOR, "#141B3E", "#18214A", 6)
    for x in (24, 112, 208, 296):
        b.rect(x - 10, 0, x + 10, HOR, "#2B3560"); b.rect(x - 10, 0, x - 7, HOR, "#4A5590"); b.rect(x + 7, 0, x + 10, HOR, "#1B2348")
        b.rect(x - 13, 0, x + 13, 5, "#4A5590"); b.rect(x - 13, HOR - 6, x + 13, HOR, "#4A5590")
    for _ in range(40):
        x, y = b.rng.randint(0, W), b.rng.randint(0, HOR - 8)
        b.rect(x, y, x + 1, y + 1, "#FFD878")
    b.rect(0, HOR - 2, W, HOR, "#E8B931")
    for y in range(HOR, H, 10):
        for x in range(((y - HOR) // 10 % 2) * 14 - 14, W, 28):
            for k in (0, 1):
                b.rect(x + 14 * k, y, min(x + 14 * k + 14, W), min(y + 10, H), "#2B3560" if k else "#232C52")
    b.rect(0, HOR, W, HOR + 2, "#0F1536")
    b.platform(ENEMY, "#3B4580", "#E8B931", "#0F1536"); b.platform(PLAYER, "#3B4580", "#E8B931", "#0F1536")
    return b.save("elite")


def build():
    return [f() for f in (grass, jungle, city, gym, elite)]


if __name__ == "__main__":
    build()
