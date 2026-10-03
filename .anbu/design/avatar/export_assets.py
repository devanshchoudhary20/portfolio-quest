#!/usr/bin/env python3
"""Pre-scale avatar art by exact integer factors for the mockups (no smoothing)."""
from PIL import Image
import os
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "assets")
for src, dst, k in [("trainer-card-photo-48x64.png", "avatar-photo-x4.png", 4), ("champion-battle-front-30x64.png", "champion-x4.png", 4),
                    ("dialog-portrait-38x38.png", "face-avatar-x4.png", 4)]:
    im = Image.open(os.path.join(here, src)); im.resize((im.width * k, im.height * k), Image.NEAREST).save(os.path.join(out, dst))
f = Image.open(os.path.join(out, "pack-sprites", "OldMan-faceset.png")).convert("RGBA")
f.resize((f.width * 4, f.height * 4), Image.NEAREST).save(os.path.join(out, "face-oldman-x4.png"))
print("ok")
