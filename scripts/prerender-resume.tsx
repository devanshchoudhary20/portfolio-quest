import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resume } from '../src/resume/Resume';
import { Sent } from '../src/resume/Sent';
import { summaryText } from '../src/resume/view';

const dist = resolve(import.meta.dirname, '../dist');

function inject(page: string, element: ReactElement) {
  const file = join(dist, page);
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<!--app-->')) throw new Error(`${page} lost its <!--app--> marker`);
  // apostrophes stay literal so the text greps as written; safe inside double-quoted attributes
  const markup = renderToStaticMarkup(element).replaceAll('&#x27;', "'");
  writeFileSync(file, html.replace('<!--app-->', () => markup));
  console.log(`prerender-resume: wrote ${markup.length} bytes into dist/${page}`);
}

inject('resume/index.html', <Resume />);
inject('resume/sent/index.html', <Sent />);

// index.html carries the same crawlable summary as static text
const home = readFileSync(join(dist, 'index.html'), 'utf8');
if (!home.includes(summaryText)) throw new Error('index.html summary drifted from src/content');
