import { describe, it, expect, beforeEach } from 'vitest';
import { SubtractorPresetStorage } from '../subtractorPresetStorage';
import {
  DEFAULT_SUBTRACTOR_PATTERN_PRESETS,
  DEFAULT_SUBTRACTOR_SOUND_PRESETS,
} from '../defaultSubtractorPresets';
import type {
  SubtractorPatternPreset,
  SubtractorSoundPreset,
  SubtractorStep,
} from '../subtractorTypes';
import { createEmptyModMatrix } from '../subtractorTypes';

const PATTERN_KEY = 'tr909-subtractor-pattern-presets';
const SOUND_KEY   = 'tr909-subtractor-sound-presets';

function makeStep(): SubtractorStep {
  return { note: 48, velocity: 100, slide: false, gate: 'rest' };
}

function makePatternPreset(id: string, name: string): SubtractorPatternPreset {
  return {
    id,
    name,
    builtIn: false,
    steps: Array.from({ length: 16 }, makeStep),
  };
}

function makeSoundPreset(id: string, name: string): SubtractorSoundPreset {
  return {
    id,
    name,
    builtIn: false,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  };
}

describe('SubtractorPresetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPatternPresets returns built-in presets when localStorage is empty', () => {
    const presets = SubtractorPresetStorage.getPatternPresets();
    expect(presets).toEqual(DEFAULT_SUBTRACTOR_PATTERN_PRESETS);
  });

  it('getSoundPresets returns built-in presets when localStorage is empty', () => {
    const presets = SubtractorPresetStorage.getSoundPresets();
    expect(presets).toEqual(DEFAULT_SUBTRACTOR_SOUND_PRESETS);
  });

  it('returns 12 built-in pattern presets', () => {
    const presets = SubtractorPresetStorage.getPatternPresets();
    const builtIn = presets.filter((p) => p.builtIn);
    expect(builtIn).toHaveLength(12);
  });

  it('returns built-in sound presets', () => {
    const presets = SubtractorPresetStorage.getSoundPresets();
    const builtIn = presets.filter((p) => p.builtIn);
    expect(builtIn.length).toBeGreaterThanOrEqual(16);
  });

  it('getPatternPresets merges user presets with built-in presets', () => {
    const userPreset = makePatternPreset('user-sub-pattern-1', 'My Sub Pattern');
    localStorage.setItem(PATTERN_KEY, JSON.stringify([userPreset]));

    const presets = SubtractorPresetStorage.getPatternPresets();
    expect(presets).toHaveLength(DEFAULT_SUBTRACTOR_PATTERN_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_SUBTRACTOR_PATTERN_PRESETS.length)).toEqual(
      DEFAULT_SUBTRACTOR_PATTERN_PRESETS,
    );
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('getSoundPresets merges user presets with built-in presets', () => {
    const userPreset = makeSoundPreset('user-sub-sound-1', 'My Sound');
    localStorage.setItem(SOUND_KEY, JSON.stringify([userPreset]));

    const presets = SubtractorPresetStorage.getSoundPresets();
    expect(presets).toHaveLength(DEFAULT_SUBTRACTOR_SOUND_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_SUBTRACTOR_SOUND_PRESETS.length)).toEqual(
      DEFAULT_SUBTRACTOR_SOUND_PRESETS,
    );
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('savePatternPreset saves and retrieves user preset', () => {
    const preset = makePatternPreset('user-sub-pattern-2', 'Saved Sub Pattern');
    SubtractorPresetStorage.savePatternPreset(preset);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = SubtractorPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('saveSoundPreset saves and retrieves user preset', () => {
    const preset = makeSoundPreset('user-sub-sound-2', 'Saved Sound');
    SubtractorPresetStorage.saveSoundPreset(preset);

    const stored = JSON.parse(localStorage.getItem(SOUND_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = SubtractorPresetStorage.getSoundPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('savePatternPreset replaces existing preset with same id', () => {
    const original = makePatternPreset('user-sub-pattern-3', 'Original');
    SubtractorPresetStorage.savePatternPreset(original);

    const updated = { ...original, name: 'Updated' };
    SubtractorPresetStorage.savePatternPreset(updated);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Updated');
  });

  it('deletePatternPreset removes user preset', () => {
    const preset = makePatternPreset('user-sub-pattern-del', 'To Delete');
    SubtractorPresetStorage.savePatternPreset(preset);

    SubtractorPresetStorage.deletePatternPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored.find((p: SubtractorPatternPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deletePatternPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_SUBTRACTOR_PATTERN_PRESETS[0].id;
    SubtractorPresetStorage.deletePatternPreset(builtInId);

    const all = SubtractorPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('deleteSoundPreset removes user preset', () => {
    const preset = makeSoundPreset('user-sub-sound-del', 'To Delete Sound');
    SubtractorPresetStorage.saveSoundPreset(preset);

    SubtractorPresetStorage.deleteSoundPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(SOUND_KEY)!);
    expect(stored.find((p: SubtractorSoundPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deleteSoundPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_SUBTRACTOR_SOUND_PRESETS[0].id;
    SubtractorPresetStorage.deleteSoundPreset(builtInId);

    const all = SubtractorPresetStorage.getSoundPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('each built-in pattern preset has 16 steps', () => {
    const presets = SubtractorPresetStorage.getPatternPresets().filter((p) => p.builtIn);
    for (const preset of presets) {
      expect(preset.steps).toHaveLength(16);
    }
  });

  it('all built-in pattern presets have unique ids', () => {
    const presets = SubtractorPresetStorage.getPatternPresets().filter((p) => p.builtIn);
    const ids = presets.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all built-in sound presets have unique ids', () => {
    const presets = SubtractorPresetStorage.getSoundPresets().filter((p) => p.builtIn);
    const ids = presets.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
