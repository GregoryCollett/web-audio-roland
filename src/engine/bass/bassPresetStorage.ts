import type { BassPatternPreset, BassSynthPreset } from './bassTypes';
import { DEFAULT_BASS_PATTERN_PRESETS, DEFAULT_BASS_SYNTH_PRESETS } from './defaultBassPresets';

const PATTERN_KEY = 'tr909-bass-pattern-presets';
const SYNTH_KEY = 'tr909-bass-synth-presets';

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

export const BassPresetStorage = {
  getPatternPresets(): BassPatternPreset[] {
    const userPresets = readJSON<BassPatternPreset>(PATTERN_KEY);
    return [...DEFAULT_BASS_PATTERN_PRESETS, ...userPresets];
  },

  getSynthPresets(): BassSynthPreset[] {
    const userPresets = readJSON<BassSynthPreset>(SYNTH_KEY);
    return [...DEFAULT_BASS_SYNTH_PRESETS, ...userPresets];
  },

  savePatternPreset(preset: BassPatternPreset): void {
    const existing = readJSON<BassPatternPreset>(PATTERN_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(PATTERN_KEY, updated);
  },

  saveSynthPreset(preset: BassSynthPreset): void {
    const existing = readJSON<BassSynthPreset>(SYNTH_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(SYNTH_KEY, updated);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_BASS_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<BassPatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteSynthPreset(id: string): void {
    if (DEFAULT_BASS_SYNTH_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<BassSynthPreset>(SYNTH_KEY);
    writeJSON(SYNTH_KEY, existing.filter((p) => p.id !== id));
  },
};
