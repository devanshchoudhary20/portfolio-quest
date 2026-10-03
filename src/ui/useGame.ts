import { useStore } from 'zustand';
import { store } from '../state/store';
import type { State } from '../state/store';

export const useGame = <T,>(selector: (state: State) => T) => useStore(store, selector);
export const actions = store.getState().actions;
