#!/usr/bin/env python3
"""Turn source/front-cutout.png into game-sized pixel art: BOX downscale, snap to <=16 palette colors, drop stray pixels."""
from PIL import Image
import numpy as np, os
here = os.path.dirname(os.path.abspath(__file__))
cut = Image.open(os.path.join(here, "source", "front-cutout.png")).convert("RGBA")  # 231 x 494
OUTLINE = (20, 27, 27)
PORTRAIT_BG = (84, 135, 137)
PAL = [OUTLINE, (26, 31, 46), (43, 52, 72), (66, 78, 104),
       (198, 138, 91), (143, 90, 56), (224, 170, 120),
       (242, 244, 248), (201, 211, 227), (150, 168, 196),
       (43, 58, 92), (30, 40, 68)]
P = np.array(PAL, dtype=float)
W = np.array([0.30, 0.59, 0.11])


def box(img, size):
    return img.convert("RGBa").resize(size, Image.BOX).convert("RGBA")


def snap(img):
    a = np.array(img)
    rgb = a[..., :3].astype(float)
    d = (((rgb[:, :, None, :] - P[None, None, :, :]) ** 2) * W).sum(3)
    idx = d.argmin(2)
    mask = a[..., 3] >= 128
    return idx, mask


def clean(idx, mask, passes=2):
    h, w = idx.shape
    for _ in range(passes):
        out = idx.copy()
        for y in range(h):
            for x in range(w):
                if not mask[y, x]:
                    continue
                nb = [idx[j, i] for j in range(max(0, y - 1), min(h, y + 2)) for i in range(max(0, x - 1), min(w, x + 2))
                      if (j, i) != (y, x) and mask[j, i]]
                same = sum(1 for n in nb if n == idx[y, x])
                if same == 0 and nb:
                    out[y, x] = max(set(nb), key=nb.count)
        idx = out
    return idx


HAIR_Y = 0.30


def smooth_hair(idx, mask, passes=2):
    h, w = idx.shape
    for _ in range(passes):
        out = idx.copy()
        for y in range(h):
            for x in range(w):
                if not mask[y, x] or idx[y, x] not in (1, 2, 3) or y >= HAIR_Y * h:
                    continue
                nb = [idx[j, i] for j in range(max(0, y - 1), min(h, y + 2)) for i in range(max(0, x - 1), min(w, x + 2))
                      if mask[j, i] and idx[j, i] in (1, 2, 3)]
                best = max((1, 2, 3), key=lambda c: (nb.count(c), -c))
                out[y, x] = best if nb.count(best) >= 5 else 1
        idx = out
    return idx


def outline_edges(idx, mask):
    h, w = idx.shape
    out = idx.copy()
    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                continue
            for j, i in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 1, x - 1), (y - 1, x + 1), (y + 1, x - 1), (y + 1, x + 1)):
                if 0 <= j < h and 0 <= i < w and not mask[j, i]:
                    out[y, x] = 0
    return out


def render(idx, mask, bg=None):
    h, w = idx.shape
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0) if bg is None else bg + (255,))
    for y in range(h):
        for x in range(w):
            if mask[y, x]:
                im.putpixel((x, y), PAL[idx[y, x]] + (255,))
    return im


def export(name, crop, size, bg=None, scale=8):
    sq = cut.crop(crop) if crop[0] >= 0 else None
    if sq is None:
        sq = Image.new("RGBA", (crop[2] - crop[0], crop[3] - crop[1]), (0, 0, 0, 0))
        sq.paste(cut, (-crop[0], -crop[1]))
    small = box(sq, size)
    idx, mask = snap(small)
    idx = clean(idx, mask)
    idx = smooth_hair(idx, mask)
    idx = outline_edges(idx, mask)
    idx = clean(idx, mask, 1)
    im = render(idx, mask, bg)
    im.save(os.path.join(here, f"{name}-{size[0]}x{size[1]}.png"))
    prev = Image.new("RGBA", (size[0] * scale, size[1] * scale), (150, 170, 150, 255))
    up = im.resize(prev.size, Image.NEAREST)
    prev.paste(up, (0, 0), up)
    prev.save(os.path.join(here, f"{name}-preview-{scale}x.png"))
    cols = len(set(idx[mask].tolist()))
    print(name, size, cols, "colors")
    return im


export("dialog-portrait", (-16, -10, 246, 252), (38, 38), bg=PORTRAIT_BG)
export("trainer-card-photo", (0, 0, 231, 308), (48, 64))
export("champion-battle-front", (0, 0, 231, 494), (30, 64), scale=6)
