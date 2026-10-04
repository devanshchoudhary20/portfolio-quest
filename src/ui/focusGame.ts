// a closing panel hands focus to the game, not to a node that is already gone
export const focusGame = () => {
  const root = document.getElementById('game');
  if (!root) return;
  root.tabIndex = -1;
  root.focus({ preventScroll: true });
};
