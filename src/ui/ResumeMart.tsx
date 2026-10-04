import { useEffect, useRef, useState } from 'react';
import { profile } from '../content';
import { FLAGS } from '../game/world/flags';
import { CLERK, CLOSE, DOWNLOADING, DOWNLOAD_RESUME, ITEM_LINES, ITEM_NAME, ITEM_PRICE, MART_AGAIN, MART_ASK, MART_BYE, MART_TITLE, NO, OPEN_FULL_PAGE, PDF_FAILED, YES, bagLabel, martDetail } from '../game/world/lines';
import { resumePdfHref } from '../resume/view';
import { PanelShell } from './PanelShell';
import { actions, useGame } from './useGame';

type Step = 'idle' | 'asking' | 'loading' | 'error';

const say = (...lines: string[]) => actions.openDialog({ speaker: CLERK, portrait: null, lines });

function leave() {
  actions.closePanel();
  say(MART_BYE);
}

// a HEAD request proves the PDF is there before the anchor click; a blocked or missing file reads as not ok
async function pdfIsThere(signal: AbortSignal) {
  try {
    return (await fetch(resumePdfHref, { method: 'HEAD', signal })).ok;
  } catch {
    return false;
  }
}

// the Resume costs nothing: Yes checks the PDF, then starts the download, files the flag and the clerk says goodbye
export function ResumeMart() {
  const held = useGame((s) => s.flags.includes(FLAGS.resume));
  const [step, setStep] = useState<Step>('idle');
  const download = useRef<HTMLButtonElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (step === 'idle') download.current?.focus();
    else if (step !== 'loading') yes.current?.focus();
  }, [step]);

  const take = async () => {
    request.current = new AbortController();
    const { signal } = request.current;
    setStep('loading');
    const ok = await pdfIsThere(signal);
    if (signal.aborted) return;
    if (!ok) {
      setStep('error');
      return;
    }
    actions.requestDownload();
    actions.addFlag(FLAGS.resume);
    actions.closePanel();
    say(ITEM_LINES.get(FLAGS.resume) ?? '', MART_BYE);
  };

  const loading = step === 'loading';
  const prompt = held ? MART_AGAIN : MART_ASK;
  const failure =
    step === 'error' ? (
      <p role="alert">
        {`${PDF_FAILED} `}
        <a href="/resume/">{OPEN_FULL_PAGE}</a>
      </p>
    ) : null;
  const answers = (
    <div className="pq-mart-ask" role="group" aria-label={prompt}>
      <p data-testid="mart-prompt">{prompt}</p>
      <button ref={yes} type="button" disabled={loading} onClick={take}>
        {loading ? DOWNLOADING : YES}
      </button>
      <button type="button" disabled={loading} onClick={() => setStep('idle')}>
        {NO}
      </button>
      {failure}
    </div>
  );
  const start = (
    <button ref={download} type="button" className="pq-primary" data-autofocus onClick={() => setStep('asking')}>
      {DOWNLOAD_RESUME}
    </button>
  );
  const content = step === 'idle' ? start : answers;

  return (
    <PanelShell title={MART_TITLE} className="pq-mart" onClose={leave} backLabel={CLOSE}>
      <p className="pq-mart-item">
        <span>{ITEM_NAME}</span>
        <span>{ITEM_PRICE}</span>
      </p>
      <p className="pq-muted">{martDetail(profile.name, profile.title)}</p>
      {content}
      <p className="pq-muted" data-testid="mart-bag">
        {bagLabel(held ? 1 : 0)}
      </p>
    </PanelShell>
  );
}
