#!/usr/bin/env python3
"""Rename raw/<nodeId>.png to <screen>-<state>-<theme>.png using export-map.txt, then remove raw pngs."""
import os, re
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
n = 0
for l in open(os.path.join(d, "export-map.txt")):
    p = l.split()
    if len(p) < 4:
        continue
    name, theme, nid = " ".join(p[1:-2]), p[-2], p[-1]
    src = os.path.join(d, "raw", nid + ".png")
    if os.path.exists(src):
        out = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") + "-" + theme + ".png"
        os.replace(src, os.path.join(d, out)); n += 1
print(n, "renamed")
