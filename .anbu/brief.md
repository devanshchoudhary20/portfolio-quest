# Portfolio Quest: design brief

A 2D top-down portfolio game in the style of Gen-3 handheld monster-RPGs (Pokemon Ruby/Sapphire/Emerald era), replacing devanshchoudhary.com. The visitor walks Devansh's career as a region: towns are jobs, gyms are skill groups, battles and NPCs reveal resume facts.

## Locked decisions (user, 2026-10-03)

| Topic | Decision |
|---|---|
| Dimension | 2D top-down, tile-based, grid-locked movement. No 3D |
| Assets | Original look-alike. Zero Nintendo assets, names, fonts, music, or the word "Pokemon" anywhere |
| NPCs + tiles | CC0 / permissive packs (candidates: Ninja Adventure, Kenney top-down sets). Verify each license file before use |
| Avatar | Option A (2026-10-03): overworld uses the 16x16 Ninja Adventure rig; Devansh is a recolored base sprite (black swept hair, white shirt with rolled sleeves, dark navy trousers, warm brown skin). Close-ups (dialog portrait, Trainer Card, Champion battle, Hall of Fame) use a cleaned-up version of `.anbu/avatar-reference.png`. No PixelLab |
| Names | Kernel Region, Professor Stack, coins: approved |
| Native canvas | 320x180 desktop, 240x160 portrait phones, integer scale only |
| Hometown | Agra (his real hometown). Replaces the "Root Town" placeholder |
| Placement | Game at the domain root. Classic resume at `/resume`. A "Skip to resume" link is visible on every game screen |
| Content source | `.anbu/resume.pdf` is the only source of facts. Also allowed: "400+ LeetCode problems solved" and "B.Tech in Mechanical Engineering". Nothing else from older sites |
| Engine (tentative) | Phaser 4 + `grid-engine` + Tiled maps, React DOM overlay for dialog and menus. A separate technical plan settles this |

## Content map (from the resume)

- Agra: home town. Bedroom PC = About (summary line). Mom gives Running Shoes (speed toggle).
- Gear City: IIT Patna, B.Tech Mechanical 2019-2023. Gear turning into `{ }`. Library NPC: 400+ LeetCode.
- Junglee Jungle, two eras. Analyst (Jun 2023-Jun 2024): paths A and B split at the entrance, a live tally of which path visitors pick. SE I Frontend (Jan 2025-Nov 2025): 2FA gate needing two keys, Recovery Path NPC, Blog/CMS newsstand, Best Developer (Quarterly) 2025 trophy.
- Marrfa Estates (Contract, Nov 2024-Jan 2025): three doors for three user roles (role-based access), real-time sync sign.
- TestMu City, sign reads "formerly LAMBDA CITY" (MTS Frontend, Nov 2025-now). KaneAI tower floors: Authoring Cursor maze (walls regenerate, your flag survives), If/Else + While floor, Save Room (300 KB crate becomes 3 KB envelope), Import Dock (~500 crates in one pass), Basement with five ghost bugs (silent data-loss bugs found by checking payloads against the Go backend), a robot that walks you where you type. Also: lt-components migration, WCAG 2.1 AA, Accessibility Score widget.
- Gyms = resume skill groups: Core (React, TS, Next), Design System & A11y, Monorepo & Tooling, Cross-stack & AI, Backend (smaller side gym, "working knowledge").
- Starters: React (cyan/water), Node.js (green/grass), Claude Code (orange/fire).
- Systems: wild bugs in tall grass ("A wild NullPointerException appeared!"), Bugdex, Skilldex, battles of 4 turns or fewer with moves named after real techniques, Patch Center (contact form, PC box with KoalaLab project), Resume Mart (resume PDF for 0 money), Trainer Card (money = 400), Elite Four = interview loop (DSA, Machine Coding, System Design, Behavioral), Champion = Devansh, Hall of Fame with contact CTA.
- Title screen: New Game, Continue, Options, Recruiter Mode. Professor asks "recruiter, engineer, or just curious?"

## Constraints

- Recruiters give a portfolio about 30 seconds. Every mechanic must surface a resume fact within 10 seconds, and Recruiter Mode is one click from anywhere.
- Mobile: touch D-pad + A/B, tap-to-walk.
- Accessibility: dialog text lives in the DOM (screen readers, selectable), reduced-motion respected, text speed option, keyboard first.
- Day/night from the visitor's clock replaces light/dark inside the game. `/resume` has real light and dark themes.
- Phone number from the resume never appears in game text.
