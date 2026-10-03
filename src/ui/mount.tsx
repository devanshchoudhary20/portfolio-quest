import { createRoot } from 'react-dom/client';
import './ui.css';
import { Root } from './Root';

export function mountUi(container: HTMLElement) {
  createRoot(container).render(<Root />);
}
