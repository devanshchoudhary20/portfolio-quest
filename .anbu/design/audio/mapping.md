# Audio mapping

Source: Ninja Adventure pack (CC0), `vendor/ninja-adventure/Audio`. Picked without listening, from names, durations, loudness and structure analysis. Do a 5-minute ear pass before launch.

## Music (mono, 48 kHz, about -20 LUFS integrated)

| Key | Used for | Source | Loop (s) | Reason |
|---|---|---|---|---|
| title | Title screen | 38 - Intro.ogg | 0 - 78.545 | Intro: named for it, 78.5 s, one calm bar-exact loop (216 beats at 165 bpm) |
| agra | Agra | 33 - Calm Village.ogg | 0 - 72.0 | Calm Village: name fits home, steady -18.7 LUFS with no peaks, 72.0 s round loop |
| gear | Gear City | 4 - Village.ogg | 0 - 51.692 | Village: brisk 130 bpm, a busy campus feel, 51.7 s bar-exact (28 bars) |
| junglee | Junglee Jungle | 11 - Clearing.ogg | 0 - 69.144 | Clearing: forest name, 99 bpm, energy dips mid-track so it breathes |
| marrfa | Marrfa Estates | 32 - Manor.ogg | 0 - 53.333 | Manor: estate/mansion name. File repeats a 53.33 s cycle (4 quiet + 6 loud blocks), so one cycle is a clean loop |
| testmu | TestMu City | 20 - Good Time.ogg | 0 - 64.0 | Good Time: 117 bpm, upbeat, 64.0 s round loop, bright city mood |
| testmu_tower | TestMu tower interior | 13 - Mystical.ogg | 0 - 60.0 | Mystical: quiet 12 s intro then a driving section, reads as strange tech interior, 60.0 s |
| gym | Gyms | 23 - Road.ogg | 0 - 44.308 | Road: 130 bpm, steady forward drive for a training hall, 44.3 s bar-exact |
| battle_wild | Wild battle | 17 - Fight.ogg | 0 - 32.0 | Fight (17): short 32.0 s, quiet bed, fine for repeated brief wild encounters |
| battle_trainer | Trainer battle | 34  - Fight.ogg | 0 - 48.0 | Fight (34): fast and dense. File is 6 x 16 s blocks (3 loud, 1 dip); cut at 48.0 s block end |
| elite | Victory Road + Elite Four | 24 - Final Area.ogg | 0 - 63.429 | Final Area: slow 70 bpm build with a dark mid-section; used for Victory Road and Elite Four (2 places) |
| battle_champion | Champion battle | 3 - Revelation.ogg | 0 - 53.333 | Revelation: loudest, most dramatic head (-14 dB), 53.3 s bar-exact |
| hall_of_fame | Hall of Fame | 8 - End Theme.ogg | 0 - 38.4 | End Theme: 'ending' track, bright and loud, 38.4 s, triumphant close |

## Jingles (mono, peak -3 dBFS)

| Key | Used for | Source | Reason |
|---|---|---|---|
| badge | Badge earned | LevelUp2.wav | LevelUp2: longest level-up fanfare (2.0 s) |
| item_get | Item get | Success2.wav | Success2: short 1.2 s positive sting |
| bug_caught | Bug caught | LevelUp3.wav | LevelUp3: mid-length 1.5 s rising cue |
| victory | Victory | Success3.wav | Success3: 2.0 s, the fullest of the Success set |
| blackout | Blackout (extra) | GameOver.wav | GameOver: 2.0 s, for a lost battle |

## SFX (mono, peak -3 dBFS)

| Key | Used for | Source | Reason |
|---|---|---|---|
| menu_move | Menu move | Menu/Move2.wav | Move2, 0.10 s, the shortest tick |
| confirm | Confirm | Menu/Accept4.wav | Accept4, 0.25 s, bright blip |
| cancel | Cancel | Menu/Cancel.wav | Cancel, 0.47 s, lower pitched than confirm |
| dialog_advance | Dialog advance | Menu/Menu8.wav | Menu8, 0.18 s, soft low-centroid tick |
| warp | Door / warp | Whoosh & Slash/Whoosh2.wav | Whoosh2, 0.44 s |
| bump | Bump into wall | Hit & Impact/Impact.wav | Impact, 0.24 s, the shortest thud |
| hit | Hit | Hit & Impact/Hit5.wav | Hit5, 0.33 s |
| hit_super | Super-effective hit | Hit & Impact/Hit2.wav | Hit2, 0.70 s, longest hit, heavier |
| faint | Faint | Magic & Skill/Magic4.wav | Magic4, 0.55 s, spectral centroid falls 1099 to 675 Hz |
| gate_open | Gate open | Magic & Skill/Magic5.wav | Magic5, 0.65 s, pitch rises 344 to 1015 Hz |
| maze_rewrite | Maze rewrite | Magic & Skill/Fx.wav | Fx, 0.70 s, generic magic shimmer |
| message_sent | Message sent | Whoosh & Slash/Launch.wav | Launch, 0.38 s, whoosh-away |

## Notes

- Most music files in the pack are already bar-exact loops (lengths like 64.0, 72.0, 32.0 s), so loops run 0 to full length with no fade. Only `marrfa` and `battle_trainer` were cut, with a 300 ms tail fade.
- Loop with Web Audio `loopStart/loopEnd` from manifest.json. AAC and Opus add a few ms of encoder padding, so plain element looping may click.
- Elite is the only track used in two places. All other tracks map to one place.
