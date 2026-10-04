import { useEffect, useRef } from 'react';
import { resumePdfHref, resumePdfName } from '../resume/view';
import { useGame } from './useGame';

// Phaser only bumps downloadTick; the click on a real anchor happens here
export function useDownload() {
  const tick = useGame((s) => s.downloadTick);
  const last = useRef(tick);
  useEffect(() => {
    if (tick === last.current) return;
    last.current = tick;
    const link = document.createElement('a');
    link.href = resumePdfHref;
    link.download = resumePdfName;
    document.body.append(link);
    link.click();
    link.remove();
  }, [tick]);
}
