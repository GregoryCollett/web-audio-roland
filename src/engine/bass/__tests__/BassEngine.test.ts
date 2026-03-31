import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BassEngine } from '../BassEngine';
import { TransportManager } from '../../TransportManager';

describe('BassEngine', () => {
  let transport: TransportManager;

  beforeEach(() => {
    localStorage.clear();
    transport = new TransportManager();
  });

  // --- State tests ---

  it('returns default snapshot', () => {
    const engine = new BassEngine(transport);
    const snap = engine.getSnapshot();

    expect(snap.pattern.steps.length).toBe(16);
    expect(snap.pattern.steps.every((s) => s.gate === 'rest')).toBe(true);
    expect(snap.pattern.steps.every((s) => s.note === 36)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.accent === false)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.slide === false)).toBe(true);

    expect(snap.synth.waveform).toBe('sawtooth');
    expect(snap.synth.cutoff).toBe(0.5);
    expect(snap.synth.volume).toBe(0.8);

    expect(snap.presets.activePatternId).toBeNull();
    expect(snap.presets.activeSynthId).toBeNull();
    expect(snap.presets.patterns.length).toBeGreaterThan(0);
    expect(snap.presets.synths.length).toBeGreaterThan(0);
  });

  it('setNote updates step note', () => {
    const engine = new BassEngine(transport);
    engine.setNote(3, 60);
    expect(engine.getSnapshot().pattern.steps[3].note).toBe(60);
  });

  it('setNote clamps note to 0-127', () => {
    const engine = new BassEngine(transport);
    engine.setNote(0, -5);
    expect(engine.getSnapshot().pattern.steps[0].note).toBe(0);
    engine.setNote(1, 200);
    expect(engine.getSnapshot().pattern.steps[1].note).toBe(127);
  });

  it('toggleAccent flips accent', () => {
    const engine = new BassEngine(transport);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(false);
    engine.toggleAccent(2);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(true);
    engine.toggleAccent(2);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(false);
  });

  it('toggleSlide flips slide', () => {
    const engine = new BassEngine(transport);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(false);
    engine.toggleSlide(5);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(true);
    engine.toggleSlide(5);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(false);
  });

  it('setGate updates gate type', () => {
    const engine = new BassEngine(transport);
    engine.setGate(0, 'note');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('note');
    engine.setGate(0, 'tie');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('tie');
    engine.setGate(0, 'rest');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('rest');
  });

  it('setSynthParam updates synth params', () => {
    const engine = new BassEngine(transport);
    engine.setSynthParam('cutoff', 0.9);
    expect(engine.getSnapshot().synth.cutoff).toBe(0.9);
    engine.setSynthParam('resonance', 0.3);
    expect(engine.getSnapshot().synth.resonance).toBe(0.3);
    engine.setSynthParam('decay', 0.7);
    expect(engine.getSnapshot().synth.decay).toBe(0.7);
  });

  it('setWaveform updates waveform', () => {
    const engine = new BassEngine(transport);
    expect(engine.getSnapshot().synth.waveform).toBe('sawtooth');
    engine.setWaveform('square');
    expect(engine.getSnapshot().synth.waveform).toBe('square');
    engine.setWaveform('sawtooth');
    expect(engine.getSnapshot().synth.waveform).toBe('sawtooth');
  });

  it('subscribe notifies on change', () => {
    const engine = new BassEngine(transport);
    const callback = vi.fn();

    const unsub = engine.subscribe(callback);
    engine.setNote(0, 48);
    expect(callback).toHaveBeenCalledTimes(1);

    engine.toggleAccent(1);
    expect(callback).toHaveBeenCalledTimes(2);

    unsub();
    engine.toggleSlide(2);
    expect(callback).toHaveBeenCalledTimes(2); // no more calls after unsubscribe
  });

  // --- Dirty tracking ---

  it('pattern edit nullifies activePatternId', () => {
    const engine = new BassEngine(transport);
    const presetId = engine.getSnapshot().presets.patterns[0].id;
    engine.loadPatternPreset(presetId);
    expect(engine.getSnapshot().presets.activePatternId).toBe(presetId);

    engine.setNote(0, 48);
    expect(engine.getSnapshot().presets.activePatternId).toBeNull();
  });

  it('synth edit nullifies activeSynthId', () => {
    const engine = new BassEngine(transport);
    const presetId = engine.getSnapshot().presets.synths[0].id;
    engine.loadSynthPreset(presetId);
    expect(engine.getSnapshot().presets.activeSynthId).toBe(presetId);

    engine.setSynthParam('cutoff', 0.1);
    expect(engine.getSnapshot().presets.activeSynthId).toBeNull();
  });

  // --- Presets ---

  it('savePatternPreset creates preset and sets activePatternId', () => {
    const engine = new BassEngine(transport);
    engine.setGate(0, 'note');
    engine.setNote(0, 48);
    const beforeCount = engine.getSnapshot().presets.patterns.length;

    engine.savePatternPreset('My Bass Pattern');
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.length).toBe(beforeCount + 1);
    const saved = snap.presets.patterns.find((p) => p.name === 'My Bass Pattern');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activePatternId).toBe(saved!.id);
  });

  it('saveSynthPreset creates preset and sets activeSynthId', () => {
    const engine = new BassEngine(transport);
    engine.setSynthParam('cutoff', 0.9);
    const beforeCount = engine.getSnapshot().presets.synths.length;

    engine.saveSynthPreset('My Synth');
    const snap = engine.getSnapshot();

    expect(snap.presets.synths.length).toBe(beforeCount + 1);
    const saved = snap.presets.synths.find((p) => p.name === 'My Synth');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activeSynthId).toBe(saved!.id);
  });

  it('loadPatternPreset applies pattern', () => {
    const engine = new BassEngine(transport);
    const preset = engine.getSnapshot().presets.patterns[0];
    engine.loadPatternPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.pattern.steps).toEqual(preset.steps);
    expect(snap.presets.activePatternId).toBe(preset.id);
  });

  it('loadSynthPreset applies synth params', () => {
    const engine = new BassEngine(transport);
    const preset = engine.getSnapshot().presets.synths[0];
    engine.loadSynthPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.synth).toEqual(preset.synth);
    expect(snap.presets.activeSynthId).toBe(preset.id);
  });

  it('deletePatternPreset removes and clears if active', () => {
    const engine = new BassEngine(transport);
    engine.savePatternPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activePatternId!;

    engine.deletePatternPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activePatternId).toBeNull();
  });

  it('deleteSynthPreset removes and clears if active', () => {
    const engine = new BassEngine(transport);
    engine.saveSynthPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activeSynthId!;

    engine.deleteSynthPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.synths.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activeSynthId).toBeNull();
  });
});
