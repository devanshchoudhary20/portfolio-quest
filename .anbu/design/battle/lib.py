"""Tiny sprite toolkit: supersampled shape masks, 3-tone cel shading, 1px ink outline."""
import numpy as np
from PIL import Image, ImageDraw
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "assets", "battle")
INK = (0x1B, 0x1F, 0x2E)
SS = 4


def hx(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def ramp(light, base, dark):
    return (hx(light), hx(base), hx(dark))


CY = ramp("#9BE6F5", "#3CC6E8", "#1E8BAE")
GR = ramp("#A0DC8A", "#5AB552", "#2F7A38")
OR = ramp("#F7B173", "#E8793A", "#B04A1E")
YL = ramp("#FFF0A8", "#FFD060", "#D08A20")
CREAM = ramp("#FFFFFF", "#FBE9C4", "#D9BE8A")
WHITE = ramp("#FFFFFF", "#F7F5EA", "#C9CDDA")


class M:
    """Shape mask builder in 64x64 coordinates (float ok)."""

    def __init__(self, w=64, h=64):
        self.w, self.h = w, h
        self.im = Image.new("L", (w * SS, h * SS), 0)
        self.d = ImageDraw.Draw(self.im)

    def _s(self, v):
        return [x * SS for x in v]

    def e(self, cx, cy, rx, ry, v=255):
        self.d.ellipse(self._s([cx - rx, cy - ry, cx + rx, cy + ry]), fill=v); return self

    def r(self, x0, y0, x1, y1, v=255):
        self.d.rectangle(self._s([x0, y0, x1, y1]), fill=v); return self

    def p(self, pts, v=255):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=v); return self

    def l(self, x0, y0, x1, y1, w=2, v=255):
        self.d.line(self._s([x0, y0, x1, y1]), fill=v, width=int(w * SS)); return self

    def cut_e(self, *a): return self.e(*a, v=0)
    def cut_r(self, *a): return self.r(*a, v=0)
    def cut_p(self, pts): return self.p(pts, v=0)
    def cut_l(self, *a, w=2): return self.l(*a, w=w, v=0)

    def arr(self):
        a = np.asarray(self.im.resize((self.w, self.h), Image.BOX), dtype=np.float32)
        return a > 127


def shift(m, dx, dy):
    o = np.zeros_like(m)
    h, w = m.shape
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    o[yd, xd] = m[ys, xs]
    return o


def erode(m):
    return m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)


def dilate(m):
    return m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)


class C:
    def __init__(self, w=64, h=64):
        self.w, self.h = w, h
        self.px = np.zeros((h, w, 4), np.uint8)
        self.sil = np.zeros((h, w), bool)

    def m(self):
        return M(self.w, self.h)

    def put(self, mask, color):
        self.px[mask] = (*color, 255)
        self.sil |= mask

    def paint(self, mask, rp, rim=2, shape=None, line=False, flat=False):
        """Fill mask with base, top-left rim light, bottom-right rim dark."""
        if isinstance(mask, M):
            mask = mask.arr()
        sh = mask if shape is None else (shape.arr() if isinstance(shape, M) else shape)
        light, base, dark = rp
        self.put(mask, base)
        if not flat:
            self.put(mask & sh & ~shift(sh, rim, rim), light)
            self.put(mask & sh & ~shift(sh, -rim, -rim), dark)
        if line:
            self.put(mask & ~erode(mask), INK)
        return mask

    def ink(self, mask):
        if isinstance(mask, M):
            mask = mask.arr()
        self.put(mask, INK)

    def dot(self, x, y, color, w=1, h=1):
        m = np.zeros((self.h, self.w), bool)
        m[int(y):int(y) + h, int(x):int(x) + w] = True
        self.put(m, color)

    def eye(self, cx, cy, rx=2.5, ry=3.5, look=-1):
        self.paint(self.m().e(cx, cy, rx, ry), WHITE, flat=True)
        self.ink(self.m().e(cx + look * 0.8, cy + 0.5, rx * 0.55, ry * 0.65))
        self.dot(cx + look * 0.8 - 0.5, cy - 0.5, (255, 255, 255))

    def finish(self, path=None):
        alpha = self.px[..., 3] > 0
        edge = dilate(alpha) & ~alpha
        self.px[edge] = (*INK, 255)
        im = Image.fromarray(self.px, "RGBA")
        if path:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            im.save(path)
        return im
