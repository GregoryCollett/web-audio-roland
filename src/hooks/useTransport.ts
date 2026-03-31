import { useSyncExternalStore } from 'react';
import { TransportManager } from '../engine/TransportManager';
import type { TransportSnapshot, MasterParams } from '../engine/TransportManager';
import { MixerEngine } from '../engine/MixerEngine';
import type { MixerSnapshot } from '../engine/MixerEngine';

export const transport = new TransportManager();
export const mixer = new MixerEngine(transport);

export function useTransportSnapshot(): TransportSnapshot {
  return useSyncExternalStore(transport.subscribe, transport.getSnapshot);
}

export function useMaster(): MasterParams {
  return useSyncExternalStore(
    transport.subscribe,
    () => transport.getSnapshot().master,
  );
}

export function useMixer(): MixerSnapshot {
  return useSyncExternalStore(mixer.subscribe, mixer.getSnapshot);
}
