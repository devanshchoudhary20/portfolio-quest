import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { factById, profile, project } from '../content';
import { contactErrors, sendContact } from '../net/contact';
import type { ContactDraft } from '../net/draft';
import { FALLBACK_REPLY, FIELD_EMAIL, FIELD_MESSAGE, FIELD_NAME, OR_EMAIL, PATCH_INTRO, PATCH_TITLE, PLACEHOLDER_EMAIL, PLACEHOLDER_MESSAGE, PLACEHOLDER_NAME, PROJECT_BOX, SEND_ANOTHER, SEND_FAILED, SEND_LABEL, SENDING, messageSent, tooManyMessages } from '../game/world/lines';
import { store } from '../state/store';
import { focusGame } from './focusGame';
import { PanelShell } from './PanelShell';
import { actions, useGame } from './useGame';

type Status = 'idle' | 'sending' | 'sent' | 'failed' | 'limited';

function closeContact() {
  actions.closePanel();
  // back in the Hall of Fame, its own button takes the focus
  if (store.getState().panel === 'none') focusGame();
}

// the Patch Center form: it keeps the typed text in the store, so an error or a closed panel never loses it
export function ContactPanel() {
  const draft = useGame((s) => s.contactDraft);
  const [status, setStatus] = useState<Status>('idle');
  const [attempted, setAttempted] = useState(false);
  const [botField, setBotField] = useState('');
  // the draft is cleared on success, so the address the reply goes to is kept apart
  const [sentTo, setSentTo] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const errors = attempted ? contactErrors(draft) : {};
  const sending = status === 'sending';
  const sent = status === 'sent';

  // the form and the success view swap in place, so focus follows the swap; the first render keeps PanelShell's autofocus
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    (sent ? againRef : nameRef).current?.focus();
  }, [sent]);

  // Root's live region reads the notice; it is empty before the text arrives, so screen readers hear the change
  useEffect(() => {
    actions.setNotice(sent ? messageSent(sentTo || FALLBACK_REPLY) : '');
    return () => actions.setNotice('');
  }, [sent, sentTo]);
  const stackLine = project.stack.join(', ');
  const projectFact = factById.get(project.id);
  const projectText = projectFact?.long ?? projectFact?.short ?? project.name;
  const siteLabel = new URL(project.url).host;
  const replyTo = sentTo || FALLBACK_REPLY;
  const failure = status === 'limited' ? tooManyMessages(profile.email) : SEND_FAILED;
  const sendLabel = sending ? SENDING : SEND_LABEL;
  const showFailure = status === 'failed' || status === 'limited';

  const bind = (field: keyof ContactDraft) => ({
    name: field,
    value: draft[field],
    readOnly: sending,
    'aria-invalid': errors[field] !== undefined,
    'aria-describedby': errors[field] === undefined ? undefined : `pq-contact-${field}-error`,
    onChange: (event: { target: { value: string } }) => actions.setContactDraft({ [field]: event.target.value }),
  });

  const note = (field: keyof ContactDraft) =>
    errors[field] === undefined ? null : (
      <p id={`pq-contact-${field}-error`} className="pq-contact-error">
        {errors[field]}
      </p>
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (sending || Object.keys(contactErrors(draft)).length > 0) return;
    setStatus('sending');
    setSentTo(draft.email.trim());
    const result = await sendContact(draft, botField);
    setStatus(result);
    if (result === 'sent') actions.clearContact();
  };

  const trapBot = (event: ChangeEvent<HTMLInputElement>) => setBotField(event.target.value);

  const another = () => {
    setStatus('idle');
    setAttempted(false);
  };

  const success = (
    <section className="pq-contact-form">
      <p>{messageSent(replyTo)}</p>
      <button type="button" className="pq-primary" ref={againRef} onClick={another} data-autofocus>
        {SEND_ANOTHER}
      </button>
    </section>
  );

  const banner = showFailure ? (
    <p className="pq-contact-banner" role="alert">
      {failure}
    </p>
  ) : null;

  const form = (
    <form className="pq-contact-form" onSubmit={submit} noValidate>
      <p className="pq-muted">{PATCH_INTRO}</p>
      <div className="pq-contact-row">
        <label>
          {FIELD_NAME}
          <input {...bind('name')} ref={nameRef} type="text" autoComplete="name" placeholder={PLACEHOLDER_NAME} data-autofocus />
          {note('name')}
        </label>
        <label>
          {FIELD_EMAIL}
          <input {...bind('email')} type="email" autoComplete="email" placeholder={PLACEHOLDER_EMAIL} />
          {note('email')}
        </label>
      </div>
      <label>
        {FIELD_MESSAGE}
        <textarea {...bind('message')} rows={3} placeholder={PLACEHOLDER_MESSAGE} />
        {note('message')}
      </label>
      <p hidden>
        <input name="bot-field" tabIndex={-1} autoComplete="off" value={botField} onChange={trapBot} aria-hidden="true" />
      </p>
      {banner}
      <div className="pq-contact-actions">
        <button type="submit" className="pq-primary" disabled={sending}>
          {sendLabel}
        </button>
        <span className="pq-muted">
          {OR_EMAIL} <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </span>
      </div>
    </form>
  );

  return (
    <PanelShell title={PATCH_TITLE} className="pq-contact" onClose={closeContact}>
      <div className="pq-contact-body">
        {sent ? success : form}
        <aside className="pq-contact-box" aria-label={PROJECT_BOX}>
          <p className="pq-muted">{PROJECT_BOX}</p>
          <h3>{project.name}</h3>
          <p>{project.role}</p>
          <p className="pq-muted">{stackLine}</p>
          <p>{projectText}</p>
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            {siteLabel}
          </a>
        </aside>
      </div>
    </PanelShell>
  );
}
