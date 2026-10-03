# Portfolio Quest: project rules (ANBU)

Personal weekend product built through `/mission`. Global `~/.claude/CLAUDE.md` applies. The company-specific parts (cerebrum, `/contract`, Jira) do not.

## What this is
A Gen-3-style 2D top-down portfolio game for Devansh Choudhary (Phaser 4 + grid-engine + Tiled, React DOM overlays), plus a static prerendered `/resume/`. Phases 1 (skeleton + resume) and 2 (core loop: HTML title, Agra, dialog, save, touch) are built; the rest arrives in phases 3 to 6.

- Mission state lives in `.anbu/`. Read `.anbu/plan.md` (stack, layout, phases), `.anbu/screens.md` (every screen and state), `.anbu/art-direction.md` (tokens, fonts) before touching UI.
- `spike/` is a throwaway Phase 0 proof. Read it, never import from it.

## Hard rules
- Facts come only from `.anbu/resume.pdf` plus "400+ LeetCode problems solved" and "B.Tech in Mechanical Engineering". Every mechanic maps to a `FactId` in `src/content/`. No `FactId`, no mechanic. Every NPC, sign and item carries a `factId`; maps hold no free text (check-content allows only a fixed property-key list per kind and fails on any other key, such as `say`, `after` or `text`). The only non-fact lines are item pickups in `ITEM_LINES` (`src/game/world/interact.ts`).
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
- `npm run map -- maps-src/<town>.map`: turns a text map into `public/maps/<town>.json`. Needs the Ninja Adventure pack (CC0, https://pixel-boy.itch.io/ninja-adventure-asset-pack) unzipped at `vendor/ninja-adventure/`, which is gitignored.

## Git
Commit per chunk as `feat(<chunk>): <what a stranger can now do>`. Never commit, push, or deploy without the user's approval. The launch gate is the user's.
