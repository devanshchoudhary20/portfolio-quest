import { facts } from './facts';
import type { Fact } from './types';
import type { FactId } from './ids';

export * from './ids';
export * from './types';
export * from './resume';
export { facts };

export const factById = new Map<FactId, Fact>(facts.map((fact) => [fact.id, fact]));

export const isFactId = (value: unknown): value is FactId => typeof value === 'string' && factById.has(value as FactId);
