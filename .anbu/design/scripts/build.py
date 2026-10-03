#!/usr/bin/env python3
"""usage: build.py <screen.js> ... ; concatenates prelude.js + screen, runs pen against portfolio-quest.pen"""
import json, subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, "..", ".."))
pen = os.path.join(here, "..", "portfolio-quest.pen")
pre = open(os.path.join(here, "prelude.js")).read()
lines = []
for f in sys.argv[1:]:
    body = open(os.path.join(here, f)).read()
    code = body if f == "vars.js" else pre + "\n" + body
    lines.append("execute({ input: " + json.dumps(code) + " })")
lines += ["save()", "exit()"]
args = ["pen", "interactive", "-o", pen]
if os.path.exists(pen):
    args = ["pen", "interactive", "-i", pen, "-o", pen]
r = subprocess.run(args, input="\n".join(lines) + "\n", capture_output=True, text=True, cwd=root)
import re
out = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", r.stdout + r.stderr)
print(out)
open(os.path.join(here, "..", "export-map.txt"), "a").write("\n".join(l for l in out.splitlines() if l.startswith("EXPORT")) + "\n")
