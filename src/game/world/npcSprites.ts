// each key loads its sheet as texture npc-<key>; maps pick one with sprite=<key>
export const NPC_SPRITES = [
  'mom',
  'librarian',
  'student',
  'core',
  'design',
  'monorepo',
  'cross',
  'backend',
  'analyst',
  'editor',
  'manager',
  'reception',
  'designer',
  'robot',
  'ghost',
  'devansh',
  'dsa',
  'machine-coding',
  'system-design',
  'behavioral',
] as const;

// the Champion wears the player's own sheet, which is not part of the CC0 pack
export const npcSheetUrl = (key: string) => (key === 'devansh' ? '/assets/avatar/devansh-walk-sheet-64x64.png' : `/assets/ninja-adventure/${key}-sheet.png`);
