import { describe, it, expect, beforeEach } from 'vitest';
import { PresetStorage } from '../presetStorage';
import { DEFAULT_PATTERN_PRESETS, DEFAULT_KIT_PRESETS } from '../defaultPresets';
import type { PatternPreset, KitPreset } from '../types';
import { createDefaultSteps } from '../types';

const PATTERN_KEY = 'tr909-pattern-presets';
const KIT_KEY = 'tr909-kit-presets';

function makePatternPreset(id: string, name: string): PatternPreset {
  return {
    id,
    name,
    builtIn: false,
    steps: createDefaultSteps(),
    accents: new Array(16).fill(false),
  };
}

function makeKitPreset(id: string, name: string): KitPreset {
  return {
    id,
    name,
    builtIn: false,
    instruments: {
      kick:      { level: 0.8, decay: 0.5, tune: 0.5 },
      snare:     { level: 0.8, decay: 0.5, tune: 0.5 },
      clap:      { level: 0.8, decay: 0.5 },
      rimshot:   { level: 0.8, decay: 0.5 },
      closedHat: { level: 0.8, decay: 0.5 },
      openHat:   { level: 0.8, decay: 0.5 },
      lowTom:    { level: 0.8, decay: 0.5, tune: 0.5 },
      midTom:    { level: 0.8, decay: 0.5, tune: 0.5 },
      hiTom:     { level: 0.8, decay: 0.5, tune: 0.5 },
      crash:     { level: 0.8, decay: 0.5 },
      ride:      { level: 0.8, decay: 0.5 },
    },
  };
}

describe('PresetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPatternPresets returns built-in presets when localStorage is empty', () => {
    const presets = PresetStorage.getPatternPresets();
    expect(presets).toEqual(DEFAULT_PATTERN_PRESETS);
  });

  it('getPatternPresets merges user presets with built-in presets', () => {
    const userPreset = makePatternPreset('user-pattern-1', 'My Pattern');
    localStorage.setItem(PATTERN_KEY, JSON.stringify([userPreset]));

    const presets = PresetStorage.getPatternPresets();
    expect(presets).toHaveLength(DEFAULT_PATTERN_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_PATTERN_PRESETS.length)).toEqual(DEFAULT_PATTERN_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userPreset);
  });

  it('getKitPresets returns built-in presets when localStorage is empty', () => {
    const presets = PresetStorage.getKitPresets();
    expect(presets).toEqual(DEFAULT_KIT_PRESETS);
  });

  it('getKitPresets merges user presets with built-in presets', () => {
    const userKit = makeKitPreset('user-kit-1', 'My Kit');
    localStorage.setItem(KIT_KEY, JSON.stringify([userKit]));

    const presets = PresetStorage.getKitPresets();
    expect(presets).toHaveLength(DEFAULT_KIT_PRESETS.length + 1);
    expect(presets.slice(0, DEFAULT_KIT_PRESETS.length)).toEqual(DEFAULT_KIT_PRESETS);
    expect(presets[presets.length - 1]).toEqual(userKit);
  });

  it('savePatternPreset saves to localStorage', () => {
    const preset = makePatternPreset('user-pattern-2', 'Saved Pattern');
    PresetStorage.savePatternPreset(preset);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(preset);

    // Verify it shows up via getter
    const all = PresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === preset.id)).toEqual(preset);
  });

  it('savePatternPreset replaces existing preset with same id', () => {
    const original = makePatternPreset('user-pattern-3', 'Original');
    PresetStorage.savePatternPreset(original);

    const updated = { ...original, name: 'Updated' };
    PresetStorage.savePatternPreset(updated);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Updated');
  });

  it('saveKitPreset saves to localStorage', () => {
    const kit = makeKitPreset('user-kit-2', 'Saved Kit');
    PresetStorage.saveKitPreset(kit);

    const stored = JSON.parse(localStorage.getItem(KIT_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(kit);

    // Verify it shows up via getter
    const all = PresetStorage.getKitPresets();
    expect(all.find((k) => k.id === kit.id)).toEqual(kit);
  });

  it('deletePatternPreset removes user preset', () => {
    const preset = makePatternPreset('user-pattern-del', 'To Delete');
    PresetStorage.savePatternPreset(preset);

    PresetStorage.deletePatternPreset(preset.id);

    const stored = JSON.parse(localStorage.getItem(PATTERN_KEY)!);
    expect(stored.find((p: PatternPreset) => p.id === preset.id)).toBeUndefined();
  });

  it('deletePatternPreset refuses to delete built-in preset', () => {
    const builtInId = DEFAULT_PATTERN_PRESETS[0].id;
    // Attempting to delete a built-in should be a no-op
    PresetStorage.deletePatternPreset(builtInId);

    // Built-in still appears in results
    const all = PresetStorage.getPatternPresets();
    expect(all.find((p) => p.id === builtInId)).toBeDefined();
  });

  it('deleteKitPreset removes user kit preset', () => {
    const kit = makeKitPreset('user-kit-del', 'To Delete Kit');
    PresetStorage.saveKitPreset(kit);

    PresetStorage.deleteKitPreset(kit.id);

    const stored = JSON.parse(localStorage.getItem(KIT_KEY)!);
    expect(stored.find((k: KitPreset) => k.id === kit.id)).toBeUndefined();
  });

  it('deleteKitPreset refuses to delete built-in kit preset', () => {
    const builtInId = DEFAULT_KIT_PRESETS[0].id;
    PresetStorage.deleteKitPreset(builtInId);

    const all = PresetStorage.getKitPresets();
    expect(all.find((k) => k.id === builtInId)).toBeDefined();
  });
});
