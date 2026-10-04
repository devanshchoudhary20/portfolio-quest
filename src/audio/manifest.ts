// copied from .anbu/design/audio/manifest.json; paths are public/assets/audio/<file>.(ogg|m4a)
export type Kind = 'music' | 'jingle' | 'sfx';

export interface Track {
  kind: Kind;
  file: string;
  volume: number;
  loopStart?: number;
  loopEnd?: number;
}

export const TRACKS = {
  title: { kind: 'music', file: 'music/title', volume: 0.5, loopStart: 0, loopEnd: 78.545 },
  agra: { kind: 'music', file: 'music/agra', volume: 0.5, loopStart: 0, loopEnd: 72 },
  gear: { kind: 'music', file: 'music/gear', volume: 0.5, loopStart: 0, loopEnd: 51.692 },
  junglee: { kind: 'music', file: 'music/junglee', volume: 0.5, loopStart: 0, loopEnd: 69.144 },
  marrfa: { kind: 'music', file: 'music/marrfa', volume: 0.5, loopStart: 0, loopEnd: 53.333 },
  testmu: { kind: 'music', file: 'music/testmu', volume: 0.5, loopStart: 0, loopEnd: 64 },
  testmu_tower: { kind: 'music', file: 'music/testmu_tower', volume: 0.5, loopStart: 0, loopEnd: 60 },
  gym: { kind: 'music', file: 'music/gym', volume: 0.5, loopStart: 0, loopEnd: 44.308 },
  battle_wild: { kind: 'music', file: 'music/battle_wild', volume: 0.55, loopStart: 0, loopEnd: 32 },
  battle_trainer: { kind: 'music', file: 'music/battle_trainer', volume: 0.5, loopStart: 0, loopEnd: 48 },
  elite: { kind: 'music', file: 'music/elite', volume: 0.55, loopStart: 0, loopEnd: 63.429 },
  battle_champion: { kind: 'music', file: 'music/battle_champion', volume: 0.55, loopStart: 0, loopEnd: 53.333 },
  hall_of_fame: { kind: 'music', file: 'music/hall_of_fame', volume: 0.5, loopStart: 0, loopEnd: 38.4 },
  badge: { kind: 'jingle', file: 'sfx/badge', volume: 0.9 },
  item_get: { kind: 'jingle', file: 'sfx/item_get', volume: 0.8 },
  bug_caught: { kind: 'jingle', file: 'sfx/bug_caught', volume: 0.85 },
  victory: { kind: 'jingle', file: 'sfx/victory', volume: 0.9 },
  blackout: { kind: 'jingle', file: 'sfx/blackout', volume: 0.8 },
  menu_move: { kind: 'sfx', file: 'sfx/menu_move', volume: 0.5 },
  confirm: { kind: 'sfx', file: 'sfx/confirm', volume: 0.6 },
  cancel: { kind: 'sfx', file: 'sfx/cancel', volume: 0.6 },
  dialog_advance: { kind: 'sfx', file: 'sfx/dialog_advance', volume: 0.45 },
  warp: { kind: 'sfx', file: 'sfx/warp', volume: 0.6 },
  bump: { kind: 'sfx', file: 'sfx/bump', volume: 0.5 },
  hit: { kind: 'sfx', file: 'sfx/hit', volume: 0.7 },
  hit_super: { kind: 'sfx', file: 'sfx/hit_super', volume: 0.8 },
  faint: { kind: 'sfx', file: 'sfx/faint', volume: 0.7 },
  gate_open: { kind: 'sfx', file: 'sfx/gate_open', volume: 0.7 },
  maze_rewrite: { kind: 'sfx', file: 'sfx/maze_rewrite', volume: 0.6 },
  message_sent: { kind: 'sfx', file: 'sfx/message_sent', volume: 0.6 },
} as const satisfies Record<string, Track>;

export type SoundId = keyof typeof TRACKS;
export type MusicId = { [K in SoundId]: (typeof TRACKS)[K]['kind'] extends 'music' ? K : never }[SoundId];
export type CueId = Exclude<SoundId, MusicId>;

