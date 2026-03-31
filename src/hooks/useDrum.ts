import { useSyncExternalStore, useRef } from 'react';
import { DrumEngine } from '../engine/DrumEngine';
import type { InstrumentId, InstrumentParams, DrumSnapshot } from '../engine/types';
import { transport } from './useTransport';

export const drumEngine = new DrumEngine(transport);

export function useDrumPattern(): DrumSnapshot['pattern'] {
  return useSyncExternalStore(drumEngine.subscribe, () => drumEngine.getSnapshot().pattern);
}

export function useInstrumentParams(id: InstrumentId): InstrumentParams {
  const prevRef = useRef<InstrumentParams>(drumEngine.getSnapshot().instruments[id]);
  return useSyncExternalStore(drumEngine.subscribe, () => {
    const next = drumEngine.getSnapshot().instruments[id];
    if (prevRef.current.level === next.level && prevRef.current.decay === next.decay && prevRef.current.tune === next.tune) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  });
}

export function useDrumPresets(): DrumSnapshot['presets'] {
  return useSyncExternalStore(drumEngine.subscribe, () => drumEngine.getSnapshot().presets);
}
