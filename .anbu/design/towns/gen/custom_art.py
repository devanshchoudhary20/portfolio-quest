"""Original tiles for Portfolio Quest, drawn by script: the KaneAI skyscraper stamp (64x128) and three terminal tiles (48x16). Writes .anbu/design/towns/art/*.png, read by build-map.ts as sheets relative to the pack dir."""
import os
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'art')
os.makedirs(OUT, exist_ok=True)
h = lambda s: tuple(int(s[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

O = h('#141b1b')
S0, S1, S2, S3, S4 = h('#eecf9b'), h('#d2b37d'), h('#a3754e'), h('#965340'), h('#61372e')
OR, OR2 = h('#e46d3a'), h('#b4502c')
T0, T1, T2 = h('#6fc7d6'), h('#2e8ba6'), h('#1c566b')


def box(im, x, y, w, h_, c):
    for j in range(y, y + h_):
        for i in range(x, x + w):
            im.putpixel((i, j), c)


def tier(im, x, y, w, h_, lit=S1):
    box(im, x, y, w, h_, O)
    box(im, x + 1, y + 1, w - 2, h_ - 2, lit)
    box(im, x + 1, y + 1, 3, h_ - 2, S0)
    box(im, x + w - 6, y + 1, 5, h_ - 2, S2)
    box(im, x + w - 3, y + 1, 2, h_ - 2, S3)


def window(im, x, y, w=6, h_=6):
    box(im, x, y, w, h_, O)
    box(im, x + 1, y + 1, w - 2, h_ - 2, T1)
    box(im, x + 1, y + 1, w - 2, 1, T0)
    box(im, x + 1, y + h_ - 2, w - 2, 1, T2)
    im.putpixel((x + 1, y + 2), T0)


def ledge(im, x, y, w, c=S3):
    box(im, x, y, w, 3, O)
    box(im, x + 1, y + 1, w - 2, 1, c)


def tower():
    im = Image.new('RGBA', (64, 128), (0, 0, 0, 0))
    # spire
    box(im, 30, 0, 4, 14, O); box(im, 31, 1, 2, 12, S2); box(im, 31, 1, 2, 3, OR); im.putpixel((31, 6), T0); im.putpixel((32, 8), T0)
    # crown: orange cap over a teal-banded top floor
    box(im, 16, 12, 32, 6, O); box(im, 17, 13, 30, 4, OR); box(im, 17, 13, 30, 1, h('#f19a5c')); box(im, 40, 14, 7, 3, OR2)
    tier(im, 14, 18, 36, 26)
    box(im, 15, 19, 34, 3, T1); box(im, 15, 19, 34, 1, T0); box(im, 15, 21, 34, 1, T2)
    for x in (18, 29, 40):
        for y in (25, 34): window(im, x, y)
    ledge(im, 12, 44, 40)
    # middle setback
    tier(im, 8, 47, 48, 30)
    for x in (11, 23, 35, 47):
        for y in (52, 62): window(im, x, y)
    box(im, 9, 72, 46, 1, S3)
    ledge(im, 5, 77, 54)
    # main shaft
    tier(im, 2, 80, 60, 48)
    for x in (18, 29, 40):
        for y in (85, 95): window(im, x, y)
    # banners hang from the shaft, with a pointed tail and an orange diamond
    for bx in (4, 52):
        box(im, bx, 84, 8, 28, O); box(im, bx + 1, 85, 6, 26, T1); box(im, bx + 1, 85, 6, 2, T0); box(im, bx + 5, 87, 2, 22, T2)
        box(im, bx + 2, 112, 4, 2, O); box(im, bx + 3, 114, 2, 1, O)
        for k, w in enumerate((2, 4, 4, 2)): box(im, bx + 4 - w // 2, 94 + k, w, 1, OR)
    # ground floor: dark entrance with teal awning, shop glass to the right
    box(im, 14, 106, 20, 5, O)
    for i in range(10): box(im, 15 + i * 2, 107, 2, 3, T1 if i % 2 == 0 else T0)
    box(im, 15, 110, 18, 1, T2)
    box(im, 17, 111, 14, 17, O); box(im, 18, 112, 12, 16, h('#1c2a2a')); box(im, 18, 112, 12, 2, T2)
    box(im, 36, 112, 18, 10, O); box(im, 37, 113, 16, 8, T1); box(im, 37, 113, 16, 2, T0); box(im, 44, 113, 1, 8, O); box(im, 37, 119, 16, 2, T2)
    box(im, 2, 124, 60, 4, O); box(im, 3, 124, 59, 2, S4); box(im, 17, 124, 14, 4, h('#1c2a2a')); box(im, 17, 124, 1, 4, O); box(im, 30, 124, 1, 4, O)
    im.save(os.path.join(OUT, 'kane-tower.png'))


def terminals():
    im = Image.new('RGBA', (48, 16), (0, 0, 0, 0))
    BEZ, BEZ2, SCR = h('#3a4252'), h('#242a36'), h('#0c1712')
    G, G2 = h('#6ff08a'), h('#2fa84a')
    progs = [
        [(2, 5, G), (3, 3, G2), (3, 6, G)],
        [(2, 2, G), (3, 4, G2), (4, 5, G), (5, 3, G2)],
        [(2, 6, G2), (3, 7, G), (4, 3, G2), (5, 6, G)],
    ]
    for n, lines in enumerate(progs):
        t = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        box(t, 1, 1, 14, 11, O); box(t, 2, 2, 12, 9, BEZ); box(t, 2, 10, 12, 1, BEZ2)
        box(t, 3, 3, 10, 6, SCR)
        y = 4
        for row, ln, c in lines:
            box(t, 4 + (1 if row % 2 else 0), y, ln + 2, 1, c); y += 2 if y < 8 else 0
        if len(lines) < 4: box(t, 4, y if y <= 8 else 8, 1, 1, G)
        box(t, 7, 12, 2, 2, O); box(t, 7, 12, 2, 1, BEZ2)
        box(t, 4, 14, 8, 2, O); box(t, 5, 14, 6, 1, BEZ)
        im.paste(t, (n * 16, 0))
    im.save(os.path.join(OUT, 'terminals.png'))


tower(); terminals()
print('wrote', OUT)
