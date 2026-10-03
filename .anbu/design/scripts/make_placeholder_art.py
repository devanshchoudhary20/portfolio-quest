#!/usr/bin/env python3
"""Placeholder pixel art for mockups only. Final art comes from the CC0 packs listed in art-direction.md."""
import random
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")
os.makedirs(OUT, exist_ok=True)
S = 4

INK = (27, 31, 46)
G1, G2, G3 = (93, 170, 78), (79, 156, 70), (63, 138, 62)
PATH1, PATH2 = (217, 197, 138), (196, 174, 112)
WATER1, WATER2 = (74, 144, 200), (96, 164, 214)
ROOF_R, ROOF_B, ROOF_T = (200, 73, 63), (60, 100, 170), (46, 139, 166)
WALL, WALL2 = (240, 232, 205), (214, 204, 172)
DOOR, WIN = (110, 72, 48), (150, 205, 235)
TRUNK, LEAF1, LEAF2 = (96, 66, 44), (44, 118, 58), (60, 146, 70)
SKIN, HAIR = (240, 196, 160), (60, 40, 36)


def canvas(w=320, h=180, base=G1):
    global CUR
    im = Image.new("RGB", (w, h), base)
    CUR = im
    return im, ImageDraw.Draw(im)


def grass(d, w, h, seed=1):
    r = random.Random(seed)
    for y in range(0, h, 16):
        for x in range(0, w, 16):
            if (x // 16 + y // 16) % 2:
                d.rectangle([x, y, x + 15, y + 15], fill=G2)
    for _ in range(w * h // 120):
        x, y = r.randrange(w), r.randrange(h)
        d.rectangle([x, y, x + 1, y], fill=G3)
        d.point((x + 1, y - 1), fill=(120, 190, 100))


def path(d, x0, y0, x1, y1):
    d.rectangle([x0, y0, x1, y1], fill=PATH1)
    for y in range(y0, y1, 4):
        for x in range(x0 + ((y // 4) % 2) * 2, x1, 8):
            d.point((x, y), fill=PATH2)


def tree(d, x, y):
    d.rectangle([x + 6, y + 18, x + 9, y + 25], fill=TRUNK)
    d.ellipse([x, y, x + 15, y + 21], fill=LEAF1)
    d.ellipse([x + 2, y + 1, x + 12, y + 12], fill=LEAF2)
    d.rectangle([x + 4, y + 4, x + 6, y + 5], fill=(110, 180, 90))


def house(d, x, y, w=48, h=40, roof=ROOF_R, door=True):
    d.rectangle([x, y + 14, x + w - 1, y + h - 1], fill=WALL)
    d.rectangle([x, y + h - 6, x + w - 1, y + h - 1], fill=WALL2)
    d.polygon([(x - 3, y + 16), (x + w // 2, y), (x + w + 2, y + 16)], fill=roof)
    d.rectangle([x - 3, y + 14, x + w + 2, y + 17], fill=tuple(max(0, c - 40) for c in roof))
    for wx in (x + 6, x + w - 14):
        d.rectangle([wx, y + 22, wx + 7, y + 29], fill=WIN)
        d.rectangle([wx, y + 22, wx + 7, y + 29], outline=INK)
    if door:
        d.rectangle([x + w // 2 - 4, y + h - 14, x + w // 2 + 3, y + h - 1], fill=DOOR)
        d.rectangle([x + w // 2 - 4, y + h - 14, x + w // 2 + 3, y + h - 1], outline=INK)
    d.rectangle([x, y + 14, x + w - 1, y + h - 1], outline=INK)


def sign(d, x, y):
    d.rectangle([x + 5, y + 8, x + 6, y + 15], fill=TRUNK)
    d.rectangle([x, y, x + 11, y + 8], fill=(226, 200, 150), outline=INK)
    d.line([(x + 2, y + 3), (x + 9, y + 3)], fill=INK)
    d.line([(x + 2, y + 5), (x + 7, y + 5)], fill=INK)


def person(d, x, y, shirt=(200, 60, 60), hair=HAIR, face="d"):
    d.rectangle([x + 4, y + 13, x + 5, y + 15], fill=INK)
    d.rectangle([x + 9, y + 13, x + 10, y + 15], fill=INK)
    d.rectangle([x + 3, y + 7, x + 12, y + 13], fill=shirt)
    d.rectangle([x + 3, y + 2, x + 12, y + 8], fill=SKIN)
    d.rectangle([x + 3, y, x + 12, y + 3], fill=hair)
    if face == "d":
        d.point((x + 5, y + 5), fill=INK)
        d.point((x + 10, y + 5), fill=INK)


def flowers(d, pts):
    for x, y in pts:
        d.point((x, y), fill=(250, 250, 250))
        d.point((x + 1, y), fill=(240, 200, 60))
        d.point((x, y + 1), fill=(240, 120, 150))


CUR = None
SPR = os.path.join(OUT, "pack-sprites")


def spr(name, x, y, col=0, row=0):
    sh = Image.open(os.path.join(SPR, name + "-sheet.png")).convert("RGBA")
    f = sh.crop((col * 16, row * 16, col * 16 + 16, row * 16 + 16))
    CUR.paste(f, (x, y), f)


def save(im, name, scale=S):
    im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(OUT, name))


def overworld():
    im, d = canvas(320, 300)
    grass(d, 320, 300, 7)
    path(d, 0, 118, 319, 133)
    path(d, 150, 60, 165, 118)
    for x in range(0, 320, 18):
        tree(d, x - 4, -8)
    for y in range(20, 250, 22):
        tree(d, -6, y)
        tree(d, 310, y)
    house(d, 40, 30, 56, 46, ROOF_B)
    house(d, 214, 24, 64, 50, ROOF_T)
    sign(d, 118, 82)
    sign(d, 190, 96)
    flowers(d, [(110, 100), (126, 106), (240, 100), (252, 106), (60, 100), (70, 108), (90, 190), (120, 210), (250, 230)])
    d.ellipse([196, 176, 262, 214], fill=WATER1)
    d.ellipse([204, 182, 250, 204], fill=WATER2)
    d.rectangle([60, 160, 150, 163], fill=TRUNK)
    for fx in range(60, 152, 18):
        d.rectangle([fx, 156, fx + 2, 168], fill=TRUNK)
    for x in range(0, 320, 18):
        tree(d, x - 4, 276)
    path(d, 150, 133, 165, 280)
    spr("OldMan", 172, 100)
    spr("avatar", 146, 102)
    save(im.crop((0, 0, 320, 180)), "overworld-day.png")
    save(im.crop((40, 0, 280, 288)), "overworld-mobile.png")


def battle(enemy=True, name="battle-bg.png"):
    im, d = canvas(320, 180, (150, 205, 240))
    d.rectangle([0, 0, 319, 60], fill=(170, 220, 245))
    d.rectangle([0, 60, 319, 179], fill=G1)
    for y in range(60, 180, 8):
        d.rectangle([0, y, 319, y + 3], fill=G2)
    d.ellipse([196, 62, 300, 84], fill=G3)
    d.ellipse([30, 112, 150, 140], fill=G3)
    d.ellipse([200, 66, 296, 82], fill=PATH1)
    d.ellipse([34, 116, 146, 136], fill=PATH1)
    # enemy bug (placeholder)
    bx, by = 226, 36
    if not enemy:
        bx = by = -999
    d.ellipse([bx, by + 8, bx + 40, by + 38], fill=(190, 50, 50), outline=INK)
    d.line([(bx + 20, by + 8), (bx + 20, by + 38)], fill=INK)
    d.ellipse([bx + 8, by, bx + 32, by + 14], fill=INK)
    for k in range(3):
        d.line([(bx + 2, by + 16 + k * 8), (bx - 6, by + 20 + k * 8)], fill=INK)
        d.line([(bx + 38, by + 16 + k * 8), (bx + 46, by + 20 + k * 8)], fill=INK)
    for ex in (bx + 13, bx + 24):
        d.rectangle([ex, by + 5, ex + 2, by + 7], fill=(255, 240, 120))
    # player starter, back view (placeholder)
    px, py = 62, 76
    d.ellipse([px, py + 12, px + 56, py + 64], fill=(60, 198, 232), outline=INK)
    d.ellipse([px + 12, py + 24, px + 44, py + 56], outline=INK)
    d.ellipse([px + 18, py, px + 38, py + 20], fill=(60, 198, 232), outline=INK)
    d.ellipse([px + 23, py + 30, px + 33, py + 40], fill=INK)
    save(im, name)


def title():
    im, d = canvas(320, 180, (255, 190, 120))
    bands = [(255, 214, 150), (255, 200, 130), (250, 170, 120), (236, 140, 120), (200, 120, 130)]
    for i, c in enumerate(bands):
        d.rectangle([0, i * 18, 319, i * 18 + 17], fill=c)
    d.ellipse([200, 52, 248, 100], fill=(255, 240, 190))
    hill = (74, 98, 140)
    d.polygon([(0, 120), (60, 84), (120, 112), (190, 78), (260, 108), (320, 90), (320, 180), (0, 180)], fill=hill)
    d.polygon([(0, 140), (80, 118), (160, 140), (240, 120), (320, 138), (320, 180), (0, 180)], fill=(52, 72, 112))
    for tx, th in [(74, 20), (92, 28), (230, 34), (262, 24), (290, 18)]:
        d.rectangle([tx, 150 - th, tx + 12, 150], fill=(34, 46, 78))
        for wy in range(150 - th + 4, 146, 8):
            d.rectangle([tx + 3, wy, tx + 4, wy + 2], fill=(255, 220, 120))
    dome = (236, 232, 224)
    d.rectangle([10, 128, 46, 150], fill=dome)
    d.ellipse([14, 110, 42, 140], fill=dome)
    d.rectangle([27, 103, 28, 112], fill=dome)
    for mx in (3, 51):
        d.rectangle([mx, 116, mx + 3, 150], fill=dome)
        d.rectangle([mx - 1, 112, mx + 4, 116], fill=dome)
    d.rectangle([16, 138, 20, 150], fill=(150, 150, 170))
    d.rectangle([36, 138, 40, 150], fill=(150, 150, 170))
    d.rectangle([0, 150, 319, 179], fill=(34, 46, 78))
    save(im, "title-bg.png")


def interior(name, floor_a, floor_b, wall, items):
    im, d = canvas(320, 180, wall)
    d.rectangle([0, 0, 319, 44], fill=wall)
    d.rectangle([0, 40, 319, 47], fill=tuple(max(0, c - 50) for c in wall))
    for y in range(48, 180, 16):
        for x in range(0, 320, 16):
            d.rectangle([x, y, x + 15, y + 15], fill=floor_a if (x // 16 + y // 16) % 2 else floor_b)
    items(d)
    save(im, name)


def shelf(d, x, y, w=48):
    d.rectangle([x, y, x + w, y + 36], fill=(120, 84, 56), outline=INK)
    for r in range(3):
        d.line([(x, y + 12 * r + 12), (x + w, y + 12 * r + 12)], fill=INK)
        for k in range(0, w - 6, 6):
            d.rectangle([x + 2 + k, y + 3 + r * 12, x + 5 + k, y + 10 + r * 12],
                        fill=[(200, 70, 70), (70, 130, 200), (230, 190, 70), (90, 170, 100)][(k // 6 + r) % 4])


def lab_items(d, orbs=True, prof=True):
    for x in (16, 80, 224, 272):
        shelf(d, x, 6)
    if orbs:
        d.rectangle([110, 100, 210, 126], fill=(150, 110, 76), outline=INK)
        for cx, col in ((128, (60, 198, 232)), (160, (90, 190, 82)), (192, (232, 121, 58))):
            d.ellipse([cx - 8, 84, cx + 8, 102], fill=col, outline=INK)
            d.rectangle([cx - 2, 90, cx + 2, 92], fill=(255, 255, 255))
    if prof:
        spr("Master", 152, 62)
    spr("avatar", 152, 118)


def pc_items(d):
    d.rectangle([128, 14, 192, 52], fill=(70, 80, 100), outline=INK)
    d.rectangle([134, 18, 186, 44], fill=(60, 220, 200))
    d.rectangle([140, 24, 170, 25], fill=INK)
    d.rectangle([140, 30, 160, 31], fill=INK)
    shelf(d, 16, 6)
    shelf(d, 256, 6)
    d.rectangle([140, 110, 180, 130], fill=(150, 110, 76), outline=INK)
    spr("avatar", 152, 126)


def mart_items(d):
    d.rectangle([0, 96, 319, 112], fill=(160, 120, 80), outline=INK)
    spr("Noble", 148, 76)
    shelf(d, 20, 6, 70)
    shelf(d, 230, 6, 70)
    spr("avatar", 152, 126)


def loading():
    im, d = canvas(320, 180, (22, 28, 52))
    r = random.Random(3)
    for _ in range(70):
        d.point((r.randrange(320), r.randrange(110)), fill=(120, 130, 190))
    d.rectangle([0, 150, 319, 179], fill=(34, 46, 78))
    save(im, "loading-bg.png")


def worldmap():
    im, d = canvas(320, 180, WATER1)
    for y in range(0, 180, 8):
        for x in range((y // 8 % 2) * 8, 320, 16):
            d.rectangle([x, y, x + 3, y], fill=WATER2)
    d.polygon([(14, 30), (60, 8), (250, 6), (304, 30), (310, 120), (270, 168), (60, 172), (12, 130)], fill=G1)
    d.polygon([(30, 40), (60, 20), (240, 18), (292, 40), (296, 116), (262, 156), (66, 160), (26, 122)], fill=G2)
    grass(d, 0, 0)
    towns = {"root": (34, 124), "gear": (92, 80), "jungle": (160, 116), "marrfa": (164, 34), "testmu": (246, 62), "hall": (262, 128)}
    pts = [towns["root"], towns["gear"], towns["jungle"], towns["marrfa"], towns["testmu"], towns["hall"]]
    for (ax, ay), (bx, by) in [(towns["root"], towns["gear"]), (towns["gear"], towns["jungle"]), (towns["jungle"], towns["marrfa"]), (towns["jungle"], towns["testmu"]), (towns["testmu"], towns["hall"])]:
        d.line([(ax + 10, ay + 8), (ax + 10, by + 8), (bx + 10, by + 8)], fill=PATH1, width=5)
    for tx in range(120, 200, 10):
        for ty in range(96, 150, 12):
            tree(d, tx, ty - 6) if (tx + ty) % 20 else None
    for key, (x, y) in towns.items():
        col = {"root": ROOF_R, "gear": (150, 150, 160), "jungle": ROOF_T, "marrfa": ROOF_B, "testmu": (120, 90, 170), "hall": (230, 190, 70)}[key]
        house(d, x - 4, y - 4, 32, 28, col)
    ax, ay = towns["root"]
    d.rectangle([ax - 10, ay - 22, ax + 34, ay + 26], fill=G2)
    d.rectangle([ax - 4, ay - 4, ax + 27, ay + 23], fill=(236, 232, 224), outline=INK)
    d.ellipse([ax + 2, ay - 14, ax + 22, ay + 6], fill=(240, 236, 228), outline=INK)
    d.rectangle([ax + 11, ay - 20, ax + 12, ay - 12], fill=INK)
    d.rectangle([ax + 10, ay + 12, ax + 15, ay + 23], fill=DOOR)
    save(im, "worldmap.png")


def sprites():
    # avatar placeholder: 4 cols x 4 rows of 16x16 (down, up, left, right)
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for row in range(4):
        for col in range(4):
            ox, oy = col * 16, row * 16
            sub = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
            sd = ImageDraw.Draw(sub)
            person(sd, 0, 0, shirt=(46, 139, 166), hair=(40, 30, 30), face="d" if row == 0 else "n")
            if col % 2:
                sd.rectangle([4, 13, 5, 15], fill=(0, 0, 0, 0))
            im.paste(sub, (ox, oy))
    im.resize((256, 256), Image.NEAREST).save(os.path.join(OUT, "avatar-placeholder-sheet.png"))
    big = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    person(ImageDraw.Draw(big), 0, 0, shirt=(46, 139, 166))
    big.resize((160, 160), Image.NEAREST).save(os.path.join(OUT, "avatar-placeholder.png"))
    # starters
    for name, col in (("react", (60, 198, 232)), ("node", (90, 181, 82)), ("claude", (232, 121, 58))):
        s = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        sd = ImageDraw.Draw(s)
        sd.ellipse([3, 6, 28, 30], fill=col, outline=INK)
        sd.ellipse([8, 1, 23, 14], fill=col, outline=INK)
        sd.rectangle([12, 6, 13, 8], fill=INK)
        sd.rectangle([18, 6, 19, 8], fill=INK)
        sd.rectangle([13, 17, 18, 19], fill=(255, 255, 255))
        s.resize((192, 192), Image.NEAREST).save(os.path.join(OUT, f"starter-{name}.png"))
    # gear
    g = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    for a in range(8):
        pass
    gd.rectangle([6, 0, 9, 15], fill=(160, 170, 190))
    gd.rectangle([0, 6, 15, 9], fill=(160, 170, 190))
    gd.rectangle([2, 2, 13, 13], fill=(160, 170, 190))
    gd.rectangle([5, 5, 10, 10], fill=(22, 28, 52))
    g.resize((128, 128), Image.NEAREST).save(os.path.join(OUT, "gear.png"))


overworld()
battle()
battle(False, "battle-bg-empty.png")
title()
interior("lab-bg.png", (230, 220, 190), (218, 206, 172), (196, 206, 224), lab_items)
interior("lab2-bg.png", (230, 220, 190), (218, 206, 172), (196, 206, 224), lambda d: lab_items(d, False, False))
interior("pc-bg.png", (200, 214, 230), (188, 202, 222), (120, 150, 190), pc_items)
interior("mart-bg.png", (232, 214, 190), (220, 200, 172), (210, 120, 110), mart_items)
loading()
worldmap()
sprites()
print("ok")
