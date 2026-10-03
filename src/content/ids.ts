type Brand<T, B extends string> = T & { readonly __brand: B };

export type FactId = Brand<string, 'FactId'>;
export type TownId = Brand<string, 'TownId'>;
export type SkillGroupId = Brand<string, 'SkillGroupId'>;
export type FlagId = Brand<string, 'FlagId'>;
export type DestId = Brand<string, 'DestId'>;

// patch-center holds the KoalaLab PC box; it has no town map of its own
export const TOWN_IDS = [
  'agra',
  'gear',
  'junglee',
  'marrfa',
  'testmu',
  'elite',
  'patch-center',
] as const;

export const factId = (id: string) => id as FactId;
export type TownKey = (typeof TOWN_IDS)[number];

export const townId = (id: TownKey) => id as TownId;
export const skillGroupId = (id: string) => id as SkillGroupId;
export const flagId = (id: string) => id as FlagId;
export const destId = (id: string) => id as DestId;

export const isTownId = (value: unknown): value is TownId =>
  typeof value === 'string' && (TOWN_IDS as readonly string[]).includes(value);

// towns that ship a Tiled map; patch-center is content-only
export const isMapTownId = (value: unknown): value is TownId => isTownId(value) && value !== 'patch-center';
