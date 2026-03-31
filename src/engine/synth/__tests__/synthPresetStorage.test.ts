import { describe, it, expect, beforeEach } from 'vitest';
import { SynthPresetStorage } from '../synthPresetStorage';
import { DEFAULT_SYNTH_PATTERN_PRESETS, DEFAULT_SYNTH_SOUND_PRESETS } from '../defaultSynthPresets';
import type { SynthPatternPreset, SynthSoundPreset, SynthStep } from '../synthTypes';

const PATTERN_KEY = 'tr909-synth-pattern-presets';
const SOUND_KEY   = 'tr909-synth-sound-presets';

function makeStep(): SynthStep {
  return { note: 48, accent: false, slide: false, gate: 'rest' };
}

function makePatternPreset(id: string, name: string): SynthPatternPreset {
  return {
    id,
    name,
    builtIn: false,
    steps: Array.from({ length: 16 }, makeStep),
  };
}

function makeSoundPreset(id: string, name: string): SynthSoundPreset {
  return {
    id,
    name,
    builtIn: false,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0, tune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 'sawtooth', octave: -1, tune: 0, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      cutoff: 0.5, resonance: 0.3, filterEnvDepth: 0.5,
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      ampEnv:    { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
      volume: 0.8, accent: 0.5,
    },
  };
}

describe('SynthPresetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPatternPresets returns built-in presets when localStorage is empty', () => {
    const presets = SynthPresetStorage.getPatternPresets();
    expect(presets).toEqual(DEFAULT_SYNTH_PATTERN_PRESETS);
  });

  it('getSoundPresets returns built-in presets when localStorage is empty', () => {
    const presets = SynthPresetStorage.getSoundPresets();
    expect(presets).toEqual(DEFAULT_SYNTH_SOUND_PRESETS);
  });

  it('getPatternPresets merges user presets with built-in presets', () => {
    const userPreset = makePatternPreset('user-synth-pattern-1', 'My Synth Pattern');
    localStorage.setItem(PATTERN_KEY, JSON.stringify([userPreset]));

    const presets = SynthPresetStorage.getPatternPresets();
    expect(presets).toHaveLength(DEFAULT_SYNTH_PATTERN_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_SYNTH_PATTERN_PRESETS.length)).toEqual(DEFAULT_SYNTH_PATTERN_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('getSoundPresets merges user presets with built-in presets', () => {
    const userPreset = makeSoundPreset('user-synth-sound-1', 'My Sound');
    localStorage.setItem(SOUND_KEY, JSON.stringify([userPreset]));

    const presets = SynthPresetStorage.getSoundPresets();
    expect(presets).toHaveLength(DEFAULT_SYNTH_SOUND_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_SYNTH_SOUND_PRESETS.length)).toEqual(DEFAULT_SYNTH_SOUND_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('savePatternPreset saves and retrieves user preset', () => {
    const preset = makePatternPreset('user-synth-pattern-2', 'Saved Synth Pattern');
    SynthPresetStorage.savePatternPreset(preset);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = SynthPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('saveSoundPreset saves and retrieves user preset', () => {
    const preset = makeSoundPreset('user-synth-sound-2', 'Saved Sound');
    SynthPresetStorage.saveSoundPreset(preset);

    const stored = JSON.parse(localStorage.getItem(SOUND_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = SynthPresetStorage.getSoundPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('savePatternPreset replaces existing preset with same id', () => {
    const original = makePatternPreset('user-synth-pattern-3', 'Original');
    SynthPresetStorage.savePatternPreset(original);

    const updated = { ...original, name: 'Updated' };
    SynthPresetStorage.savePatternPreset(updated);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Updated');
  });

  it('deletePatternPreset removes user preset', () => {
    const preset = makePatternPreset('user-synth-pattern-del', 'To Delete');
    SynthPresetStorage.savePatternPreset(preset);

    SynthPresetStorage.deletePatternPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored.find((p: SynthPatternPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deletePatternPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_SYNTH_PATTERN_PRESETS[0].id;
    SynthPresetStorage.deletePatternPreset(builtInId);

    const all = SynthPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('deleteSoundPreset removes user preset', () => {
    const preset = makeSoundPreset('user-synth-sound-del', 'To Delete Sound');
    SynthPresetStorage.saveSoundPreset(preset);

    SynthPresetStorage.deleteSoundPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(SOUND_KEY)!);
    expect(stored.find((p: SynthSoundPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deleteSoundPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_SYNTH_SOUND_PRESETS[0].id;
    SynthPresetStorage.deleteSoundPreset(builtInId);

    const all = SynthPresetStorage.getSoundPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });
});
