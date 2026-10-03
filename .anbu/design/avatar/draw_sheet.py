#!/usr/bin/env python3
"""Hand-drawn 16x16 Devansh walk sheet on the Ninja Adventure layout (4 columns: down, up, left, right; 4 rows: idle, step, idle, step).
Round 3: replaces the recolored 'Boy' (hair mass hid the forehead). Proportions: head 9 rows, shirt 4 rows, trousers and shoes 2 rows."""
from PIL import Image
import os
here = os.path.dirname(os.path.abspath(__file__))
C = {"#": (20, 27, 27), "h": (26, 31, 46), "H": (43, 52, 72), "J": (66, 78, 104), "s": (224, 170, 120), "d": (183, 118, 76),
     "l": (224, 170, 120), "w": (242, 244, 248), "c": (201, 211, 227), "n": (43, 58, 92), "N": (30, 40, 68), "o": (36, 44, 66)}


def pad(inner, left):
    r = "." * left + inner
    return r + "." * (16 - len(r))


# heads: 9 rows, 12 wide, placed at x=2
HEAD = {
    "down": ["..########..", ".#hhHJJHhh#.", "#hhHJHHHHhh#", "#hhhHhhhhhh#", "#hhsssssssh#", "#ss##ss##ss#", "#ssssddssss#", "#sssdwwdsss#", ".#ssssssss#."],
    "up": ["..########..", ".#hhHJJHhh#.", "#hhHJHHHHhh#", "#hhhHhHhhhh#", "#hhhhhhhhhh#", "#hhhhhhhhhh#", "#shhhhhhhhs#", ".#shhhhhhs#.", "..#ssssss#.."],
    "left": ["..########..", ".#hhHJJHhh#.", "#hhHJHHHHhh#", "#hhhHhhhhhh#", "#sshhhhhhhh#", "#s#sshhhhhh#", "#dsssshhhhh#", "#sddsshhhhh#", ".#ssssshh#.."],
}
BODY_IDLE = {
    "down": [".#wwwwssssswwww#."[:0] or ".#wwwwsssswwww#.", ".#wwwwwsswwwww#.", ".#cwwwwccwwwwc#.", ".#ss#wwccww#ss#.", "...#nnnnnnnn#...", "...#ooo##ooo#..."],
    "up": [".#wwwwwwwwwwww#.", ".#wwwwwccwwwww#.", ".#cwwwwwwwwwwc#.", ".#ss#wwwwww#ss#.", "...#nnnnnnnn#...", "...#ooo##ooo#..."],
    "left": ["..#wwwsswwwww#..", "..#wwwwwwwwww#..", "..#cwwwwwwwwc#..", "..#ss#wwwww#s#..", "...#nnnnnnn#....", "...#ooo#ooo#...."],
}
STEP_LEGS = {
    "down": [["...#nnnnnnnn#...", "..#ooo#.#ooo#..."], ["...#nnnnnnnn#...", "...#ooo#.#ooo#.."]],
    "up": [["...#nnnnnnnn#...", "..#ooo#.#ooo#..."], ["...#nnnnnnnn#...", "...#ooo#.#ooo#.."]],
    "left": [["...#nnnnnnn#....", "..#ooo#..#oo#..."], ["...#nnnnnnn#....", "...#oo#..#ooo#.."]],
}


def frame(direction, row):
    head = [pad(r, 2) for r in HEAD[direction]]
    idle = row in (0, 2)
    body = BODY_IDLE[direction]
    if idle:
        rows = ["." * 16] + head + body
    else:
        legs = STEP_LEGS[direction][0 if row == 1 else 1]
        rows = ["." * 16, "." * 16] + head + [body[0], body[2], body[3]] + legs
    rows = rows[:16]
    assert len(rows) == 16 and all(len(r) == 16 for r in rows), (direction, row, [len(r) for r in rows], len(rows))
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != ".":
                im.putpixel((x, y), C[ch] + (255,))
    return im


sheet = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
for row in range(4):
    sheet.paste(frame("down", row), (0, row * 16))
    sheet.paste(frame("up", row), (16, row * 16))
    left = frame("left", row)
    sheet.paste(left, (32, row * 16))
    sheet.paste(left.transpose(Image.FLIP_LEFT_RIGHT), (48, row * 16))
sheet.save(os.path.join(here, "devansh-walk-sheet-64x64.png"))
bg = Image.new("RGBA", (384, 384), (150, 170, 150, 255))
up = sheet.resize((384, 384), Image.NEAREST); bg.paste(up, (0, 0), up)
bg.save(os.path.join(here, "devansh-walk-sheet-preview-6x.png"))
sheet.crop((0, 0, 16, 16)).save(os.path.join(here, "devansh-idle-down-16x16.png"))
# side-by-side with the Champion sprite, both at 6x
ch = Image.open(os.path.join(here, "champion-battle-front-30x64.png")).convert("RGBA")
cmp = Image.new("RGBA", (96 + 30 * 6 + 60 + 96 * 1, 64 * 6 + 20), (150, 170, 150, 255))
d0 = sheet.crop((0, 0, 16, 16)).resize((96, 96), Image.NEAREST)
cmp.paste(d0, (10, 10), d0)
cp = ch.resize((180, 384), Image.NEAREST)
cmp.paste(cp, (130, 10), cp)
cmp.convert("RGB").save(os.path.join(here, "compare-overworld-vs-champion-6x.png"))
print("ok")
