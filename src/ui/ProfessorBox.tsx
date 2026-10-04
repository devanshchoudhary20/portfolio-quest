import { Typed } from './Dialog';
import { PORTRAIT_SRC } from './portraits';

const SPEAKER = 'Professor Stack';

interface Props {
  line: string;
  // set when the line ends with a Next arrow
  onNext?: () => void;
  portrait?: boolean;
}

// the Professor's dialog box on the intro screens; menus sit beside it
export function ProfessorBox({ line, onNext, portrait = true }: Props) {
  return (
    <div className="pq-dialog" role="dialog" aria-label={SPEAKER}>
      <div className="pq-tab">{SPEAKER}</div>
      <div className="pq-box">
        {portrait ? <img className="pq-portrait" src={PORTRAIT_SRC.professor} alt="" /> : null}
        <Typed line={line} count={line.length} />
        {onNext ? (
          <button type="button" className="pq-next" aria-label="Next" onClick={onNext} autoFocus>
            <span className="pq-arrow" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
