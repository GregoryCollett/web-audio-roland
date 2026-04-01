import { useSyncExternalStore } from 'react';
import { SubtractorEngine } from '../engine/subtractor/SubtractorEngine';
import type { SubtractorSnapshot, SubtractorParams, SubtractorPattern } from '../engine/subtractor/subtractorTypes';
import { transport, mixer } from './useTransport';

export const subtractorEngine = new SubtractorEngine(transport, mixer);

export function useSubtractorPattern(): SubtractorPattern {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().pattern);
}

export function useSubtractorParams(): SubtractorParams {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().params);
}

export function useSubtractorPresets(): SubtractorSnapshot['presets'] {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().presets);
}
