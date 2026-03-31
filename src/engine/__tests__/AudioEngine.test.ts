import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  describe('presets', () => {
    beforeEach(() => { localStorage.clear(); });

    it('initializes with preset lists from storage', () => {
      const engine = new AudioEngine();
      const snap = engine.getSnapshot();
      expect(snap.presets.patterns.length).toBeGreaterThan(0);
      expect(snap.presets.kits.length).toBeGreaterThan(0);
      expect(snap.presets.activePatternId).toBeNull();
      expect(snap.presets.activeKitId).toBeNull();
    });

    it('loadPatternPreset applies steps, accents, and bpm', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      const preset = engine.getSnapshot().presets.patterns[0];
      engine.loadPatternPreset(presetId);
      const snap = engine.getSnapshot();
      expect(snap.pattern.steps).toEqual(preset.steps);
      expect(snap.pattern.accents).toEqual(preset.accents);
      expect(snap.transport.bpm).toBe(preset.bpm);
      expect(snap.presets.activePatternId).toBe(presetId);
    });

    it('loadKitPreset applies instrument params', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.kits[0].id;
      const preset = engine.getSnapshot().presets.kits[0];
      engine.loadKitPreset(presetId);
      const snap = engine.getSnapshot();
      expect(snap.instruments).toEqual(preset.instruments);
      expect(snap.presets.activeKitId).toBe(presetId);
    });

    it('savePatternPreset creates a new preset and sets activePatternId', () => {
      const engine = new AudioEngine();
      engine.toggleStep('kick', 0);
      const beforeCount = engine.getSnapshot().presets.patterns.length;
      engine.savePatternPreset('My Pattern');
      const snap = engine.getSnapshot();
      expect(snap.presets.patterns.length).toBe(beforeCount + 1);
      const saved = snap.presets.patterns.find((p) => p.name === 'My Pattern');
      expect(saved).toBeDefined();
      expect(saved!.builtIn).toBe(false);
      expect(snap.presets.activePatternId).toBe(saved!.id);
    });

    it('saveKitPreset creates a new preset and sets activeKitId', () => {
      const engine = new AudioEngine();
      engine.setParam('kick', 'level', 0.3);
      const beforeCount = engine.getSnapshot().presets.kits.length;
      engine.saveKitPreset('My Kit');
      const snap = engine.getSnapshot();
      expect(snap.presets.kits.length).toBe(beforeCount + 1);
      const saved = snap.presets.kits.find((p) => p.name === 'My Kit');
      expect(saved).toBeDefined();
      expect(saved!.builtIn).toBe(false);
      expect(snap.presets.activeKitId).toBe(saved!.id);
    });

    it('deletePatternPreset removes preset and clears activePatternId if active', () => {
      const engine = new AudioEngine();
      engine.savePatternPreset('To Delete');
      const savedId = engine.getSnapshot().presets.activePatternId!;
      engine.deletePatternPreset(savedId);
      const snap = engine.getSnapshot();
      expect(snap.presets.patterns.find((p) => p.id === savedId)).toBeUndefined();
      expect(snap.presets.activePatternId).toBeNull();
    });

    it('deleteKitPreset removes preset and clears activeKitId if active', () => {
      const engine = new AudioEngine();
      engine.saveKitPreset('To Delete');
      const savedId = engine.getSnapshot().presets.activeKitId!;
      engine.deleteKitPreset(savedId);
      const snap = engine.getSnapshot();
      expect(snap.presets.kits.find((p) => p.id === savedId)).toBeUndefined();
      expect(snap.presets.activeKitId).toBeNull();
    });

    it('dirty tracking: toggleStep nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);
      expect(engine.getSnapshot().presets.activePatternId).toBe(presetId);
      engine.toggleStep('kick', 7);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: toggleAccent nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);
      engine.toggleAccent(0);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: setBpm nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);
      engine.setBpm(200);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: setParam nullifies activeKitId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.kits[0].id;
      engine.loadKitPreset(presetId);
      expect(engine.getSnapshot().presets.activeKitId).toBe(presetId);
      engine.setParam('kick', 'level', 0.1);
      expect(engine.getSnapshot().presets.activeKitId).toBeNull();
    });
  });
});
