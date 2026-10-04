# Portfolio Quest: project rules (ANBU)

Personal weekend product built through `/mission`. Global `~/.claude/CLAUDE.md` applies. The company-specific parts (cerebrum, `/contract`, Jira) do not.

## What this is
A Gen-3-style 2D top-down portfolio game for Devansh Choudhary (Phaser 4 + grid-engine + Tiled, React DOM overlays), plus a static prerendered `/resume/`. Phases 1 to 3 (skeleton, core loop, world), 4a (battles, starters, wild bugs, gym badges) and 4b (Elite Four, Champion, Hall of Fame, Skilldex, Bugdex, Trainer Card, Resume Mart, Bag) are built; the rest arrives in phases 5 and 6.

- Mission state lives in `.anbu/`. Read `.anbu/plan.md` (stack, layout, phases), `.anbu/screens.md` (every screen and state), `.anbu/art-direction.md` (tokens, fonts) before touching UI.
- `spike/` is a throwaway Phase 0 proof. Read it, never import from it.

## Hard rules
- Facts come only from `.anbu/resume.pdf` plus "400+ LeetCode problems solved" and "B.Tech in Mechanical Engineering". Every mechanic maps to a `FactId` in `src/content/`. No `FactId`, no mechanic. Every NPC, sign and item carries a `factId`; maps hold no free text (check-content allows only a fixed property-key list per kind and fails on any other key, such as `say`, `after` or `text`). The only non-fact lines live in `src/game/world/lines.ts` (pickups, roles, locks, robot replies, HUD labels); check-content fails a map flag that has no line there.
- Battle text follows the same rule. Every sentence shown in battle is either a resume fact (`factText`, from a move's `factId` or a pool fact) or a line from `src/game/world/lines.ts`. Species, move and trainer names are game data in `src/game/battle/data.ts`; they carry no resume claim. A player move prints its resume fact, a bug's flavor move prints its `FLAVOR_LINES` entry, and `check-content` fails a `factId`, sprite id or badge line that does not resolve.
- The phone number never appears in `src`, `public/maps`, or built `dist` html/js/json. `scripts/check-content.ts` enforces it (the PDF is published on purpose).
- No Nintendo assets, names, or fonts. Banned words are enforced by the same script. The same script also walks each built map from its default spawn and fails on an unreachable npc, sign, item or warp, or a fact that sits only on an unreachable object. Each folder under `public/assets` needs a LICENSE.
- Reuse before create. Grep by behavior first.
- No logic in JSX. Components under 400 lines. Single-line comments, only for a why.
- Every value from an API, storage, or the user has the fallback named in the screens file. Nothing renders undefined, null, NaN, or an empty string.
- `/resume/` ships no React at runtime: `scripts/prerender-resume.tsx` renders `Resume.tsx` to static HTML at build. Runtime JS there is theme toggle and download feedback only.
- No secrets in client code. Only public write-only keys reach a bundle.

## Commands
- `npm run dev`: Vite dev server (the resume placeholder is only filled by a build).
- `npm run build`: typecheck, Vite MPA build, prerender `/resume/`, then `check-content --dist`. `prebuild` runs the content check on source and maps.
- `npm test`: proves every fixture in `scripts/fixtures` (plus generated phone and banned-word cases) fails the content check, then runs Vitest (save migration).
- `npm run lint`: ESLint.
- `npm run smoke`: headless Playwright smoke test against the dev server (needs Playwright browsers).
- `npm run art:placeholders`: writes stand-in battle art, only for files that do not exist yet, so the designer's PNGs are never overwritten.
- `npm run map -- maps-src/<town>.map`: turns a text map into `public/maps/<town>.json`. An `encounters <name> x,y WxH pool=<factIds>` line paints tall grass over that rectangle and adds a grass zone; a `battle=<trainerId>` property on an npc makes it a gym leader. Needs the Ninja Adventure pack (CC0, https://pixel-boy.itch.io/ninja-adventure-asset-pack) unzipped at `vendor/ninja-adventure/`, which is gitignored. The `maps-src/*.map` files are the source of truth. The Python generators in `.anbu/design/towns/gen/` are historical and out of date with the hand edits (robot, lever, `battle=`, `needs=`); never rerun them over a `.map`. Original art the lever packs (the KaneAI tower, terminals) lives in `.anbu/design/towns/art/`.

## Git
Commit per chunk as `feat(<chunk>): <what a stranger can now do>`. Never commit, push, or deploy without the user's approval. The launch gate is the user's.
