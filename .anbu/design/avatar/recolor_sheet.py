#!/usr/bin/env python3
"""Recolor Ninja Adventure 'Boy' (CC0) into Devansh: black swept hair, white shirt, navy trousers, warm brown skin."""
from PIL import Image
import os
here = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(here, "source", "ninja-adventure-boy-spritesheet.png")).convert("RGBA")
sheet = src.crop((0, 0, 64, 64))
HAIR_HI, HAIR_LO = (43, 52, 72, 255), (18, 22, 31, 255)
SKIN, SKIN_SH = (198, 138, 91, 255), (143, 90, 56, 255)
NAVY, NAVY_DK, SHOE = (43, 58, 92, 255), (30, 40, 68, 255), (27, 34, 54, 255)
SHIRT, SHIRT_SH = (242, 244, 248, 255), (201, 211, 227, 255)
M = {
    (209, 75, 52, 255): "red", (150, 83, 64, 255): HAIR_LO, (239, 145, 79, 255): SKIN,
    (84, 135, 137, 255): NAVY, (227, 241, 245, 255): SHIRT, (46, 57, 57, 255): (20, 27, 27, 255),
    (81, 97, 78, 255): NAVY_DK, (211, 162, 192, 255): SKIN_SH,
}
out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
for y in range(64):
    for x in range(64):
        p = sheet.getpixel((x, y))
        if p[3] == 0:
            continue
        v = M.get(p, p)
        if v == "red":
            v = SHOE if (y % 16) >= 11 else HAIR_HI
        out.putpixel((x, y), v)
out.save(os.path.join(here, "devansh-walk-sheet-64x64.png"))
out.resize((384, 384), Image.NEAREST).save(os.path.join(here, "devansh-walk-sheet-preview-6x.png"))
# single idle front frame (column 0 = down, row 0 = idle), plus 6x
out.crop((0, 0, 16, 16)).save(os.path.join(here, "devansh-idle-down-16x16.png"))
print("ok")
