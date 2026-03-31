import { useSyncExternalStore } from 'react';
import { SynthEngine } from '../engine/synth/SynthEngine';
import type { SynthSnapshot, SH2Params, SynthPattern } from '../engine/synth/synthTypes';
import { transport, mixer } from './useTransport';

export const synthEngine = new SynthEngine(transport, mixer);

export function useSynthPattern(): SynthPattern {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().pattern);
}

export function useSynthParams(): SH2Params {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().params);
}

export function useSynthPresets(): SynthSnapshot['presets'] {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().presets);
}
