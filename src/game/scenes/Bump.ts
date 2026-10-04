import { store } from '../../state/store';
import type { GridMover } from '../movement/GridMover';

// the audio module drops a bump inside 300 ms; this spacing keeps a key held on a wall from writing the store every frame
const BUMP_MS = 300;

// a held key that leaves the character standing against something is a bump
export class Bump {
  private last = 0;

  constructor(
    private readonly mover: GridMover,
    private readonly id: string,
  ) {}

  check(now: number) {
    if (this.mover.isMoving(this.id) || !this.mover.blockedAhead(this.id) || now - this.last < BUMP_MS) return;
    this.last = now;
    store.getState().actions.playCue('bump');
  }
}
