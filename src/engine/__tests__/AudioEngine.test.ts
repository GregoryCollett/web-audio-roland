import { describe, it, expect, vi } from 'vitest';
import { AudioEngine } from '../AudioEngine';

describe('AudioEngine', () => {
  it('returns a default snapshot before init', () => {
    const engine = new AudioEngine();
    const snap = engine.getSnapshot();

    expect(snap.transport.playing).toBe(false);
    expect(snap.transport.bpm).toBe(120);
    expect(snap.transport.currentStep).toBe(0);
    expect(snap.pattern.steps.kick.length).toBe(16);
    expect(snap.pattern.steps.kick.every((s) => s === false)).toBe(true);
    expect(snap.pattern.accents.length).toBe(16);
    expect(snap.instruments.kick.level).toBe(0.8);
    expect(snap.instruments.kick.tune).toBe(0.5);
    expect(snap.instruments.clap.tune).toBeUndefined();
  });

  it('toggleStep flips a step and produces a new snapshot', () => {
    const engine = new AudioEngine();
    const snap1 = engine.getSnapshot();

    engine.toggleStep('kick', 0);
    const snap2 = engine.getSnapshot();

    expect(snap2).not.toBe(snap1);
    expect(snap2.pattern.steps.kick[0]).toBe(true);
    expect(snap1.pattern.steps.kick[0]).toBe(false);
  });

  it('toggleAccent flips an accent', () => {
    const engine = new AudioEngine();

    engine.toggleAccent(3);
    expect(engine.getSnapshot().pattern.accents[3]).toBe(true);

    engine.toggleAccent(3);
    expect(engine.getSnapshot().pattern.accents[3]).toBe(false);
  });

  it('setBpm updates bpm', () => {
    const engine = new AudioEngine();
    engine.setBpm(140);
    expect(engine.getSnapshot().transport.bpm).toBe(140);
  });

  it('setBpm clamps to 40-300', () => {
    const engine = new AudioEngine();
    engine.setBpm(10);
    expect(engine.getSnapshot().transport.bpm).toBe(40);

    engine.setBpm(500);
    expect(engine.getSnapshot().transport.bpm).toBe(300);
  });

  it('setParam updates instrument params', () => {
    const engine = new AudioEngine();
    engine.setParam('kick', 'level', 0.3);
    expect(engine.getSnapshot().instruments.kick.level).toBe(0.3);
  });

  it('subscribe notifies on state change', () => {
    const engine = new AudioEngine();
    const callback = vi.fn();

    const unsub = engine.subscribe(callback);
    engine.toggleStep('snare', 5);

    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    engine.toggleStep('snare', 6);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('getSnapshot returns same reference when no change', () => {
    const engine = new AudioEngine();
    const snap1 = engine.getSnapshot();
    const snap2 = engine.getSnapshot();
    expect(snap1).toBe(snap2);
  });
});
