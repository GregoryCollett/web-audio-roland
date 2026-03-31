import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrumPattern, useInstrumentParams } from '../useDrum';
import { useTransportSnapshot, transport } from '../useTransport';

describe('useDrum hooks', () => {
  it('useTransportSnapshot returns transport state', () => {
    const { result } = renderHook(() => useTransportSnapshot());
    expect(result.current.playing).toBe(false);
    expect(result.current.bpm).toBeDefined();
    expect(result.current.currentStep).toBe(0);
  });

  it('useDrumPattern returns pattern state', () => {
    const { result } = renderHook(() => useDrumPattern());
    expect(result.current.steps.kick.length).toBe(16);
    expect(result.current.accents.length).toBe(16);
  });

  it('useInstrumentParams returns params for given instrument', () => {
    const { result } = renderHook(() => useInstrumentParams('kick'));
    expect(result.current.level).toBeDefined();
    expect(result.current.tune).toBeDefined();
  });

  it('useTransportSnapshot updates when transport changes', () => {
    const { result } = renderHook(() => useTransportSnapshot());
    const initialBpm = result.current.bpm;

    act(() => {
      transport.setBpm(initialBpm === 140 ? 150 : 140);
    });

    expect(result.current.bpm).not.toBe(initialBpm);
  });
});
