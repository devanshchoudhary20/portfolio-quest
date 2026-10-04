type Brand<T, B extends string> = T & { readonly __brand: B };

export type FactId = Brand<string, 'FactId'>;
export type TownId = Brand<string, 'TownId'>;
export type SkillGroupId = Brand<string, 'SkillGroupId'>;
export type FlagId = Brand<string, 'FlagId'>;
export type DestId = Brand<string, 'DestId'>;
export type SpeciesId = Brand<string, 'SpeciesId'>;
export type MoveId = Brand<string, 'MoveId'>;
export type TrainerId = Brand<string, 'TrainerId'>;

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
export const speciesId = (id: string) => id as SpeciesId;
export const moveId = (id: string) => id as MoveId;
export const trainerId = (id: string) => id as TrainerId;

// the species a save may list as caught; the save parser lives on the title's critical path, so the list sits here and not in the battle data
export const WILD_SPECIES = ['null-pointer', 'cors', 'hydration', 'race-condition', 'memory-leak', 'off-by-one', 'silent-data-loss'] as const;
export const isSpeciesId = (value: unknown): value is SpeciesId =>
  typeof value === 'string' && (WILD_SPECIES as readonly string[]).includes(value);

export const isTownId = (value: unknown): value is TownId =>
  typeof value === 'string' && (TOWN_IDS as readonly string[]).includes(value);

// towns that ship a Tiled map; patch-center is content-only
export const isMapTownId = (value: unknown): value is TownId => isTownId(value) && value !== 'patch-center';
