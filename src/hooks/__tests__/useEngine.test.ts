import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransport, usePattern, useInstrumentParams, engine } from '../useEngine';

describe('useEngine hooks', () => {
  it('useTransport returns transport state', () => {
    const { result } = renderHook(() => useTransport());
    expect(result.current.playing).toBe(false);
    expect(result.current.bpm).toBeDefined();
    expect(result.current.currentStep).toBe(0);
  });

  it('usePattern returns pattern state', () => {
    const { result } = renderHook(() => usePattern());
    expect(result.current.steps.kick.length).toBe(16);
    expect(result.current.accents.length).toBe(16);
  });

  it('useInstrumentParams returns params for given instrument', () => {
    const { result } = renderHook(() => useInstrumentParams('kick'));
    expect(result.current.level).toBeDefined();
    expect(result.current.tune).toBeDefined();
  });

  it('useTransport updates when transport changes', () => {
    const { result } = renderHook(() => useTransport());
    const initialBpm = result.current.bpm;

    act(() => {
      engine.setBpm(initialBpm === 140 ? 150 : 140);
    });

    expect(result.current.bpm).not.toBe(initialBpm);
  });
});
