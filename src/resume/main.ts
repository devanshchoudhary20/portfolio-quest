import './resume.css';
import { initThemeToggle } from './theme';

const show = (id: string) => document.getElementById(id)?.removeAttribute('hidden');

let hideTimer: ReturnType<typeof setTimeout> | undefined;

async function onDownload() {
  try {
    const res = await fetch('/resume.pdf', { method: 'HEAD' });
    if (!res.ok) throw new Error(String(res.status));
    show('download-toast');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => document.getElementById('download-toast')?.setAttribute('hidden', ''), 3000);
  } catch {
    show('pdf-notice');
  }
}

initThemeToggle();
document.getElementById('download-pdf')?.addEventListener('click', onDownload);
