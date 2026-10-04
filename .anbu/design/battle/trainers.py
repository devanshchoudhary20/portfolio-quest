"""Champion only: placed centred, not redrawn. The nine other trainers are drawn in figures.py."""
from lib import *
V = os.path.join(ROOT, "vendor", "ninja-adventure", "Actor", "Character")
NPC = os.path.join(ROOT, "public", "assets", "ninja-adventure")
CHAMP = os.path.join(ROOT, ".anbu", "design", "avatar", "champion-battle-front-30x64.png")
PACK_OUTLINE = (0x14, 0x1B, 0x1B)

# id -> source frame file (frame 0,0 = facing down, idle)
LEADERS = {k: os.path.join(NPC, f"{k}-sheet.png") for k in ("core", "design", "monorepo", "cross", "backend")}
ELITE = {"dsa": "KnightGold", "machine-coding": "RobotGrey", "system-design": "SorcererBlack", "behavioral": "Princess"}


def epx(a):
    """Scale2x on an RGBA array; edge-aware doubling keeps diagonals smooth."""
    h, w, _ = a.shape
    p = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode="edge")
    P, A, B, D, C_ = p[1:-1, 1:-1], p[:-2, 1:-1], p[1:-1, 2:], p[1:-1, :-2], p[2:, 1:-1]
    eq = lambda x, y: (x == y).all(-1)
    o = np.zeros((h * 2, w * 2, 4), np.uint8)
    c1 = eq(A, D) & ~eq(A, B) & ~eq(D, C_)
    c2 = eq(A, B) & ~eq(A, D) & ~eq(B, C_)
    c3 = eq(D, C_) & ~eq(D, A) & ~eq(C_, B)
    c4 = eq(B, C_) & ~eq(B, A) & ~eq(C_, D)
    for (dy, dx, cond, src) in ((0, 0, c1, A), (0, 1, c2, B), (1, 0, c3, D), (1, 1, c4, C_)):
        o[dy::2, dx::2] = np.where(cond[..., None], src, P)
    return o


def thin_outline(a):
    """Reduce the 4px upscaled pack outline to a 1px ink outline."""
    alpha = a[..., 3] > 0
    ol = alpha & (a[..., :3] == PACK_OUTLINE).all(-1)
    # distance (4-neighbour) from transparent
    dist = np.zeros(alpha.shape, int)
    cur = ~alpha
    layer = 0
    seen = cur.copy()
    while True:
        nxt = dilate(seen) & ~seen
        if not nxt.any(): break
        layer += 1
        dist[nxt] = layer
        seen |= nxt
    # connected-to-edge outline pixels deeper than 1 become fill; interior blobs (eyes, mouth) stay
    reach = ol & (dist <= 1)
    for _ in range(12):
        grow = dilate(reach) & ol & (dist <= 6)
        if (grow == reach).all(): break
        reach = grow
    drop = reach & (dist > 1)
    out = a.copy()
    fill = ~ol & alpha
    pts = np.argwhere(drop)
    for _ in range(8):
        if not len(pts): break
        rest = []
        for y, x in pts:
            for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < out.shape[0] and 0 <= xx < out.shape[1] and fill[yy, xx]:
                    out[y, x] = a[yy, xx]; break
            else:
                rest.append((y, x))
        for y, x in pts:
            if (y, x) not in set(rest): fill[y, x] = True
        pts = rest
    out[..., :3][(out[..., 3] > 0) & (out[..., :3] == PACK_OUTLINE).all(-1) & (dist <= 1)] = INK
    return out


def from_frame(path):
    im = Image.open(path).convert("RGBA").crop((0, 0, 16, 16))
    a = np.array(im)
    a[a[..., 3] < 128] = 0
    a = epx(epx(a))
    a = thin_outline(a)
    im = Image.fromarray(a, "RGBA")
    box = im.getbbox()
    sprite = im.crop(box)
    canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    canvas.alpha_composite(sprite, ((64 - sprite.width) // 2, 63 - sprite.height))
    return canvas


def build():
    d = os.path.join(OUT, "trainers"); os.makedirs(d, exist_ok=True)
    ch = Image.open(CHAMP).convert("RGBA")
    c = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); c.alpha_composite(ch, ((64 - ch.width) // 2, 64 - ch.height))
    c.save(os.path.join(d, "devansh.png"))


if __name__ == "__main__":
    build()
