import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtractorEngine } from '../SubtractorEngine';
import { TransportManager } from '../../TransportManager';
import { MixerEngine } from '../../MixerEngine';

describe('SubtractorEngine', () => {
  let transport: TransportManager;
  let mixer: MixerEngine;

  beforeEach(() => {
    localStorage.clear();
    transport = new TransportManager();
    mixer = new MixerEngine(transport);
  });

  // -------------------------------------------------------------------------
  // Snapshot
  // -------------------------------------------------------------------------

  it('returns default snapshot', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const snap = engine.getSnapshot();

    expect(snap.pattern.steps.length).toBe(16);
    expect(snap.pattern.steps.every((s) => s.gate === 'rest')).toBe(true);
    expect(snap.pattern.steps.every((s) => s.note === 48)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.velocity === 100)).toBe(true);
    expect(snap.pattern.steps.every((s) => s.slide === false)).toBe(true);

    expect(snap.params.volume).toBe(0.8);
    expect(snap.params.osc1.waveform).toBe(2);
    expect(snap.params.filter1Mode).toBe('lp24');
    expect(snap.params.portamentoMode).toBe('off');
    expect(snap.params.modMatrix).toHaveLength(8);

    expect(snap.presets.activePatternId).toBeNull();
    expect(snap.presets.activeSoundId).toBeNull();
    expect(snap.presets.patterns.length).toBeGreaterThan(0);
    expect(snap.presets.sounds.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Pattern editing
  // -------------------------------------------------------------------------

  it('setNote updates step note', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setNote(3, 60);
    expect(engine.getSnapshot().pattern.steps[3].note).toBe(60);
  });

  it('setNote clamps to 0-127', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setNote(0, -5);
    expect(engine.getSnapshot().pattern.steps[0].note).toBe(0);
    engine.setNote(1, 200);
    expect(engine.getSnapshot().pattern.steps[1].note).toBe(127);
  });

  it('setVelocity updates step velocity', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setVelocity(5, 80);
    expect(engine.getSnapshot().pattern.steps[5].velocity).toBe(80);
  });

  it('setVelocity clamps to 0-127', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setVelocity(0, -10);
    expect(engine.getSnapshot().pattern.steps[0].velocity).toBe(0);
    engine.setVelocity(1, 300);
    expect(engine.getSnapshot().pattern.steps[1].velocity).toBe(127);
  });

  it('toggleSlide flips slide', () => {
    const engine = new SubtractorEngine(transport, mixer);
    expect(engine.getSnapshot().pattern.steps[2].slide).toBe(false);
    engine.toggleSlide(2);
    expect(engine.getSnapshot().pattern.steps[2].slide).toBe(true);
    engine.toggleSlide(2);
    expect(engine.getSnapshot().pattern.steps[2].slide).toBe(false);
  });

  it('setGate updates gate', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setGate(0, 'note');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('note');
    engine.setGate(0, 'tie');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('tie');
    engine.setGate(0, 'rest');
    expect(engine.getSnapshot().pattern.steps[0].gate).toBe('rest');
  });

  // -------------------------------------------------------------------------
  // Param editing
  // -------------------------------------------------------------------------

  it('setOscParam(1) updates osc1', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setOscParam(1, 'level', 0.5);
    expect(engine.getSnapshot().params.osc1.level).toBe(0.5);
  });

  it('setOscParam(2) updates osc2', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setOscParam(2, 'octave', 1);
    expect(engine.getSnapshot().params.osc2.octave).toBe(1);
  });

  it('setOscParam(1) updates waveform', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setOscParam(1, 'waveform', 8);
    expect(engine.getSnapshot().params.osc1.waveform).toBe(8);
  });

  it('setOscParam(2) updates semitone', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setOscParam(2, 'semitone', 7);
    expect(engine.getSnapshot().params.osc2.semitone).toBe(7);
  });

  it('setFilterParam(1) updates filter1', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilterParam(1, 'cutoff', 0.8);
    expect(engine.getSnapshot().params.filter1.cutoff).toBe(0.8);
  });

  it('setFilterParam(2) updates filter2', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilterParam(2, 'resonance', 0.6);
    expect(engine.getSnapshot().params.filter2.resonance).toBe(0.6);
  });

  it('setFilter1Mode updates filter1Mode', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilter1Mode('hp12');
    expect(engine.getSnapshot().params.filter1Mode).toBe('hp12');
    engine.setFilter1Mode('notch');
    expect(engine.getSnapshot().params.filter1Mode).toBe('notch');
    engine.setFilter1Mode('bp12');
    expect(engine.getSnapshot().params.filter1Mode).toBe('bp12');
  });

  it('setAmpEnv updates attack', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setAmpEnv('attack', 0.7);
    expect(engine.getSnapshot().params.ampEnv.attack).toBe(0.7);
  });

  it('setAmpEnv updates release', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setAmpEnv('release', 0.9);
    expect(engine.getSnapshot().params.ampEnv.release).toBe(0.9);
  });

  it('setFilterEnv updates decay', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilterEnv('decay', 0.5);
    expect(engine.getSnapshot().params.filterEnv.decay).toBe(0.5);
  });

  it('setFilterEnvDepth updates', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilterEnvDepth(0.75);
    expect(engine.getSnapshot().params.filterEnvDepth).toBe(0.75);
  });

  it('setModEnv updates sustain', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setModEnv('sustain', 0.4);
    expect(engine.getSnapshot().params.modEnv.sustain).toBe(0.4);
  });

  it('setLFOParam(1) updates lfo1 rate', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setLFOParam(1, 'rate', 0.8);
    expect(engine.getSnapshot().params.lfo1.rate).toBe(0.8);
  });

  it('setLFOParam(2) updates lfo2 waveform', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setLFOParam(2, 'waveform', 'sawtooth');
    expect(engine.getSnapshot().params.lfo2.waveform).toBe('sawtooth');
  });

  it('setLFOParam(1) updates lfo1 keySync', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setLFOParam(1, 'keySync', true);
    expect(engine.getSnapshot().params.lfo1.keySync).toBe(true);
  });

  it('setModSlot updates mod matrix slot', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setModSlot(0, { source: 'lfo1', destination: 'filterCutoff', amount: 0.5 });
    const slot = engine.getSnapshot().params.modMatrix[0];
    expect(slot.source).toBe('lfo1');
    expect(slot.destination).toBe('filterCutoff');
    expect(slot.amount).toBe(0.5);
  });

  it('setModSlot updates specific slot without affecting others', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setModSlot(3, { source: 'velocity', destination: 'ampLevel', amount: 0.8 });
    const snap = engine.getSnapshot();
    expect(snap.params.modMatrix[3].source).toBe('velocity');
    expect(snap.params.modMatrix[0].source).toBe('none'); // unchanged
  });

  it('setPortamento updates mode', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setPortamento('on');
    expect(engine.getSnapshot().params.portamentoMode).toBe('on');
    engine.setPortamento('auto');
    expect(engine.getSnapshot().params.portamentoMode).toBe('auto');
    engine.setPortamento('off');
    expect(engine.getSnapshot().params.portamentoMode).toBe('off');
  });

  it('setPortamento with rate updates both mode and rate', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setPortamento('on', 0.3);
    const snap = engine.getSnapshot();
    expect(snap.params.portamentoMode).toBe('on');
    expect(snap.params.portamentoRate).toBe(0.3);
  });

  it('setFmAmount updates fmAmount', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFmAmount(0.6);
    expect(engine.getSnapshot().params.fmAmount).toBe(0.6);
  });

  it('setRingModLevel updates ringModLevel', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setRingModLevel(0.75);
    expect(engine.getSnapshot().params.ringModLevel).toBe(0.75);
  });

  it('setNoiseLevel updates noiseLevel', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setNoiseLevel(0.3);
    expect(engine.getSnapshot().params.noiseLevel).toBe(0.3);
  });

  it('setOscMix updates oscMix', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setOscMix(0.8);
    expect(engine.getSnapshot().params.oscMix).toBe(0.8);
  });

  it('setVolume updates volume', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setVolume(0.5);
    expect(engine.getSnapshot().params.volume).toBe(0.5);
  });

  // -------------------------------------------------------------------------
  // Subscribe / notify
  // -------------------------------------------------------------------------

  it('subscribe notifies on changes', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const callback = vi.fn();

    const unsub = engine.subscribe(callback);
    engine.setNote(0, 48);
    expect(callback).toHaveBeenCalledTimes(1);

    engine.toggleSlide(1);
    expect(callback).toHaveBeenCalledTimes(2);

    unsub();
    engine.setVelocity(2, 80);
    expect(callback).toHaveBeenCalledTimes(2); // no more calls after unsubscribe
  });

  it('subscribe notifies on param changes', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const callback = vi.fn();
    engine.subscribe(callback);

    engine.setFmAmount(0.5);
    engine.setRingModLevel(0.3);
    engine.setOscMix(0.6);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  // -------------------------------------------------------------------------
  // Dirty tracking
  // -------------------------------------------------------------------------

  it('dirty tracking: pattern edit nullifies activePatternId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.patterns[0].id;
    engine.loadPatternPreset(presetId);
    expect(engine.getSnapshot().presets.activePatternId).toBe(presetId);

    engine.setNote(0, 55);
    expect(engine.getSnapshot().presets.activePatternId).toBeNull();
  });

  it('dirty tracking: setVelocity nullifies activePatternId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.patterns[0].id;
    engine.loadPatternPreset(presetId);
    engine.setVelocity(0, 80);
    expect(engine.getSnapshot().presets.activePatternId).toBeNull();
  });

  it('dirty tracking: param edit nullifies activeSoundId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.sounds[0].id;
    engine.loadSoundPreset(presetId);
    expect(engine.getSnapshot().presets.activeSoundId).toBe(presetId);

    engine.setFilterParam(1, 'cutoff', 0.1);
    expect(engine.getSnapshot().presets.activeSoundId).toBeNull();
  });

  it('dirty tracking: setFmAmount nullifies activeSoundId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const presetId = engine.getSnapshot().presets.sounds[0].id;
    engine.loadSoundPreset(presetId);
    engine.setFmAmount(0.9);
    expect(engine.getSnapshot().presets.activeSoundId).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Preset CRUD
  // -------------------------------------------------------------------------

  it('savePatternPreset creates and sets active', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setGate(0, 'note');
    engine.setNote(0, 60);
    const beforeCount = engine.getSnapshot().presets.patterns.length;

    engine.savePatternPreset('My Sub Pattern');
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.length).toBe(beforeCount + 1);
    const saved = snap.presets.patterns.find((p) => p.name === 'My Sub Pattern');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activePatternId).toBe(saved!.id);
  });

  it('saveSoundPreset creates and sets active', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.setFilterParam(1, 'cutoff', 0.9);
    const beforeCount = engine.getSnapshot().presets.sounds.length;

    engine.saveSoundPreset('My Sub Sound');
    const snap = engine.getSnapshot();

    expect(snap.presets.sounds.length).toBe(beforeCount + 1);
    const saved = snap.presets.sounds.find((p) => p.name === 'My Sub Sound');
    expect(saved).toBeDefined();
    expect(saved!.builtIn).toBe(false);
    expect(snap.presets.activeSoundId).toBe(saved!.id);
  });

  it('loadPatternPreset applies steps and sets activePatternId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const preset = engine.getSnapshot().presets.patterns[0];
    engine.loadPatternPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.pattern.steps).toEqual(preset.steps);
    expect(snap.presets.activePatternId).toBe(preset.id);
  });

  it('loadSoundPreset applies params and sets activeSoundId', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const preset = engine.getSnapshot().presets.sounds[0];
    engine.loadSoundPreset(preset.id);
    const snap = engine.getSnapshot();
    expect(snap.params).toEqual(preset.params);
    expect(snap.presets.activeSoundId).toBe(preset.id);
  });

  it('loadPatternPreset ignores unknown id', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const before = engine.getSnapshot().pattern;
    engine.loadPatternPreset('nonexistent-id');
    expect(engine.getSnapshot().pattern).toEqual(before);
  });

  it('loadSoundPreset ignores unknown id', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const before = engine.getSnapshot().params;
    engine.loadSoundPreset('nonexistent-id');
    expect(engine.getSnapshot().params).toEqual(before);
  });

  it('deletePatternPreset removes and clears if active', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.savePatternPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activePatternId!;

    engine.deletePatternPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.patterns.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activePatternId).toBeNull();
  });

  it('deletePatternPreset does not clear activePatternId if different', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.savePatternPreset('Keep');
    const keepId = engine.getSnapshot().presets.activePatternId!;

    engine.savePatternPreset('To Delete');
    const deleteId = engine.getSnapshot().presets.activePatternId!;

    // Load 'Keep' as active, then delete 'To Delete'
    engine.loadPatternPreset(keepId);
    engine.deletePatternPreset(deleteId);

    expect(engine.getSnapshot().presets.activePatternId).toBe(keepId);
  });

  it('deleteSoundPreset removes and clears if active', () => {
    const engine = new SubtractorEngine(transport, mixer);
    engine.saveSoundPreset('To Delete');
    const savedId = engine.getSnapshot().presets.activeSoundId!;

    engine.deleteSoundPreset(savedId);
    const snap = engine.getSnapshot();

    expect(snap.presets.sounds.find((p) => p.id === savedId)).toBeUndefined();
    expect(snap.presets.activeSoundId).toBeNull();
  });

  it('deletePatternPreset refuses to delete built-in preset', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const builtInId = engine.getSnapshot().presets.patterns[0].id;
    const beforeCount = engine.getSnapshot().presets.patterns.length;

    engine.deletePatternPreset(builtInId);

    expect(engine.getSnapshot().presets.patterns.length).toBe(beforeCount);
    expect(engine.getSnapshot().presets.patterns.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('deleteSoundPreset refuses to delete built-in preset', () => {
    const engine = new SubtractorEngine(transport, mixer);
    const builtInId = engine.getSnapshot().presets.sounds[0].id;
    const beforeCount = engine.getSnapshot().presets.sounds.length;

    engine.deleteSoundPreset(builtInId);

    expect(engine.getSnapshot().presets.sounds.length).toBe(beforeCount);
    expect(engine.getSnapshot().presets.sounds.find((p) => p.id === builtInId)).toBeDefined();
  });
});
