import type { PatternPreset, KitPreset } from './types';
import { DEFAULT_PATTERN_PRESETS, DEFAULT_KIT_PRESETS } from './defaultPresets';

const PATTERN_KEY = 'tr909-pattern-presets';
const KIT_KEY = 'tr909-kit-presets';

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

export const PresetStorage = {
  getPatternPresets(): PatternPreset[] {
    const userPresets = readJSON<PatternPreset>(PATTERN_KEY);
    return [...DEFAULT_PATTERN_PRESETS, ...userPresets];
  },

  getKitPresets(): KitPreset[] {
    const userPresets = readJSON<KitPreset>(KIT_KEY);
    return [...DEFAULT_KIT_PRESETS, ...userPresets];
  },

  savePatternPreset(preset: PatternPreset): void {
    const existing = readJSON<PatternPreset>(PATTERN_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(PATTERN_KEY, updated);
  },

  saveKitPreset(preset: KitPreset): void {
    const existing = readJSON<KitPreset>(KIT_KEY);
    const updated = existing.filter((p) => p.id !== preset.id);
    updated.push(preset);
    writeJSON(KIT_KEY, updated);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<PatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteKitPreset(id: string): void {
    if (DEFAULT_KIT_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<KitPreset>(KIT_KEY);
    writeJSON(KIT_KEY, existing.filter((p) => p.id !== id));
  },
};
