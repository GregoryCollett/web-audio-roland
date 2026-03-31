import { useSyncExternalStore } from 'react';
import { TransportManager } from '../engine/TransportManager';
import type { TransportSnapshot, MasterParams } from '../engine/TransportManager';

export const transport = new TransportManager();

export function useTransportSnapshot(): TransportSnapshot {
  return useSyncExternalStore(transport.subscribe, transport.getSnapshot);
}

export function useMaster(): MasterParams {
  return useSyncExternalStore(
    transport.subscribe,
    () => transport.getSnapshot().master,
  );
}
