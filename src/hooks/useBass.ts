import { useSyncExternalStore } from 'react';
import { BassEngine } from '../engine/bass/BassEngine';
import type { BassSnapshot, SynthParams, BassPattern } from '../engine/bass/bassTypes';
import { transport } from './useTransport';

export const bassEngine = new BassEngine(transport);

export function useBassPattern(): BassPattern {
  return useSyncExternalStore(bassEngine.subscribe, () => bassEngine.getSnapshot().pattern);
}

export function useBassSynth(): SynthParams {
  return useSyncExternalStore(bassEngine.subscribe, () => bassEngine.getSnapshot().synth);
}

export function useBassPresets(): BassSnapshot['presets'] {
  return useSyncExternalStore(bassEngine.subscribe, () => bassEngine.getSnapshot().presets);
}
