import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Preact stands in for React in the browser bundle only; scripts/prerender-resume.tsx runs in Node under real React
const PREACT_ALIASES = [
  { find: /^react-dom\/client$/, replacement: 'preact/compat/client' },
  { find: /^react-dom$/, replacement: 'preact/compat' },
  { find: /^react\/jsx-runtime$/, replacement: 'preact/jsx-runtime' },
  { find: /^react\/jsx-dev-runtime$/, replacement: 'preact/jsx-runtime' },
  { find: /^react$/, replacement: 'preact/compat' },
];

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { alias: PREACT_ALIASES },
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        resume: resolve(import.meta.dirname, 'resume/index.html'),
        resumeSent: resolve(import.meta.dirname, 'resume/sent/index.html'),
      },
    },
  },
});
