import type { SynthPatternPreset, SynthSoundPreset } from './synthTypes';
import { DEFAULT_SYNTH_PATTERN_PRESETS, DEFAULT_SYNTH_SOUND_PRESETS } from './defaultSynthPresets';

const PATTERN_KEY = 'tr909-synth-pattern-presets';
const SOUND_KEY   = 'tr909-synth-sound-presets';

function readJSON<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const SynthPresetStorage = {
  getPatternPresets(): SynthPatternPreset[] {
    const userPresets = readJSON<SynthPatternPreset>(PATTERN_KEY);
    return [...DEFAULT_SYNTH_PATTERN_PRESETS, ...userPresets];
  },

  getSoundPresets(): SynthSoundPreset[] {
    const userPresets = readJSON<SynthSoundPreset>(SOUND_KEY);
    return [...DEFAULT_SYNTH_SOUND_PRESETS, ...userPresets];
  },

  savePatternPreset(preset: SynthPatternPreset): void {
    const existing = readJSON<SynthPatternPreset>(PATTERN_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(PATTERN_KEY, updated);
  },

  saveSoundPreset(preset: SynthSoundPreset): void {
    const existing = readJSON<SynthSoundPreset>(SOUND_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(SOUND_KEY, updated);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_SYNTH_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<SynthPatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteSoundPreset(id: string): void {
    if (DEFAULT_SYNTH_SOUND_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<SynthSoundPreset>(SOUND_KEY);
    writeJSON(SOUND_KEY, existing.filter((p) => p.id !== id));
  },
};
