const KEY = 'pq-theme';

export function initThemeToggle() {
  const button = document.getElementById('theme-toggle');
  const root = document.documentElement;
  if (!button) return;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ?? (systemDark.matches ? 'dark' : 'light')) === 'dark';
  const sync = () => {
    button.textContent = isDark() ? 'Light theme' : 'Dark theme';
  };
  button.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, root.dataset.theme);
    } catch {
      // storage blocked: the choice still applies for this visit
    }
    sync();
  });
  systemDark.addEventListener('change', sync);
  sync();
}
