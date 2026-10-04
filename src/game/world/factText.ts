import { factById } from '../../content';
import type { FactId } from '../../content';
import type { Mode } from './save';

// engineers get the long form of a fact when it has one; everyone else gets the short line
export const factText = (id: FactId, mode: Mode): string | undefined => {
  const fact = factById.get(id);
  return mode === 'engineer' ? (fact?.long ?? fact?.short) : fact?.short;
};
