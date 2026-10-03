#!/usr/bin/env python3
"""Cut the front view out of avatar-reference.png: drop the grid, labels and watermark, write a transparent full-resolution RGBA."""
from PIL import Image, ImageFilter
import numpy as np, os
from scipy import ndimage as ndi
here = os.path.dirname(os.path.abspath(__file__))
ref = Image.open(os.path.join(here, "..", "..", "avatar-reference.png")).convert("RGB")
box = (74, 64, 406, 558)
crop = ref.crop(box)
a = np.array(crop).astype(int)
lum = a.mean(2)
nonwhite = lum < 228
# grid lines are 1-2 px; the figure is made of blocks 5+ px wide, so an opening drops the lines
opened = ndi.binary_opening(nonwhite, structure=np.ones((5, 5)))
lab, n = ndi.label(opened)
sizes = ndi.sum(opened, lab, range(1, n + 1))
fig = lab == (1 + int(np.argmax(sizes)))
fig = ndi.binary_fill_holes(fig)
fig = ndi.binary_dilation(fig, structure=np.ones((3, 3)))
rgba = np.dstack([a.astype(np.uint8), (fig * 255).astype(np.uint8)])
img = Image.fromarray(rgba, "RGBA")
img = img.crop(img.getbbox())
img.save(os.path.join(here, "source", "front-cutout.png"))
print(img.size)
