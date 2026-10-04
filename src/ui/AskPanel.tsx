import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { parseDestination } from '../game/world/ask';
import { NOT_FOUND } from '../game/world/lines';
import { actions } from './useGame';
import { focusGame } from './focusGame';
import { useFocusTrap } from './useFocusTrap';

// the KaneAI robot's prompt: free text in, a destination id out; the Overworld does the walking
export function AskPanel() {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useFocusTrap(form, actions.closePanel);

  useEffect(() => {
    input.current?.focus();
    return focusGame;
  }, []);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
    setProblem(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const destination = parseDestination(text);
    if (!destination) {
      setProblem(NOT_FOUND);
      return;
    }
    actions.closePanel();
    actions.setNav(destination.id);
  };

  return (
    <form ref={form} className="pq-ask" role="dialog" aria-modal="true" aria-label="KaneAI Robot" onSubmit={submit}>
      <label htmlFor="pq-ask-input">Tell me where to go</label>
      <input
        id="pq-ask-input"
        ref={input}
        type="text"
        value={text}
        enterKeyHint="go"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-describedby={problem ? 'pq-ask-problem' : undefined}
        onChange={onChange}
      />
      {problem ? (
        <p id="pq-ask-problem" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="pq-ask-actions">
        <button type="submit">Go</button>
        <button type="button" onClick={actions.closePanel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
