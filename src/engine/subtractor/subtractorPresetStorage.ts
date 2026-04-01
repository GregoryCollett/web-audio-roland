import type { SubtractorPatternPreset, SubtractorSoundPreset } from './subtractorTypes';
import {
  DEFAULT_SUBTRACTOR_PATTERN_PRESETS,
  DEFAULT_SUBTRACTOR_SOUND_PRESETS,
} from './defaultSubtractorPresets';

const PATTERN_KEY = 'tr909-subtractor-pattern-presets';
const SOUND_KEY   = 'tr909-subtractor-sound-presets';

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

export const SubtractorPresetStorage = {
  getPatternPresets(): SubtractorPatternPreset[] {
    const userPresets = readJSON<SubtractorPatternPreset>(PATTERN_KEY);
    return [...DEFAULT_SUBTRACTOR_PATTERN_PRESETS, ...userPresets];
  },

  getSoundPresets(): SubtractorSoundPreset[] {
    const userPresets = readJSON<SubtractorSoundPreset>(SOUND_KEY);
    return [...DEFAULT_SUBTRACTOR_SOUND_PRESETS, ...userPresets];
  },

  savePatternPreset(preset: SubtractorPatternPreset): void {
    const existing = readJSON<SubtractorPatternPreset>(PATTERN_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(PATTERN_KEY, updated);
  },

  saveSoundPreset(preset: SubtractorSoundPreset): void {
    const existing = readJSON<SubtractorSoundPreset>(SOUND_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(SOUND_KEY, updated);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_SUBTRACTOR_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<SubtractorPatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteSoundPreset(id: string): void {
    if (DEFAULT_SUBTRACTOR_SOUND_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<SubtractorSoundPreset>(SOUND_KEY);
    writeJSON(SOUND_KEY, existing.filter((p) => p.id !== id));
  },
};
