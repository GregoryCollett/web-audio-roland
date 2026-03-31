import { describe, it, expect, beforeEach } from 'vitest';
import { BassPresetStorage } from '../bassPresetStorage';
import { DEFAULT_BASS_PATTERN_PRESETS, DEFAULT_BASS_SYNTH_PRESETS } from '../defaultBassPresets';
import type { BassPatternPreset, BassSynthPreset, BassStep } from '../bassTypes';

const PATTERN_KEY = 'tr909-bass-pattern-presets';
const SYNTH_KEY = 'tr909-bass-synth-presets';

function makeStep(): BassStep {
  return { note: 36, accent: false, slide: false, gate: 'rest' };
}

function makePatternPreset(id: string, name: string): BassPatternPreset {
  return {
    id,
    name,
    builtIn: false,
    steps: Array.from({ length: 16 }, makeStep),
  };
}

function makeSynthPreset(id: string, name: string): BassSynthPreset {
  return {
    id,
    name,
    builtIn: false,
    synth: {
      waveform: 'sawtooth',
      cutoff: 0.5,
      resonance: 0.5,
      envMod: 0.5,
      decay: 0.5,
      accent: 0.5,
      volume: 0.8,
    },
  };
}

describe('BassPresetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPatternPresets returns built-in presets when localStorage is empty', () => {
    const presets = BassPresetStorage.getPatternPresets();
    expect(presets).toEqual(DEFAULT_BASS_PATTERN_PRESETS);
  });

  it('getSynthPresets returns built-in presets when localStorage is empty', () => {
    const presets = BassPresetStorage.getSynthPresets();
    expect(presets).toEqual(DEFAULT_BASS_SYNTH_PRESETS);
  });

  it('getPatternPresets merges user presets with built-in presets', () => {
    const userPreset = makePatternPreset('user-bass-pattern-1', 'My Bass Pattern');
    localStorage.setItem(PATTERN_KEY, JSON.stringify([userPreset]));

    const presets = BassPresetStorage.getPatternPresets();
    expect(presets).toHaveLength(DEFAULT_BASS_PATTERN_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_BASS_PATTERN_PRESETS.length)).toEqual(DEFAULT_BASS_PATTERN_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('getSynthPresets merges user presets with built-in presets', () => {
    const userPreset = makeSynthPreset('user-bass-synth-1', 'My Synth');
    localStorage.setItem(SYNTH_KEY, JSON.stringify([userPreset]));

    const presets = BassPresetStorage.getSynthPresets();
    expect(presets).toHaveLength(DEFAULT_BASS_SYNTH_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_BASS_SYNTH_PRESETS.length)).toEqual(DEFAULT_BASS_SYNTH_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('savePatternPreset saves and retrieves user preset', () => {
    const preset = makePatternPreset('user-bass-pattern-2', 'Saved Bass Pattern');
    BassPresetStorage.savePatternPreset(preset);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = BassPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('saveSynthPreset saves and retrieves user preset', () => {
    const preset = makeSynthPreset('user-bass-synth-2', 'Saved Synth');
    BassPresetStorage.saveSynthPreset(preset);

    const stored = JSON.parse(localStorage.getItem(SYNTH_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    const all = BassPresetStorage.getSynthPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('savePatternPreset replaces existing preset with same id', () => {
    const original = makePatternPreset('user-bass-pattern-3', 'Original');
    BassPresetStorage.savePatternPreset(original);

    const updated = { ...original, name: 'Updated' };
    BassPresetStorage.savePatternPreset(updated);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Updated');
  });

  it('deletePatternPreset removes user preset', () => {
    const preset = makePatternPreset('user-bass-pattern-del', 'To Delete');
    BassPresetStorage.savePatternPreset(preset);

    BassPresetStorage.deletePatternPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored.find((p: BassPatternPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deletePatternPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_BASS_PATTERN_PRESETS[0].id;
    BassPresetStorage.deletePatternPreset(builtInId);

    const all = BassPresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('deleteSynthPreset removes user preset', () => {
    const preset = makeSynthPreset('user-bass-synth-del', 'To Delete Synth');
    BassPresetStorage.saveSynthPreset(preset);

    BassPresetStorage.deleteSynthPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(SYNTH_KEY)!);
    expect(stored.find((p: BassSynthPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deleteSynthPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_BASS_SYNTH_PRESETS[0].id;
    BassPresetStorage.deleteSynthPreset(builtInId);

    const all = BassPresetStorage.getSynthPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });
});
