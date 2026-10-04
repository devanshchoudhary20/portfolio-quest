import { facts, profile, skillGroups } from '../content';
import { caughtCount, CATCHABLE, speciesOf } from '../game/battle/data';
import { frontArt } from '../game/battle/art';
import { starterSpecies } from '../game/battle/controller';
import { countBadges } from '../game/world/conditions';
import { CONTACT_LABEL, DOWNLOAD_PDF, EMAIL_ME, FALLBACK_PARTNER, HOF_CTA, HOF_ENTER, HOF_TITLE, KEEP_EXPLORING, LINKEDIN, TEAM_LABEL, badgesLabel, bugsCaughtLabel, factsSeenLabel } from '../game/world/lines';
import { linkedinHref, mailtoHref, resumePdfHref, resumePdfName } from '../resume/view';
import { focusGame } from './focusGame';
import { PanelShell } from './PanelShell';
import { PHOTO_URL } from './portraits';
import { actions, useGame } from './useGame';

function keepExploring() {
  actions.closePanel();
  focusGame();
}

// the climax screen: the visitor's team beside Devansh, the counts as three cards, and the three ways to reach him
export function HallOfFame() {
  const starter = useGame((s) => s.starter);
  const seen = useGame((s) => s.seen);
  const flags = useGame((s) => s.flags);
  const caught = useGame((s) => s.caught);

  const partner = starterSpecies(starter);
  const partnerName = speciesOf(partner)?.name ?? FALLBACK_PARTNER;
  const counts = [
    factsSeenLabel(seen.length, facts.length),
    badgesLabel(countBadges(flags), skillGroups.length),
    bugsCaughtLabel(caughtCount(caught), CATCHABLE.length),
  ];
  const cards = counts.map((text) => <li key={text}>{text}</li>);

  return (
    <PanelShell title={HOF_TITLE} className="pq-hof" onClose={keepExploring} backLabel={KEEP_EXPLORING}>
      <p>{HOF_ENTER}</p>
      <section className="pq-hof-team" aria-label={TEAM_LABEL}>
        <figure>
          <img className="pq-photo" src={PHOTO_URL} alt={profile.name} width={48} height={64} />
          <figcaption>{profile.title}</figcaption>
        </figure>
        <figure>
          <img className="pq-hof-partner" src={frontArt(partner).url} alt="" width={64} height={64} />
          <figcaption>{partnerName}</figcaption>
        </figure>
      </section>
      <ul className="pq-hof-counts" data-testid="hof-counts">
        {cards}
      </ul>
      <p className="pq-hof-ask">{HOF_CTA}</p>
      <nav className="pq-hof-cta" aria-label={CONTACT_LABEL}>
        <a className="pq-primary" href={mailtoHref} data-autofocus>
          {EMAIL_ME}
        </a>
        <a href={linkedinHref} target="_blank" rel="noopener noreferrer">
          {LINKEDIN}
        </a>
        <a href={resumePdfHref} download={resumePdfName}>
          {DOWNLOAD_PDF}
        </a>
      </nav>
    </PanelShell>
  );
}
