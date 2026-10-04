# Portfolio Quest: screens

Graphical product, so Pencil frames exist (see Design files at the bottom). Source of facts: `.anbu/resume.pdf` plus "400+ LeetCode problems solved" and "B.Tech in Mechanical Engineering". The phone number never appears. Visual system: `.anbu/art-direction.md`.

The visitor plays Devansh. There is no character naming screen. The avatar is Devansh: a recolor of a Ninja Adventure base sprite for the overworld, and a cleaned-up illustration for close-ups (dialog portrait, Trainer Card, Champion battle, Hall of Fame). No PixelLab. See `art-direction.md`.

## Journey (step 3)

Two personas, one core loop: arrive, learn who he is, find one proof of skill, reach contact or the PDF.

### Persona A: recruiter, 30 seconds

| Step | Does | Feels | Leaves if |
|---|---|---|---|
| 1 Asset-loading screen | Waits | Mild doubt: "is this a game site?" | Load passes 3 s with no progress, or no visible way out. **Skip to resume link is on this screen.** |
| 2 Title | Reads four items | Curious | No obvious "just the resume" path. Recruiter Mode is item 2 and has a one-line subtitle. |
| 3 Click Recruiter Mode | Lands on `/resume` | Relief | **Highest-risk moment.** The page must show name, title, current role, and Download PDF above the fold without scrolling on a phone. |
| 3b Or: New Game | Professor asks "recruiter, engineer, or just curious?" | Slightly annoyed | Any intro longer than 3 dialog lines. Picking "recruiter" offers Recruiter Mode first and skips the starter pick. |
| 4 `/resume` | Scans headline, current role, PDF | Satisfied | Walls of text, a theme flash on load, or a PDF that 404s. |
| 5 Contact | Clicks email or Download PDF | Done | Form with required fields they do not trust. Email link is one tap. |

### Persona B: curious engineer, 10 minutes

| Step | Does | Feels | Leaves if |
|---|---|---|---|
| 1 Loading | Watches the gear turn into `{ }` | Interested | Bar stalls without a message. |
| 2 Title and Professor | Picks "engineer", then a starter | Amused | Starter pick feels like a form. Each starter shows one line of what it means. |
| 3 Agra | Walks, talks to Mom, uses the PC (About) | Oriented | Walking is slow. Running Shoes arrive in the first 60 seconds. |
| 4 First wild bug in grass | Battles NullPointerException | Delighted if it is short | More than 4 turns, or a fact is hidden behind a button. Each move prints one resume fact. |
| 5 Gear City, Junglee Jungle | Library NPC, A/B path fork, 2FA gate | Impressed by detail | Dead-end rooms, or the live tally errors loudly. |
| 6 TestMu City, KaneAI tower | Floors, Basement ghost bugs | Convinced | Tower has no map. World map is in the Start menu. |
| 7 Skilldex, Trainer Card | Checks completeness | Wants to finish | Skilldex shows `???` with no hint where to find it. Every `???` has a location hint. |
| 8 Hall of Fame | Reads contact CTA, opens Patch Center | Ready to reach out | Form errors that erase the message. Message is kept on every error. |

The "leave" moment with the most care is **Recruiter step 3**: the first screen after the click. `/resume` is designed in light and dark with the 30-second scan as the only job.

## Global rules

| Rule | Behavior |
|---|---|
| Skip to resume | Visible on every game screen, top right, first tab stop. Text: "Skip to resume". Links to `/resume`. Never hidden by dialogs. |
| Input | Keyboard: arrows or WASD move, Z or Enter = A (interact, confirm), X or Esc = B (cancel, run), Enter on map = Start menu. Touch: D-pad, A, B, tap-to-walk. Gamepad not in scope. |
| Dialog | Text in DOM `<p aria-live="polite">`. Selectable. Text speed Slow / Normal / Fast / Instant, default Normal, Instant when `prefers-reduced-motion`. A press during typing completes the line. |
| Motion | Reduced motion: no screen shake, no fade, no blinking arrow (static), no walk-in transitions on battle. |
| Sound | Off until first interaction. Mute toggle in Options. |
| Save | `localStorage` key `pq.save.v1`. Autosave on map change. If storage is blocked, play continues in memory and Options shows "Progress will not be saved in this browser." |

### Fallbacks for every external value

| Value | Source | Fallback text or behavior |
|---|---|---|
| `save.role` | storage | `curious` |
| `save.starter` | storage | `React` (cyan). Skipped intro assigns it silently. |
| `save.playSeconds` | storage | `0:00` |
| `save.badges` | storage | `0` and five empty badge slots |
| `save.skillsSeen` | storage | `0 / 32` and all entries show `???` |
| `save.caught` | storage | `0 / 6` (derived catchable total) |
| `prefs.textSpeed` (`pq.prefs.v1`) | storage | `Normal` |
| `save.textSize` | storage | `Normal` |
| Corrupt save JSON | storage | Discard, start fresh, one dialog line: "Save data was unreadable. Starting a new game." |
| Clock (`new Date()`) | browser | NaN or throw: day |
| Time zone unknown | browser | Use local hour; if it fails, day |
| Path tally `{a, b}` | API | Number missing: `--`. A failed, rate-limited or empty tally shows no line. |
| Resume PDF URL | static asset | If 404: "The PDF did not load. Try again, or copy the text from /resume." |
| Contact form `name`, `email`, `message` | user | Empty name: "Add your name so I know who to reply to." Invalid email: "That email needs an @ and a domain, like name@company.com." Empty message: "Write a short message, at least 10 characters." |
| Contact submit result | API | See Patch Center |
| Facts (job title, dates, bullets) | `resume.json` in repo | A missing field hides its row. Never renders `undefined`, `null`, or empty text. |
| Sprite or tile fails to load | assets | Colored square with the asset name in debug only; in production the loading screen blocks until required assets resolve or shows its error state. |

---

## 1. Title

Job: choose how to start.

HTML and CSS only, no canvas (plan.md section 4). Layout: logo and region art fill the screen (the logo is the visual anchor). Menu is centered below. Corner: "Skip to resume" top right. Footer line: "Devansh Choudhary, Frontend Engineer".

Happy path
1. Screen shows the logo "Portfolio Quest" over a sunrise skyline of Kernel Region, with the day or night variant from the clock.
2. Menu: **New Game**, **Continue** (only if a save exists), **Options**, **Recruiter Mode**. Cursor starts on Continue when a save exists, else New Game.
3. Press A on New Game: fade to Professor intro.
4. Press A on Recruiter Mode: go to `/resume`.
5. Options opens a sheet: Text speed, Text size, Sound, Time of day, Credits.

| State | What the visitor sees |
|---|---|
| Empty (no save) | Continue is hidden, not greyed. Menu has three items. Cursor on New Game. |
| Loading | The page is interactive before the engine loads. A strip under the logo reads "Loading game files", a bar and a percent (63% in the mockup). New Game and Continue are disabled (muted) until Phaser and the atlas are ready. Options and Recruiter Mode work at once and the cursor starts on Recruiter Mode. When ready the strip becomes "Press Start" and the cursor moves to Continue (save) or New Game. Under reduced motion there is no fade. |
| Partial | Save exists but one field is unreadable: Continue shows and its subline reads "Last played: unknown". |
| Error | Engine fails to load (script blocked or offline): the strip reads "The game could not load. Open the resume instead." with the Recruiter Mode row active. Corrupt save: Continue shows, pressing it opens dialog "Save data was unreadable. Starting a new game." then New Game. |
| Success | Continue shows subline "Badges 3 / 5, 12:40" from the save (fallbacks `0 / 5`, `0:00`). |

Copy: Recruiter Mode subline: "Plain resume, one page." Footer: "Devansh Choudhary, Frontend Engineer".

## 2. Professor intro and starter pick

Job: classify the visitor, pick a starter.

Happy path
1. Lab interior. Professor says: "Welcome to Kernel Region. I am Professor Stack."
2. "Before we start: are you a recruiter, an engineer, or just curious?" Menu: **Recruiter** / **Engineer** / **Just curious**.
3. Recruiter: Professor says "Then you want the short version. Open it now?" Menu: **Open Recruiter Mode** / **Play anyway**. Open goes to `/resume`. Play anyway continues.
4. Engineer or curious: "Three partners are waiting on the table. Pick one."
5. Starter pick screen: three creatures on the table. Left and right move the selection, A opens a confirm panel with the starter's line:
   - React (cyan): "React. Where the work lives: components and state."
   - Node.js (green): "Node.js. Backend, working knowledge."
   - Claude Code (orange): "Claude Code. Writes next to me."
6. Confirm: "Choose React?" **Yes** / **No**. Yes: "React joined your team." Walk out to Agra.

| State | What the visitor sees |
|---|---|
| Empty | Role never chosen (back button): defaults to `curious`, dialog continues at step 4. |
| Loading | Lab background shows first; creatures pop in when sprites resolve. Until then the three slots show their color and name only. |
| Partial | One starter sprite fails: that slot shows a color orb with the name. Selection still works. |
| Error | Both sprite and data fail: Professor says "The table is empty. Take React anyway." and assigns React. |
| Success | Confirm panel closes, team shows the starter, save writes `role`, `starter`. |

## 3. Overworld HUD

Job: walk and read. The map is the anchor. Dialog is the only large chrome.

Elements: location banner top-left ("Gear City"), "Skip to resume" top right, Start button hint "Menu" bottom right desktop. Dialog bottom. On phone: D-pad bottom-left, A and B bottom-right, tap-to-walk on the map.

Happy path (Gear City library)
1. Visitor walks to the Librarian.
2. Press A. Dialog (speaker tab "Librarian"): "400+ LeetCode problems solved. All shelved here."
3. Advance arrow blinks. Press A again: "The rest of the building is for IIT Patna's B.Tech in Mechanical Engineering, 2019 to 2023."
4. Dialog closes, movement resumes, Skilldex notes nothing new (facts do not count as skills).
5. Sign near the path: "Gear City. Where a gear learned to be { }."

| State | What the visitor sees |
|---|---|
| Empty | Dialog closed. HUD shows banner, link, and (phone) controls only. The hint "Press Z to talk" fades after the first dialog. |
| Loading | Map load: gear spinner centered, banner reads "Loading Gear City". Inputs ignored. Never longer than 2 s without a retry hint. |
| Partial | NPC sprite missing: invisible NPC is replaced by a sign post with the same dialog. Tiles missing: grass tile fills. |
| Error | Map file fails: dialog box "This area did not load. Press A to retry." plus link "Skip to resume". Retry 3 times, then "Go back to Agra". |
| Success | Dialog finishes, banner changes on entering a new town: "Junglee Jungle" with a 1 s slide (static under reduced motion). |

Mobile: the game canvas sits under the top bar at integer scale and uses the height (240 x 288 native on a 390 x 844 phone, shown at 320 x 384 CSS px). Dialog sits over the canvas bottom. D-pad on the left and A and B on the right start 80 px below the canvas, so a thumb rests on them. Menu button below. Hit targets are 48 px or more. Orientation landscape: canvas at 320 x 180 native, controls overlay the corners at 70% opacity.

Fallbacks: location name missing: banner hidden. Dialog line missing: skip that line, never show empty box.

## 4. Start menu

Job: jump anywhere, including out.

Happy path
1. Press Enter or tap the menu button. Panel slides in from the right (static under reduced motion).
2. Rows: **Skilldex**, **Bugdex**, **Trainer Card**, **World Map**, **Resume Mart**, **Recruiter Mode**, **Options**, **Save**, **Close**.
3. Up/down moves the cursor. A opens the row. B or Close shuts the menu.
4. Save: dialog "Progress saved." Footer of the panel shows "Badges 3 / 5" and "Time 12:40" from the save.
5. Recruiter Mode row opens the in-game Recruiter panel (the resume as plain text over the paused game, with contact links). Close or B returns to the Start menu. The Title row and the Professor's offer still go to `/resume/`; `?mode=recruiter` opens the panel after load, or goes to `/resume/` if the engine fails.

| State | What the visitor sees |
|---|---|
| Empty | New game: Skilldex row subline "0 / 32 seen", Bugdex "Bugs caught 0 / 6" (the total is the derived set of catchable bugs, never hardcoded). |
| Loading | Menu opens instantly from memory. Rows with data show `--` until the save read finishes (under 50 ms). |
| Partial | Save missing: footer shows "Badges 0 / 5" and "Time 0:00". |
| Error | Save write fails: dialog "Could not save in this browser. Progress will not carry over." |
| Success | "Progress saved." |

Bugdex: reuses the Skilldex layout (list left, detail right) with the five ghost bugs of the KaneAI Basement. It is not drawn as its own frame. Entry text comes from the resume line "Found five silent data-loss bugs by checking every payload against the Go backend." Individual bug names are invented game content and carry no resume claim. Not drawn as a frame; flagged in the report.

## 5. Battle

Job: show one resume fact per move in 4 turns or fewer.

Champion variant (Hall of Fame approach): Devansh front sprite (30 x 64 native) on the enemy platform, plate "Devansh / Champion", dialog box with his 38 x 38 portrait: "Champion Devansh wants to battle!" Drawn as `Battle/champion`. Layout of the wild-bug battle: wild bug plate top-left with HP bar, bug sprite top-right on a platform. Player's starter back view bottom-left, plate bottom-right. Message box bottom, move grid right of it. The two sprites and the message box are the anchor.

Happy path (wild NullPointerException)
1. Dialog: "A wild NullPointerException appeared!" then "Go! React!"
2. Menu: **Fight**, **Skilldex**, **Bag** (Resume), **Run** (Recruiter Mode). Choose Fight.
3. Moves (all from the resume): **Diff Save**, **Feature Flag**, **Payload Check**, **Full Fallback**.
4. Choose Diff Save. Dialog: "React used Diff Save! A save went from 300 KB to 3 KB." Bug HP drops 50%.
5. Choose Payload Check: "Payload Check! Five silent data-loss bugs found by checking every payload against the Go backend." HP drops 100%.
6. Win: "NullPointerException fainted!" then "Skilldex updated: React 18/19." Return to map. At most 4 turns: the bug always faints on turn 3 or 4.

| State | What the visitor sees |
|---|---|
| Empty | Move slot with no data: slot shows "--" and is skipped. If all four fail: single move "Struggle" prints "No notes for this move. Open Skilldex." |
| Loading | Battle intro: "Loading battle" for at most 400 ms, then the bug slides in (static under reduced motion). |
| Partial | Bug sprite fails: sprite replaced by red orb; name and HP bar still work. |
| Error | Battle state fails: dialog "The battle froze. You got away safely." and return to the map. |
| Success | Win text, bug HP bar at 0 (`hp-low`), starter plate shows full HP (`hp-high`). |

Run: always works. Text: "Got away safely." and the Recruiter Mode row appears in the menu bar for that moment.

Fallbacks: HP values are game state, not external. Move name missing: slot `--`. Enemy name missing: "A wild bug".

## 6. Skilldex

Job: browse every skill in the resume.

Layout: left list grouped by gym, right detail with the selected skill. Header tabs: Core, Design System and A11y, Monorepo and Tooling, Cross-stack and AI, Backend. Totals "Seen 14 / 32".

Happy path
1. Open from Start menu. Cursor on first Core entry (React 18/19).
2. Detail: name, group, "Seen at" line (resume phrase), and a gym badge slot.
3. Left/right changes the group tab; up/down moves entries.
4. Unseen entry shows `???` and a hint: "Find this in: TestMu City".
5. B returns to the Start menu.

Entry text rule: only resume phrases. React 18/19: "Frontend engineer (React, TypeScript) at LambdaTest." TypeScript: same line. Next.js 15: "Built the KoalaLab customer site." Tailwind: "Junglee Blog / CMS frontend and KoalaLab." WCAG 2.1 AA: "Drove WCAG 2.1 AA passes at TestMu AI." Go / Python backend contracts: "Found five silent data-loss bugs by checking every payload against the Go backend." Entries without a resume sentence show only "Listed under Core".

| State | What the visitor sees |
|---|---|
| Empty | "Seen 0 / 32". Every row shows `???` with a hint. First row hint: "Talk to Mom in Agra". |
| Loading | List renders names immediately; detail pane shows "Reading entry..." for under 100 ms. |
| Partial | Some entries seen: seen rows in `ink`, unseen in `muted` with `???`. |
| Error | Skill data fails to parse: "Skilldex could not load. Open the plain list on /resume." with link. |
| Success | "Seen 32 / 32": header shows "Complete" and the dialog "Skilldex complete. That is the whole stack." |

## 7. Trainer Card

Job: summary of the visitor's progress and who Devansh is.

Layout: card fills the screen, Devansh photo (48 x 64 native at 4x) at left, large "Devansh Choudhary" and "Frontend Engineer" as the anchor, avatar left, stats right, five badge slots at the bottom.

Happy path
1. Open from Start menu.
2. Card shows: Name Devansh Choudhary. Class Frontend Engineer. Money 400 coins ("400+ LeetCode problems solved"). Education: B.Tech, IIT Patna, 2019 to 2023. Now: Member of Technical Staff, Frontend at TestMu AI. Time (play time). Badges.
3. Badge slots: Core, Design System and A11y, Monorepo and Tooling, Cross-stack and AI, Backend. Earned badges are filled with the gym color, others show an outline.
4. A on a badge: tooltip "Core. React, TypeScript, Next.js."
5. B closes.

| State | What the visitor sees |
|---|---|
| Empty | Badges 0 / 5, five outlines, Time 0:00. Name, class, education, money always show (they are resume facts). |
| Loading | Resume fields show instantly (static). Time and badges show `--` for under 50 ms. |
| Partial | Some badges earned. Unearned badge slots show hint: "Beat the Monorepo and Tooling gym in Junglee Jungle". |
| Error | Save unreadable: Time `0:00`, Badges `0 / 5`, line: "Progress could not be read." |
| Success | Five badges: card border turns gold and the line "All gyms cleared. The Elite Four are waiting." |

## 8. Patch Center (contact form)

Job: send a message to Devansh.

Layout: PC terminal screen as a form: three fields stacked left, the PC box (KoalaLab project) on the right. Form is the anchor.

Happy path
1. Walk into Patch Center, press A on the PC. Dialog: "Booting the Patch Center PC."
2. Fields: **Your name** and **Your email** side by side, then **Message**. Helper under the title: "Send Devansh a message. Replies go to the email you enter."
3. Right side: PC box "Project box: KoalaLab. Sole Frontend Developer. Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI. Container-security platform for GitHub Actions." with link "koalalab.com".
4. Primary button **Send message**. Secondary link: "Or email devanshchoudhary999@gmail.com".
5. On success, dialog: "Message sent. Thanks, {name}." Name falls back to "friend".

| State | What the visitor sees |
|---|---|
| Empty | Empty fields with placeholders "Ada Lovelace", "ada@company.com", "What are you building?" Button enabled. Errors only on submit. |
| Loading | Button reads "Sending..." and is disabled. Fields are read-only. Spinner is the gear icon. |
| Partial | One field invalid: red `cursor` outline on that field, text under it states the fix. The other fields keep their values. |
| Error | Network or server error: banner above the button "Message not sent. Your text is still here. Try again, or use the address below." The address appears once, in the "Or email" line next to the button. Button returns to "Send message". |
| Success | Form collapses to "Message sent. I will reply to {email}." and a **Send another** button. Email falls back to "the address you gave". |

Rate limited (429): "Too many messages from this browser. Email devanshchoudhary999@gmail.com instead."

## 9. Resume Mart

Job: get the resume PDF.

Layout: shop counter, clerk at center. A single item card "Resume (PDF)", price "0 coins", button **Download resume**. Because there is only one thing to buy, the item is the anchor.

Happy path
1. Walk to the clerk, press A. Clerk: "Welcome. Today's only item is free."
2. List: **Resume (PDF) 0 coins**. Detail pane: "Devansh Choudhary, Frontend Engineer. One page."
3. Press A on the item: confirm "Take it?" **Yes** / **No**.
4. Yes: browser downloads the PDF. Dialog: "You got the Resume! Put it in your Bag." Bag shows 1 copy.
5. Leaving: "Come again."

| State | What the visitor sees |
|---|---|
| Empty | Bag has 0 copies. Item row shows price 0 and button. |
| Loading | After Yes: "Downloading..." for under 1 s on slow networks, button disabled. |
| Partial | PDF size unknown: detail omits the size line. Never shows `NaN KB`. |
| Error | 404 or blocked: "The PDF did not load. Try again, or copy the text from /resume." with link to `/resume`. |
| Success | "You got the Resume!" and bag count 1. A second purchase says "You already have it. Take another?" |

## 10. Recruiter Mode (`/resume`)

Job: read the whole resume in 30 seconds. Real light and dark themes, follows the system setting with a toggle. No game art except a small pixel wordmark.

Layout (desktop 1280, single column 720 max): header with name, title, links; then Summary, Experience, Selected project, Skills, Education. Right rail (desktop) holds **Download PDF** and **Email me** as sticky actions. "Play the game" link top right. The name and current role are the anchor.

Happy path
1. Header: "Devansh Choudhary", "Frontend Engineer", email link, GitHub, LinkedIn, "Download PDF", "Play the game".
2. Summary: the resume summary line verbatim.
3. Experience, newest first: TestMu AI (formerly LambdaTest), Member of Technical Staff, Frontend, Nov 2025 to Present; Junglee Games, Software Engineer I, Jan 2025 to Nov 2025; Marrfa, Frontend Engineer (Contract), Nov 2024 to Jan 2025; Junglee Games, Product Analyst, Jun 2023 to Jun 2024. Bullets verbatim from the resume.
4. Selected Project: KoalaLab.
5. Skills in five groups. Education: B.Tech, IIT Patna, 2019 to 2023.
6. Download PDF fetches the file. Email me opens mail client.

| State | What the visitor sees |
|---|---|
| Empty | Not possible: content is static in the repo. If `resume.json` is empty at build, the build fails. |
| Loading | Server-rendered, no spinner. Theme is set before paint from the stored choice or system, no flash. |
| Partial | A bullet list missing for a role: role header shows alone. A missing link hides that link. |
| Error | PDF 404: inline notice under the button "The PDF did not load. The full text is on this page." |
| Success | Download starts, button label stays "Download PDF", a toast "Download started" (visible, polite live region). |

Print: the page prints to one page.

## 11. Asset-loading screen

Job: reassure, then get out of the way.

Layout: dark background, a gear turning into `{ }` centered (the anchor), progress bar below, and a "Skip to resume" link top right.

Happy path
1. Gear icon shows, caption "Loading Kernel Region".
2. Bar fills by bytes loaded. Tip rotates once at 50%: "Tip: press Enter for the menu."
3. At 100%, the title screen appears.

| State | What the visitor sees |
|---|---|
| Empty | Bar at 0%, caption "Starting up". |
| Loading | Bar fills, percent shown as text "42%". |
| Partial | Optional audio still loading: game starts, caption "Music is loading and will start when ready". |
| Error | A required asset fails: gear stops, text "Some files did not load. Retry, or open the resume." Buttons **Retry** and **Skip to resume**. |
| Success | Bar full, fade into Title (cut under reduced motion). |

Slow connection (over 6 s): extra line "Slow connection. The plain resume loads faster." with the link.

## 12. World map

Job: plan the route and jump between visited towns.

Layout: one-page region map fills the screen; numbered town markers in route order; a side list "Route" on the left names each stop. The map is the anchor.

Route order (play order, with the resume fact for each):

| # | Place | What it holds |
|---|---|---|
| 1 | Agra | Home. Bedroom PC = About. Mom gives Running Shoes. Hometown. Light Agra flavor only (marble dome, petha shop sign). |
| 2 | Gear City | IIT Patna, B.Tech Mechanical Engineering, 2019 to 2023. Library: 400+ LeetCode. Gym 1: Core. |
| 3 | Junglee Jungle | Product Analyst, Jun 2023 to Jun 2024 at the entrance (A/B paths). Software Engineer I, Jan 2025 to Nov 2025 inside (2FA gate, Blog / CMS, Best Developer trophy). Gym 2: Monorepo and Tooling. |
| 4 | Marrfa Estates | Contract, Nov 2024 to Jan 2025. Three role doors. Side gym: Backend (working knowledge). |
| 5 | TestMu City | "formerly LAMBDA CITY". KaneAI tower. Gym 3: Design System and A11y. Gym 4: Cross-stack and AI. |
| 6 | Victory Road and Hall of Fame | Elite Four: DSA, Machine Coding, System Design, Behavioral. Champion: Devansh. Contact CTA. |

Happy path
1. Open from Start menu. Current location pulses (static under reduced motion).
2. Move the cursor to a visited town: tooltip with the name and its one-line fact.
3. A on a visited town: "Fly to Gear City?" **Yes** / **No**. Fly moves the avatar to the town's Fly spot.
4. Unvisited towns show a padlock-free dim marker and `???` name until reached; their route row says "Not visited yet".
5. B closes.

| State | What the visitor sees |
|---|---|
| Empty | Only Agra is named; others `???`. |
| Loading | Map image shows first; markers appear after save read. |
| Partial | Some towns named; Marrfa may show before Junglee's second era is done. |
| Error | Fly target map fails: "That town did not load. Try again." Stay on the map. |
| Success | All named, Hall of Fame marker shows a star. |

---

## Design files

- Design file: `.anbu/design/portfolio-quest.pen` (pen 0.3.10, headless). Re-run any screen: `python3 .anbu/design/scripts/build.py vars.js <screen>.js`. Notes in `.anbu/design/pen-notes.md`.
- Pixel scenes, buildings and creatures are placeholders from `.anbu/design/scripts/make_placeholder_art.py`. The avatar, Librarian, Professor and Clerk sprites are real Ninja Adventure art (CC0). Avatar assets live in `.anbu/design/avatar/`.
- Game frames pair day and night. Chrome (dialog, menus) is identical in both by design; only the world art and the backdrop change. `/resume` frames are real light and dark.
- Pencil frames show one state per screen plus the key error states (Patch Center, Loading). The other states are specified in text above.

| Screen | State shown | Theme | PNG |
|---|---|---|---|
| Battle, Champion Devansh | success (intro) | day | `.anbu/design/battle-champion-day.png` |
| Battle, Champion Devansh | success (intro) | night | `.anbu/design/battle-champion-night.png` |
| Battle, wild bug | success (turn start) | day | `.anbu/design/battle-default-day.png` |
| Battle, wild bug | success (turn start) | night | `.anbu/design/battle-default-night.png` |
| Asset loading | loading | day | `.anbu/design/loading-default-day.png` |
| Asset loading | loading | night | `.anbu/design/loading-default-night.png` |
| Asset loading | error | day | `.anbu/design/loading-error-day.png` |
| Asset loading | error | night | `.anbu/design/loading-error-night.png` |
| Overworld HUD, desktop | success (dialog with face) | day | `.anbu/design/overworld-dialog-desktop-day.png` |
| Overworld HUD, desktop | success (dialog with face) | night | `.anbu/design/overworld-dialog-desktop-night.png` |
| Overworld HUD, mobile D-pad + A/B | success (dialog open) | day | `.anbu/design/overworld-dialog-mobile-day.png` |
| Overworld HUD, mobile D-pad + A/B | success (dialog open) | night | `.anbu/design/overworld-dialog-mobile-night.png` |
| Patch Center | empty | day | `.anbu/design/patch-center-default-day.png` |
| Patch Center | empty | night | `.anbu/design/patch-center-default-night.png` |
| Patch Center | error (send failed) | day | `.anbu/design/patch-center-error-day.png` |
| Patch Center | error (send failed) | night | `.anbu/design/patch-center-error-night.png` |
| Patch Center | partial (invalid email) | day | `.anbu/design/patch-center-partial-day.png` |
| Patch Center | partial (invalid email) | night | `.anbu/design/patch-center-partial-night.png` |
| Professor intro | success | day | `.anbu/design/professor-intro-default-day.png` |
| Professor intro | success | night | `.anbu/design/professor-intro-default-night.png` |
| Recruiter Mode /resume, desktop | success | dark | `.anbu/design/recruiter-default-dark.png` |
| Recruiter Mode /resume, desktop | success | light | `.anbu/design/recruiter-default-light.png` |
| Recruiter Mode /resume, 390 px | success | dark | `.anbu/design/recruiter-mobile-dark.png` |
| Recruiter Mode /resume, 390 px | success | light | `.anbu/design/recruiter-mobile-light.png` |
| Resume Mart | empty (bag 0) | day | `.anbu/design/resume-mart-default-day.png` |
| Resume Mart | empty (bag 0) | night | `.anbu/design/resume-mart-default-night.png` |
| Skilldex | partial (14 / 32 seen) | day | `.anbu/design/skilldex-default-day.png` |
| Skilldex | partial (14 / 32 seen) | night | `.anbu/design/skilldex-default-night.png` |
| Start menu | success | day | `.anbu/design/start-menu-default-day.png` |
| Start menu | success | night | `.anbu/design/start-menu-default-night.png` |
| Starter pick | success | day | `.anbu/design/starter-pick-default-day.png` |
| Starter pick | success | night | `.anbu/design/starter-pick-default-night.png` |
| Title | success (save exists, Press Start) | day | `.anbu/design/title-default-day.png` |
| Title | success (save exists, Press Start) | night | `.anbu/design/title-default-night.png` |
| Title | loading (engine loading) | day | `.anbu/design/title-loading-day.png` |
| Title | loading (engine loading) | night | `.anbu/design/title-loading-night.png` |
| Trainer Card | partial (3 / 5 badges) | day | `.anbu/design/trainer-card-default-day.png` |
| Trainer Card | partial (3 / 5 badges) | night | `.anbu/design/trainer-card-default-night.png` |
| World map | success | day | `.anbu/design/world-map-default-day.png` |
| World map | success | night | `.anbu/design/world-map-default-night.png` |

Avatar files in `.anbu/design/avatar/`: `champion-battle-front-30x64.png`, `champion-battle-front-preview-6x.png`, `devansh-idle-down-16x16.png`, `devansh-walk-sheet-64x64.png`, `devansh-walk-sheet-preview-6x.png`, `dialog-portrait-38x38.png`, `dialog-portrait-preview-8x.png`, `trainer-card-photo-48x64.png`, `trainer-card-photo-preview-8x.png`.
