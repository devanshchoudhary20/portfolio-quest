# Pen notes (pen 0.3.10, headless)

- Run from the project root: `python3 .anbu/design/scripts/build.py vars.js <screen>.js ...`. It prepends `prelude.js` to each screen script, runs `pen interactive -i/-o portfolio-quest.pen`, and appends `EXPORT <frame> <theme> <id>` lines to `export-map.txt`. `finalize.py` renames `raw/<id>.png` to `<screen>-<state>-<theme>.png`.
- `Export(..., "raw")` resolves relative to the .pen file, not the shell cwd.
- Themes: axis `time` (day, night) for game frames, axis `mode` (light, dark) for `/resume`. World night = themed `world-tint` rectangle over the art plus themed `lights` rectangles. UI chrome is not themed on purpose.
- Pixel scenes are PNGs from `scripts/make_placeholder_art.py`, referenced as `./assets/*.png` image fills.
- Fonts: Jersey 10 renders about 1.3x smaller than its size number, so `tx()` multiplies by K=1.3. Pixelify Sans misreads 5 as S and 2 as Z, so it was dropped.
- `Move(child, parent, index)` fails when the parent is an outer wrapper. Target the inner frame (`Box inner`) of `bx()` boxes.
- Icons: Material Symbols Sharp `play_arrow` (weight 700) is the menu cursor, lucide for download and mail.
