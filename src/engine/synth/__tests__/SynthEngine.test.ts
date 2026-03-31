import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SynthEngine } from '../SynthEngine';
import { TransportManager } from '../../TransportManager';
import { MixerEngine } from '../../MixerEngine';

describe('SynthEngine', () => {
  let transport: TransportManager;
  let mixer: MixerEngine;

  beforeEach(() => {
    localStorage.clear();
    transport = new TransportManager();
    mixer = new MixerEngine(transport);
  });

  it('returns default snapshot', () => {
    const engine = new SynthEngine(transport, mixer);
    const snap = engine.getSnapshot();

    expect(snap.pattern.steps.length).toBe(16);
    expect(snap.pattern.steps.every((s) => s.gate === 'rest')).toBe(true);
    expect(snap.pattern.steps.every((s) => s.note === 48)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.accent === false)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.slide === false)).toBe(true);

    expect(snap.params.cutoff).toBe(0.5);
    expect(snap.params.volume).toBe(0.8);
    expect(snap.params.osc1.waveform).toBe('sawtooth');

    expect(snap.presets.activePatternId).toBeNull();
    expect(snap.presets.activeSoundId).toBeNull();
    expect(snap.presets.patterns.length).toBeGreaterThan(0);
    expect(snap.presets.sounds.length).toBeGreaterThan(0);
  });

  it('setNote updates step note', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setNote(3, 60);
    expect(engine.getSnapshot().pattern.steps[3].note).toBe(60);
  });

  it('toggleAccent flips', () => {
    const engine = new SynthEngine(transport, mixer);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(false);
    engine.toggleAccent(2);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(true);
    engine.toggleAccent(2);
    expect(engine.getSnapshot().pattern.steps[2].accent).toBe(false);
  });

  it('toggleSlide flips', () => {
    const engine = new SynthEngine(transport, mixer);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(false);
    engine.toggleSlide(5);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(true);
    engine.toggleSlide(5);
    expect(engine.getSnapshot().pattern.steps[5].slide).toBe(false);
  });

  it('setGate updates', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setGate(0, 'note');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('note');
    engine.setGate(0, 'tie');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('tie');
    engine.setGate(0, 'rest');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('rest');
  });

  it('setOscParam updates osc1', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setOscParam(1, 'cutoff' as never, 0 as never); // ignored field
    engine.setOscParam(1, 'level', 0.5);
    expect(engine.getSnapshot().params.osc1.level).toBe(0.5);
  });

  it('setOscParam updates osc2', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setOscParam(2, 'octave', 1);
    expect(engine.getSnapshot().params.osc2.octave).toBe(1);
  });

  it('setFilterParam updates cutoff', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setFilterParam('cutoff', 0.8);
    expect(engine.getSnapshot().params.cutoff).toBe(0.8);
  });

  it('setFilterEnv updates attack', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setFilterEnv('attack', 0.7);
    expect(engine.getSnapshot().params.filterEnv.attack).toBe(0.7);
  });

  it('setAmpEnv updates release', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setAmpEnv('release', 0.9);
    expect(engine.getSnapshot().params.ampEnv.release).toBe(0.9);
  });

  it('setLFOParam updates rate', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setLFOParam('lfoRate', 0.8);
    expect(engine.getSnapshot().params.lfoRate).toBe(0.8);
  });

  it('setNoiseLevel updates', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setNoiseLevel(0.3);
    expect(engine.getSnapshot().params.noiseLevel).toBe(0.3);
  });

  it('subscribe notifies', () => {
    const engine = new SynthEngine(transport, mixer);
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

  it('dirty tracking: pattern edit nullifies activePatternId', () => {
    const engine = new SynthEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.patterns[0].id;
    engine.loadPatternPreset(presetId);
    expect(engine.getSnapshot().presets.activePatternId).toBe(presetId);

    engine.setNote(0, 55);
    expect(engine.getSnapshot().presets.activePatternId).toBeNull();
  });

  it('dirty tracking: param edit nullifies activeSoundId', () => {
    const engine = new SynthEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.sounds[0].id;
    engine.loadSoundPreset(presetId);
    expect(engine.getSnapshot().presets.activeSoundId).toBe(presetId);

    engine.setFilterParam('cutoff', 0.1);
    expect(engine.getSnapshot().presets.activeSoundId).toBeNull();
  });

  it('savePatternPreset creates and sets active', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setGate(0, 'note');
    engine.setNote(0, 60);
    const beforeCount = engine.getSnapshot().presets.patterns.length;

    engine.savePatternPreset('My Synth Pattern');
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.length).toBe(beforeCount + 1);
    const saved = snap.presets.patterns.find((p) => p.name === 'My Synth Pattern');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activePatternId).toBe(saved!.id);
  });

  it('saveSoundPreset creates and sets active', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.setFilterParam('cutoff', 0.9);
    const beforeCount = engine.getSnapshot().presets.sounds.length;

    engine.saveSoundPreset('My Sound');
    const snap = engine.getSnapshot();

    expect(snap.presets.sounds.length).toBe(beforeCount + 1);
    const saved = snap.presets.sounds.find((p) => p.name === 'My Sound');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activeSoundId).toBe(saved!.id);
  });

  it('loadPatternPreset applies', () => {
    const engine = new SynthEngine(transport, mixer);
    const preset = engine.getSnapshot().presets.patterns[0];
    engine.loadPatternPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.pattern.steps).toEqual(preset.steps);
    expect(snap.presets.activePatternId).toBe(preset.id);
  });

  it('loadSoundPreset applies', () => {
    const engine = new SynthEngine(transport, mixer);
    const preset = engine.getSnapshot().presets.sounds[0];
    engine.loadSoundPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.params).toEqual(preset.params);
    expect(snap.presets.activeSoundId).toBe(preset.id);
  });

  it('deletePatternPreset removes and clears if active', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.savePatternPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activePatternId!;

    engine.deletePatternPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activePatternId).toBeNull();
  });

  it('deleteSoundPreset removes and clears if active', () => {
    const engine = new SynthEngine(transport, mixer);
    engine.saveSoundPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activeSoundId!;

    engine.deleteSoundPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.sounds.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activeSoundId).toBeNull();
  });
});
