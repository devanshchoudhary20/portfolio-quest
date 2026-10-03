# Portfolio Quest: art direction

Region name in game: **Kernel Region**. Game title on screen: **Portfolio Quest**. No Nintendo names, assets, fonts, music. The word "Pokemon" appears nowhere.

## References (step 2)

| Reference | Borrow | Avoid |
|---|---|---|
| Gen-3 handheld RPG UI (Emerald era), grammar only | Bottom-anchored dialog box with a two-line border and a blinking advance arrow. Right-aligned start menu with a cursor. Battle layout: enemy plate top-left, player plate bottom-right, message box bottom with the move grid on the right. HP bar with three color bands. The player never loses a screen that has a B-button way out. | Any asset, font, sound, name, or the exact palette. Level numbers and gender symbols (they would be invented facts). Long text crawl at 1 char per frame with no skip. |
| bruno-simon.com (3D driving portfolio) | A persistent corner menu (home, options, controls). An "I'm stuck" teleport that rescues a lost visitor. Its loading screen that tells the visitor what controls to expect. | It has no plain-text way out. The visitor who wants the resume must drive. Ours puts "Skip to resume" on every game screen and Recruiter Mode as the second item on the title screen. |
| GitHub profile page (the buyer's daily UI, for `/resume`) | Dense, scannable single column. Quiet neutral surfaces, one accent, strong text/muted split, light and dark tokens. | Tab-heavy chrome and badges. The resume is one page of text, nothing to click except contact and PDF. |
| Ninja Adventure + Kenney CC0 packs | Same 16px grid, 4-direction walk sheets, face portraits for dialog, ready SFX. Fewer custom assets means more time on content. | Mixing pack styles on one screen without a palette pass. All world art goes through the palette below. |

## Tile size, native resolution, scale

| Item | Decision | Why |
|---|---|---|
| Tile | **16 x 16 px** | Matches Gen-3 grid and every shortlisted pack (Ninja Adventure, Kenney Tiny Town, RPG Urban Pack are all 16px). No resampling. |
| Native canvas, desktop and landscape | **320 x 180** (20 x 11.25 tiles, 16:9) | Gen-3 is 240 x 160 (3:2). 16:9 fills modern screens and divides exactly into 1280x720 (4x), 1920x1080 (6x), 3840x2160 (12x). The camera centers on the player's tile, the half tile at top and bottom crops cleanly. |
| Native canvas, portrait phone | **240 wide x 160 to 288 tall** (15 x 10 to 15 x 18 tiles). Height is the largest multiple of 16 that leaves 400 CSS px for the controls; a 390 x 844 phone gets 240 x 288 | Width is fixed so the scale stays integer (DPR 3: 4x physical = 320 CSS px wide). Extra height shows more map instead of empty space. 240 x 160 is the minimum on short screens. |
| Scale | Integer only. `scale = floor(min(availW*dpr/nativeW, availH*dpr/nativeH))`, minimum 1. Canvas CSS size = native * scale / dpr. Leftover space is letterbox in `--ink`. | Fractional scale blurs pixel art. `image-rendering: pixelated`, no smoothing. |
| DOM overlay | Dialog, menus, HUD are DOM at `--px = scale / dpr` CSS px per native px. Type sizes are multiples of 8 native-equivalent steps: 8, 12, 16. | Keeps chrome crisp and on the same grid as the world. Text stays real text (screen readers, selection). |
| Mockups | Desktop frames are 1280 x 720 (4x). Mobile frames are 390 x 844. | Direct export of the integer scale. |

## Palette

### Game (world and chrome), with day and night

| Token | Day | Night | Use |
|---|---|---|---|
| `ink` | #1B1F2E | #1B1F2E | Outlines, text on panels, letterbox |
| `panel` | #F7F5EA | #F7F5EA | Dialog, menu, card fill (UI is DOM and never tinted) |
| `panel-2` | #DCD8C0 | #DCD8C0 | Selected row, inset wells |
| `muted` | #4A4F63 | #4A4F63 | Secondary text on panel (7.4:1) |
| `line` | #2E8BA6 | #2E8BA6 | Inner border of every frame (decorative, 3.6:1 against panel, never text) |
| `cursor` | #C8493F | #C8493F | Menu arrow, advance arrow (non-text, 4.3:1) |
| `grass` | #5DAA4E | tinted | World |
| `path` | #D9C58A | tinted | World |
| `water` | #4A90C8 | tinted | World |
| `hp-high / mid / low` | #3FBF5A / #E8B931 / #D6453D | same | Bars |
| `starter-react` | #3CC6E8 | same | Starter 1 |
| `starter-node` | #5AB552 | same | Starter 2 |
| `starter-claude` | #E8793A | same | Starter 3 |
| `world-tint` | transparent | #1B2A6E at 55%, multiply | Night overlay on the world layer only |
| `lights` | off | #FFD878 at 70% (windows, lamps, PC screens), additive | Night |

Five-step neutral scale for chrome: `#F7F5EA` > `#DCD8C0` > `#A39F86` > `#4A4F63` > `#1B1F2E`.

Contrast (WCAG AA, measured): ink on panel 14.98, muted on panel 7.42, ink on panel-2 11.41, panel on ink 14.98. Because UI is never tinted, day and night chrome both pass.

### Day and night treatment

- Source: the visitor's local clock. 06:00 to 17:00 day, 17:00 to 19:00 dusk (tint #E8793A at 20%), 19:00 to 06:00 night.
- Only the world canvas changes (tint layer plus lights layer). Dialog and menus stay identical, so reading is the same at 3 a.m.
- Options menu has a `Time of day: Auto / Day / Night` setting. Reduced motion: no fade, the tint switches on map load.
- Mockups export `-day` and `-night` for every game screen.

### `/resume` tokens (real light and dark)

| Token | Light | Dark |
|---|---|---|
| `bg` | #F6F8FA | #0D1117 |
| `surface` | #FFFFFF | #161B22 |
| `border` | #D0D7DE | #30363D |
| `muted` | #57606A (6.0 on bg) | #9DA7B3 (7.8 on bg) |
| `text` | #1F2328 (14.8) | #E6EDF3 (16.0) |
| `accent` | #0B6E8A (5.8 on surface) | #4DB6D0 (7.4 on surface) |

Spacing 4, 8, 12, 16, 24, 32, 48. Radius 6. Game radius is 2 native px (8 CSS at 4x). One shadow: none.

## Typography

One pair, both SIL OFL 1.1.

| Role | Face | Where |
|---|---|---|
| Pixel display and game UI | **Jersey 10** (400 only, Soft Type Project, SIL OFL 1.1) | Title, dialog, menus, battle, numbers, `/resume` name and section heads |
| Reading | **Atkinson Hyperlegible** (400, 700) | `/resume` body, contact form helper text, long paragraphs |

Type sizes (CSS px): desktop at 4x uses dialog and menu 28, plate names 24, small labels 20, logo 88. Phone uses dialog and menu 18, labels 16. Nothing renders below 16 CSS px. Jersey 10 sets about 1.3x smaller than its size number, so every pixel-font size above is the rendered size and the mockups scale the design numbers by 1.3.

Rejected after rendering real strings: **Pixelify Sans** draws 5 as S and 2 as Z, which breaks facts like "300 KB", "2025" and "Badges 3 / 5". **Press Start 2P** is too wide for phones and hard to read at body sizes. Jersey 10 passed a test string of 0123456789, S5, Z2 and "Gear City".

## Sprite specs

| Asset | Spec |
|---|---|
| NPC and tile packs | 16 x 16 per frame. Ninja Adventure sheets are 4 columns (down, up, left, right) by 4 rows (frames), in the top 64 x 64 of a 64 x 112 file; the rest are action poses. Verified on the downloaded sheet. |
| **Avatar, overworld** | Option A, no PixelLab. Round 3: hand-drawn on the Ninja Adventure layout by `design/avatar/draw_sheet.py` (the recolored "Boy" hid the forehead and read as a ninja helmet). 64 x 64 sheet, 4 columns (down, up, left, right) by 4 rows (idle, step, idle, step) of 16 x 16. Proportions: head 9 rows with swept-up black hair and visible forehead, shirt 4 rows with rolled-sleeve marks, trousers and shoes 2 rows. Right-facing is a mirror of left. Skin matches the Champion sprite. Output `design/avatar/devansh-walk-sheet-64x64.png`. The pack license (CC0) still covers the layout reference; the earlier recolor of Boy is in `recolor_sheet.py`. |
| **Close-ups** | Cut from `.anbu/avatar-reference.png` (front view) by `design/avatar/extract_front.py` (grid, labels and watermark dropped by morphological opening, largest blob kept). `design/avatar/portraits.py` BOX-downscales, snaps to a 12-color palette taken from the game, outlines the silhouette in the pack outline color `#141B1B`, and removes isolated pixels. Sizes below. |
| Dialog portrait | **38 x 38**, opaque on teal `#548789` (a pack color), so the 1px `#141B1B` outline around the hair and head separates the figure from the background. Same size as Ninja Adventure facesets (verified: their `Faceset.png` is 38 x 38). Head and collar. Hair is smoothed into one solid mass (highlights clustered, no scattered pixels). Shown at 4x (152 px) in the dialog box; the box grows to 204 px tall when a portrait is present. `design/avatar/dialog-portrait-38x38.png` |
| Trainer Card photo | **48 x 64**, transparent, head and chest. Shown at 4x (192 x 256) on a `panel-2` well. `design/avatar/trainer-card-photo-48x64.png` |
| Champion battle front | **30 x 64**, transparent, full body, feet on the bottom row. Shown at 4x (120 x 256) on the enemy platform. Also used for Hall of Fame. `design/avatar/champion-battle-front-30x64.png` |
| Avatar palette | `#141B1B` outline, `#1A1F2E #2B3448 #424E68` hair, `#E0AA78 #B7764C` skin (the Champion sprite also uses `#C68A5B #8F5A38`), `#F2F4F8 #C9D3E3 #96A8C4` shirt, `#2B3A5C #1E2844` trousers. Walk sheet adds `#1B2236` shoes. |
| Starters | Three 32 x 32 creatures (front) and 32 x 32 (back). Cyan, green, orange. Placeholder shapes in mockups. Source from Ninja Adventure's monster set, recolored to the starter palette. |
| Wild bug | 32 x 32 front sprite per bug. Ninja Adventure monsters, recolored. |
| Faceset | Ninja Adventure facesets (dialog portrait 32 x 32) for Professor, Mom, Librarian. |

## UI chrome

| Part | Spec |
|---|---|
| Dialog box | Bottom-anchored, full width minus 2 tiles margin, height 3 text lines + padding (about 40 native px). Outer 1 native px `ink` border, 1 px gap, inner 1 px `line` border, fill `panel`, radius 2. Speaker name tab sits above top-left on `ink` with `panel` text. Advance arrow `cursor` bottom-right, blinks 1 Hz (static under reduced motion). Text is a DOM `<p aria-live="polite">`. Interact key or tap: finish line, then next line. |
| Menu frame | Same double border, right-aligned, 56 native px wide, rows 12 px tall, `cursor` triangle at left of the selected row, selected row fill `panel-2`. |
| Plate (battle) | Name left, HP bar below. Bar 48 x 4 native px, track `ink`, fill by band. Numbers use Pixelify Sans 8. |
| Buttons (mobile) | D-pad 144 CSS px square, A and B 56 CSS px circles, `ink` at 85% fill with `panel` glyphs. Min hit area 48 CSS px. |
| Link: Skip to resume | Top-right of every game screen, `panel` pill with `ink` text, 16 CSS px text, focus ring 2 CSS px `cursor`. First tab stop. |

## Chosen packs and licenses (verified 2026-10-03 on each pack page; Ninja Adventure also from its downloaded `LICENSE.txt`, CC0 1.0, copied to `design/avatar/source/`)

| Need | Pack | License | URL |
|---|---|---|---|
| Tiles, NPCs, monsters (bugs), facesets, UI bits, items, VFX, 2 fonts, 100+ SFX, 37 music tracks | Ninja Adventure Asset Pack by Pixel-Boy | CC0 1.0 (page: "released under the Creative Commons Zero (CC0) license... even commercial ones"), 16x16 | https://pixel-boy.itch.io/ninja-adventure-asset-pack |
| Extra buildings and town tiles | Kenney Tiny Town (130 tiles, 16x16) | CC0 | https://kenney.nl/assets/tiny-town |
| Modern city for TestMu City | Kenney RPG Urban Pack (480 files, 16x16) | CC0 | https://kenney.nl/assets/rpg-urban-pack |
| Menu clicks, confirm and cancel sounds | Kenney Interface Sounds (100 files) | CC0 | https://kenney.nl/assets/interface-sounds |
| Chiptune jingles (badge, save, battle win) | Kenney Music Jingles (85 files) | CC0 | https://kenney.nl/assets/music-jingles |
| Pixel font | Jersey 10 (Soft Type Project) | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/jersey10 (also Google Fonts) |
| Reading font | Atkinson Hyperlegible, (c) Braille Institute of America | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegible |

Rejected: Pixelify Sans (digit 5 reads as S), Press Start 2P (OFL, readable only in short strings), PixelLab (dropped, 2026-10-03), any ripped asset.

Before the build starts, the builder opens each downloaded archive and keeps its license file in `public/licenses/`. The pack pages say CC0 for the whole Ninja Adventure bundle including music. If any track inside ships with a different license text, drop that track and use a Kenney jingle. OFL requires the font license text to ship with the fonts. CC0 needs no attribution, and we credit anyway in Options > Credits.

## Agra, hometown flavor

Light touch, two details only. A small white marble dome with two slim minarets on the Title skyline (left side, outside the menu). A white dome building marks Agra on the world map. In the Agra town map the bakery tile gets a "Petha" sign (a sweet shop, 2 tiles wide, uses a Kenney Tiny Town shop front recolored). No other local landmarks.

## Title screen is HTML and CSS

The Title is plain DOM in `index.html` (see plan.md section 4), not a Phaser scene. It needs no canvas. Background: `title-bg` PNG (320 x 180 native, shown at integer scale with `image-rendering: pixelated`). Day or night is a CSS class from the clock: `.night` adds a `#0F1B5E8C` overlay and the window lights layer. Logo plate, "Press Start" strip and menu are DOM elements. While the engine loads, the strip shows "Loading game files" with a bar and a percent, New Game and Continue are disabled, and Options and Recruiter Mode work. When Phaser and the atlas are ready the strip reads "Press Start" and Enter or a tap on the highlighted row begins.

## Mockup placeholders

Every pixel scene in `.anbu/design/` is drawn by `design/scripts/make_placeholder_art.py` from flat shapes. Buildings, tiles and creatures are stand-ins. The avatar, Librarian, Professor and Clerk sprites and the Librarian face are the real Ninja Adventure art (CC0), copied to `design/assets/pack-sprites/`; the avatar is the recolor above. The mockups fix layout, type, color, and copy. Final world art is the packs above, run through this palette.
