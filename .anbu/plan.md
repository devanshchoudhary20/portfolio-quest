# Portfolio Quest: technical plan

Status: approved by the user 2026-10-03, with changes: the title screen is plain HTML; testing trimmed to three kept checks; phase checks run in GPU-accelerated headed Chromium on WSLg via Playwright MCP. Visuals come from the designer (`.anbu/art-direction.md`, `.anbu/screens.md`). Source of facts: `.anbu/resume.pdf`. The old site's `src/data/content.ts` is stale and not reused.

## 1. Stack and versions

| Package | Version | Why |
|---|---|---|
| phaser | 4.2.1 (exact pin) | Current latest. 4.0.0 is the only stable 4.0.x and has an ESM export bug fixed in 4.1.0. Tilemaps, sprites, scenes, scene plugins unchanged from v3 per the migration guide, so grid-engine's narrow surface is safe |
| grid-engine | 2.52.1 (exact pin) | Grid-locked 4-dir movement, `ge_collide` tile props from Tiled, `moveTo` pathfinding for tap-to-walk, NPC facing |
| npm overrides | `"overrides": { "grid-engine": { "phaser": "$phaser" } }` | Resolves the `~4.0.0` peer range against 4.2.1 without `--legacy-peer-deps` |
| vite | 8.x | Same major as the current site; MPA for `/resume` |
| react, react-dom | 19.2 | DOM overlays only. Also prerenders `/resume` at build. Not loaded at runtime on `/resume` |
| zustand | 5.x | One vanilla store shared by Phaser and React |
| tailwindcss + @tailwindcss/vite | 4.x | Overlay and resume styling |
| typescript | 5.9 | Branded ids need `strict` |
| @netlify/blobs, @netlify/functions | latest; verify `setJSON` `onlyIfMatch` works | Tally counter |
| @playwright/test | latest | The one smoke test (headless is fine: it checks logic, not rendering). Also the Phase 0 spike matrix |
| vitest | latest | The save-migration unit test |
| tsx | latest | Build-time scripts |
| Tiled | 1.11+, JSON export | Maps. Tilesets embedded so one fetch per town |

### grid-engine decision
grid-engine 2.52.1 on Phaser 4.2.1 via npm override, behind a 6-method adapter `GridMover` (`addChar, move, moveTo, facing, tileInFront, onArrived`). Phase 0 spike proves it: Tiled map with `ge_collide`, 4-dir walk, NPC facing, `moveTo` across 20 tiles, in Chrome, Firefox, iOS Safari. Spike result (2026-10-03): GO. The user confirmed it works on a real iPhone (Safari, tap-to-walk) through a temporary tunnel. The override installs with zero warnings, one deduped phaser@4.2.1, and no `globalThis.Phaser` global needed. All movement tests passed in chromium, firefox, webkit desktop and webkit iPhone emulation. If anything fails beyond a one-line fix, drop grid-engine and implement `GridMover` directly (BFS + tween). Nothing outside `src/game/movement/` changes.

### Spike lessons
- Audio: create the audio context lazily after the first user gesture (iOS requires it; headless WebKit throws without an audio device). Until then `audio: { noAudio: true }`.
- Synthetic input: Phaser's JustDown misses a key whose down and up land in the same frame. The smoke test holds keys >= 60 ms.
- `Scale.FIT` scales non-integer on arbitrary viewports. Use `Scale.RESIZE` with integer camera zoom as planned.

### Phaser 4 config
`pixelArt: true` (sets `roundPixels`, now off by default), `type: Phaser.AUTO`, no `Geom.Point` (use `Vector2`), no physics plugin.

### Shared state
`src/state/store.ts` exports a Zustand vanilla store. React uses `useStore(store, selector)`. Phaser calls `store.getState().actions.*` and subscribes to `uiOpen`, `heldDirection`, `textSpeed`, `reducedMotion`. No event bus. Phaser never touches the DOM, React never touches Phaser objects.

## 2. Repo layout

```
index.html                 game shell: SEO text block, skip link, #game, #ui
resume/index.html          Vite MPA entry; prerendered at build
netlify.toml               build cmd, functions dir, headers, redirects
public/maps/<town>.json    Tiled exports (agra, gear, junglee, marrfa, testmu, elite); Junglee is one map with an Analyst-era and an SE I-era area
public/assets/<pack>/      sprites + LICENSE per pack (checked in CI)
src/content/               resume facts
src/state/store.ts
src/game/                  Phaser only
  main.ts config.ts scenes/{Boot,Preload,Overworld,Battle}.ts   (Title lives in index.html)
  movement/GridMover.ts
  world/{warps,npcs,interact,save}.ts
  battle/{engine,moves}.ts
src/ui/                    React overlays: Dialog, Menu, Dex, TrainerCard, PatchCenter, Options, Touch, RecruiterMode, SkipLink
src/resume/{Resume.tsx,theme.ts,main.ts}
netlify/functions/tally.ts   (thin Netlify wrapper; the testable handler is netlify/lib/tally.ts, path /api/tally)
scripts/{check-content.ts,prerender-resume.tsx,size-check.ts,check-licenses.ts}
e2e/smoke.spec.ts
```

`/resume` is a port, not a reuse: one `Resume.tsx` rendering from `src/content`, real light/dark toggle, no GSAP, easter eggs, or command palette from the old site.

## 3. Content pipeline

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
export type FactId = Brand<string, 'FactId'>;        // 'testmu.cursor'
export type TownId = Brand<string, 'TownId'>;        // 'testmu'
export type SkillGroupId = Brand<string, 'SkillGroupId'>;
export type FlagId = Brand<string, 'FlagId'>;        // 'shoes', 'key.2fa.1'

export interface Fact { id: FactId; town: TownId; short: string; long?: string; tags?: SkillGroupId[] }
export interface Job { id: TownId; company: string; role: string; start: string; end: string | 'now'; location: string; facts: FactId[] }
export interface SkillGroup { id: SkillGroupId; label: string; items: string[]; gymBadge: string }
export interface Project { id: FactId; name: string; url: string; stack: string[]; summary: string }
```

Tiled contract: objects in layers `npcs`, `signs`, `items`, `warps`, `encounters` carry `kind` (`npc|sign|item|warp|grass|door|spawn`) and, when content-bearing, `factId`. Warps carry `to: TownId`, `spawn`. Encounter zones carry `pool` (comma list of FactIds). A spawn is a named object in the `warps` layer whose `name` equals the warp's `spawn`: a `door` when you arrive through one, or kind `spawn` for a plain arrival point (bedroom start, fly landing). Unnamed objects never count as spawns. A warp to a known town whose map doesn't exist yet only warns, so towns can land one at a time. Content-only towns (no map) such as `patch-center` are allowed.

`scripts/check-content.ts` (prebuild + CI) fails the build when: a `factId` is unknown; a warp `to` or its `spawn` doesn't exist; a fact is referenced by zero maps (warn in dev, fail in CI from phase 3); the phone number pattern appears in `src/content`, any map, or `dist`; an asset folder lacks a LICENSE; a banned word (nintendo, pokemon, pikachu, game freak) appears in `src`, `public`, or `dist`.

Every mechanic maps to a `FactId`. A mechanic without one is cut. Strict (user, 2026-10-03): every NPC, sign and item carries a fact, no flavor text in maps; item pickup lines live in `ITEM_LINES`.

## 4. Scene architecture

- Boot: reads save and `?warp`, sets `reducedMotion`, registers grid-engine, starts Preload.
- Title is NOT a Phaser scene. It is plain HTML/CSS in `index.html` (New Game, Continue, Options, Recruiter Mode), interactive before any JS framework loads. Phaser and the shared atlas load in the background; "Press Start" enables when they are ready. The professor intro runs in the React overlay.
- Preload: shared atlas only (player, generic NPCs, UI nine-slice, common tileset, font). Progress bar.
- Title (HTML): Continue hidden without save. Professor sets `mode: recruiter|engineer|curious`; recruiter sees `short`, engineer sees `long`.
- Overworld (one scene, restarted per town): `init({ town, spawn })` lazy-loads `maps/<town>.json`, builds layers, `GridMover`, NPCs, interact to `store.openDialog(facts[factId])`. Warps fade (or cut under reduced motion), restart, autosave. Day/night tint from the visitor's clock, three bands.
- Battle: `scene.launch` over a paused Overworld. Pure engine `step(state, move) -> state`. Max 4 turns enforced. Each move's effect text is a `FactId`.
- React overlays in `#ui` above the canvas: Dialog (role=dialog, aria-live polite, typewriter honors text speed and reduced motion), Menu, Skilldex, Bugdex, TrainerCard, PatchCenter form, Resume Mart (`/resume.pdf`), Options, RecruiterMode, Touch, SkipLink (first tab stop).

```ts
interface SaveV1 { v: 1; town: TownId; pos: { x: number; y: number }; facing: Dir; flags: FlagId[];
  seen: FactId[]; starter?: 'react' | 'node' | 'claude'; mode: Mode; savedAt: string | null }  // text speed lives in prefs (pq.prefs.v1), not the save
export function loadSave(raw: unknown): SaveV1 | null  // migration chain; unknown v -> null
```
Autosave on warp, flag change, dex open (debounced 500 ms).

## 5. Routing and SEO

- `/` game. `index.html` holds crawlable text before JS: h1, summary, current role, links to `/resume` and `/resume.pdf`, visible skip link. Canvas `aria-hidden`. OG/Twitter tags, JSON-LD `Person`.
- `/resume/` prerendered via `renderToStaticMarkup`. Runtime JS is a ~20-line theme toggle. Contains the Netlify contact form (registers it at build).
- `/resume.pdf` static copy.
- Deep links: `?warp=<TownId>[&spawn=]`, validated, bad values fall back to Title. `?mode=recruiter` opens Recruiter Mode. Old anchors (`/#experience`) redirect to `/resume/#experience` via a tiny inline script in `index.html`, because URL fragments never reach Netlify's redirect rules.
- Hashed assets immutable; HTML and map JSON `no-cache`.

## 6. Mobile, accessibility, performance

- Mobile: `Scale.RESIZE`, camera zoom snapped to integers. React D-pad with pointer events and hold-to-move, A/B. Tap-to-walk via `moveTo`. `dvh`, `touch-action: none`. Real iPhone check at each phase exit.
- A11y: dialog text in the DOM, live region. Arrows/WASD move, Z/Enter = A, X/Esc = B. Focus trapped in panels and returned on close. Reduced motion removes fades, typewriter, grass shake. Sound off by default. Recruiter Mode reachable from Title, pause menu, `?mode=recruiter`.
- Budget (gzip): HTML title + its JS <= 30 KB on the critical path. Game chunk (Phaser + grid-engine measured 420 KB in the spike, plus React overlays) <= 480 KB, loaded in the background behind the title, CSS <= 15 KB, shared atlas <= 150 KB, per town <= 300 KB, `/resume` <= 120 KB with no framework. Title interactive <= 2.5 s on Slow 4G. `/resume` Lighthouse >= 95 in all four.
- Measured by `scripts/size-check.ts` in the build, the visualizer report, and frame rate watched during each phase check in GPU Chromium. Lighthouse and axe run once, by hand, before launch. Phaser custom build only if the 2.5 s target is missed.

## 7. Backend on Netlify

- Contact: Netlify Forms. In-game form posts urlencoded to `/` with `form-name=contact` and a honeypot. Email notification set in the Netlify UI.
- A/B tally: Netlify Function `tally.ts` + Netlify Blobs key `junglee-path` `{ a, b }`. GET returns counts. POST `{ path: 'a' | 'b' }` reads, increments, `setJSON` with `onlyIfMatch`, 3 retries. Client dedupes via a `voted` flag. Fallback: one key per vote, count with `list({ prefix })`.

## 8. Testing

Kept checks (the only automated ones):
1. `scripts/check-content.ts`, prebuild. Unknown fact ids, dead warps or spawns, uncovered facts, phone number, banned words, missing LICENSE. A failed check fails the build.
2. `e2e/smoke.spec.ts`, headless Playwright, run before each deploy. Drives `window.__pq` (dev/test builds only: `warp`, `walk`, `interact`, `state`) through every town, gym, Elite Four and Hall of Fame, asserting `seen` grows and dialog text matches `facts[id].short`. It grows with the world: Phase 2 covers Agra, Phase 3 every town, Phase 4 the battles.
3. Save-migration unit test (Vitest), about 20 lines. `loadSave` accepts every past version and returns null for unknown ones.

Cut: per-phase Playwright suites, screenshot comparisons, the multi-browser matrix after Phase 0, FPS sampling, Lighthouse CI, axe in CI, battle engine unit tests.

Phase checks are played, not scripted: at each exit, Claude plays the build in a visible, GPU-accelerated Chromium through Playwright MCP, and the user tries it on an iPhone. Claude in Chrome does not run under WSL, so the browser runs headed on WSLg with `GALLIUM_DRIVER=d3d12` (verified 2026-10-03: WebGL renderer "D3D12 (AMD Radeon(TM) Graphics)", versus SwiftShader headless and llvmpipe without the flag). The window shows on the Windows desktop so the user can watch. Before each check, confirm the WebGL renderer string names the GPU; if it says SwiftShader or llvmpipe, stop and fix the setup instead of checking visuals on a software renderer. Fallback for true Windows Chrome: WSL mirrored networking + Chrome `--remote-debugging-port=9222 --user-data-dir=<separate>` + Playwright MCP `--cdp-endpoint`.

The Phase 0 spike keeps its own throwaway Playwright tests on chromium, firefox and webkit, because that question is cross-browser and the phase checks only use Chromium.

## 9. Phases and exit checks

0. Spike (0.5 day): Phaser 4.2.1 + grid-engine + one Tiled map. Exit: walk, collisions, `moveTo` pass the spike's Playwright tests in chromium, firefox, webkit; the user opens it on an iPhone over LAN; decision in README.
1. Skeleton + resume (1 day): repo, MPA, typed content, check script, save-migration test, prerendered `/resume/`, Netlify preview. Exit: `/resume/` played in GPU Chromium in both themes and with JS off; a broken map id fails the build.
2. Core loop (2 days): Boot, Preload, HTML Title, Agra, store, Dialog, save/Continue, touch, skip link, day/night, walk-cycle fix (alternate feet). Exit: smoke test covers Agra; Claude plays it in GPU Chromium (keyboard, Continue after reload, skip link); the user walks it on an iPhone; a screen reader reads one dialog.
3. World (3 days): all towns, warps, NPCs bound to facts, gyms, deep links, Recruiter Mode. Exit: smoke test reaches every town; 100% fact coverage; Claude plays every `?warp=` in GPU Chromium.
4. Battle and dex (2 days): wild bugs, battles, starters, Bugdex, Skilldex, Trainer Card, Resume Mart, Elite Four, Hall of Fame. Exit: smoke test reaches Hall of Fame; Claude plays one full battle and the Elite Four in GPU Chromium.
5. Backend (0.5 day): Patch Center form, tally. Exit: a submission visible in Netlify; tally increments from two browsers and survives a redeploy.
6. Polish and launch (1.5 days): reduced motion, perf budget, one manual Lighthouse and axe pass, portrait polish, DNS cutover, redirects. Exit: Lighthouse >= 95 on `/resume/`, zero serious axe issues, live domain serves the game, `/resume/` text matches the PDF.

## 10. Risks, ranked

1. grid-engine breaks on Phaser 4.2. Phase 0 spike, `GridMover` adapter, custom fallback scoped.
2. Recruiter leaves before Title (Phaser ~345 KB gz). Text + skip link in HTML before JS, progress bar, lazy towns, `?mode=recruiter`, custom build in reserve.
3. Facts not surfaced in 10 s. NPC first line is always `fact.short`; coverage check; smoke asserts per stop.
4. Licensing or Nintendo references. LICENSE per pack in CI, banned-word scan, hand-drawn original avatar, self-hosted OFL font.
5. Mobile Safari quirks. `dvh`, `touch-action`, pointer events, real-device check per phase.
6. Save schema drift. Versioned save, tested migrations.
7. Tally race or SDK bug. `onlyIfMatch` retry, per-vote fallback.
8. Tiled authoring errors. Warp and spawn validation both ways.
9. Phone number leak. Regex scan of content, maps, output.
10. Scope creep. Phase gates; no `FactId`, no mechanic; polish only in Phase 6.

## Phase 6 polish backlog (collected during phases 2 to 4)
- Phone panels: on portrait phones, open panels (Hall of Fame, dex, Trainer Card, Mart, Recruiter) full-screen and hide the touch controls while open; today the Hall of Fame scrolls and "Keep exploring" sits below the fold, and stat labels wrap.
- Game chunk is ~512 KB gzip against the 480 KB budget: swap React for Preact (preact/compat, about -55 KB) in the overlays, then re-measure.
- Machine Coding room terminals read as boxes with paper (no monitor tile in the pack); consider one custom terminal tile.
- KaneAI tower is barely taller than its neighbours; consider one custom skyscraper sprite.
- `--gold` token is used in title.css but not listed in `.anbu/art-direction.md`.
- Mart "Downloading..." transient state has no e2e.

## Launch checklist (only a real deploy can prove these)
Phase 5 proves the code locally: Vitest runs the tally handler against an in-memory store with etags, and Playwright mocks both endpoints. None of it touches Netlify. Do these once, on the first deploy preview or production deploy.

1. Contact form is registered. Netlify dashboard, Forms tab, lists a `contact` form after the deploy (detected from the static form on `/resume/`). Forms detection must be on for the site.
2. Notification is set. Forms > Form notifications > add an email notification to the address on the resume. Without it, submissions land in the dashboard only.
3. A game submission arrives. In the game, talk to the Patch Center nurse (Gear City), send a message. Expect "Message sent. I will reply to ..." in the panel, then the entry in the dashboard with name, email, message, and the email in the inbox.
4. The honeypot works. POST once with `bot-field` filled (`curl -d 'form-name=contact&name=x&email=x@x.co&message=0123456789&bot-field=spam' https://<site>/`). Expect the entry under Spam, not Verified.
5. The tally function is live. `curl https://<site>/api/tally` returns `{"a":0,"b":0}` (or real counts) with status 200. `curl -X PUT` returns 405. A body of `{"path":"c"}` returns 400.
6. Two browsers vote. Open the game in two different browsers (or one normal and one private window), walk each into a fork path. `GET /api/tally` shows both votes added, and the Analyst reads the new split in his line.
7. A visitor votes once. Walk into both paths twice in one browser: the count rises by one. A new game in the same browser may vote again (the flag lives in the save).
8. The tally survives a redeploy. Trigger a new deploy (clear cache and deploy site), then `GET /api/tally`: counts are unchanged. Blobs are site-wide, so this should hold; confirm it.
9. Failure is quiet. In DevTools block `/api/tally`, talk to the Analyst: his fact shows and no tally line follows.
10. Per-IP daily dedupe is the real guard: the same visitor counts once per UTC day. `rateLimit` is not enforced on the current plan (7 GETs in seconds all returned 200), so leave it in place but do not rely on it. Set `TALLY_SALT` as a secret env var on the production site at launch; without it POST returns 503.
11. Remaining launch gate items stay in Phase 6 (Lighthouse, axe, DNS).
- If production moves to a different Netlify site than `portfolio-quest-preview`, enable form detection there (new sites default to `ignore_html_forms: true`), add the email notification (New form submission, Any form, devanshchoudhary999@gmail.com), and set the `TALLY_SALT` secret.

## Launch record (2026-10-04)
- Live at https://devanshchoudhary.com on Netlify site `portfolio-quest`; old `devanshfolio` kept as rollback.
- Verified live: HTTPS (Let's Encrypt, HSTS), http and www redirects, `/#experience` redirect, form submission and honeypot, tally on Blobs with per-IP daily dedupe, counter reset to 0.
- Lighthouse on the live domain: home 98/100/100/100, `/resume/` 99/100/96/100 (performance/accessibility/best practices/SEO).
- Fixed during launch: force HTTPS was off by default; Netlify's badge (`built_with_badge_enabled`) was on by default and covered the game corner.
