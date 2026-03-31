import { useSyncExternalStore, useRef } from 'react';
import { AudioEngine } from '../engine/AudioEngine';
import type { InstrumentId, InstrumentParams, EngineSnapshot } from '../engine/types';

export const engine = new AudioEngine();

export function useEngine(): EngineSnapshot {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}

export function useTransport(): EngineSnapshot['transport'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().transport,
  );
}

export function usePattern(): EngineSnapshot['pattern'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().pattern,
  );
}

export function useInstrumentParams(id: InstrumentId): InstrumentParams {
  const prevRef = useRef<InstrumentParams>(engine.getSnapshot().instruments[id]);

  return useSyncExternalStore(engine.subscribe, () => {
    const next = engine.getSnapshot().instruments[id];
    if (
      prevRef.current.level === next.level &&
      prevRef.current.decay === next.decay &&
      prevRef.current.tune === next.tune
    ) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  });
}

export function useMaster(): EngineSnapshot['master'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().master,
  );
}

export function usePresets(): EngineSnapshot['presets'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().presets,
  );
}
