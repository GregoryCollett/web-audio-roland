export interface BassStep {
  note: number;       // MIDI note number (0-127)
  accent: boolean;
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface BassPattern {
  steps: BassStep[];  // 16 steps
}

export interface SynthParams {
  waveform: 'sawtooth' | 'square';
  cutoff: number;       // 0–1
  resonance: number;    // 0–1
  envMod: number;       // 0–1
  decay: number;        // 0–1
  accent: number;       // 0–1
  volume: number;       // 0–1
}

export interface BassSnapshot {
  pattern: BassPattern;
  synth: SynthParams;
  presets: {
    patterns: BassPatternPreset[];
    synths: BassSynthPreset[];
    activePatternId: string | null;
    activeSynthId: string | null;
  };
}

export interface BassPatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: BassStep[];
}

export interface BassSynthPreset {
  id: string;
  name: string;
  builtIn: boolean;
  synth: SynthParams;
}

export const NUM_BASS_STEPS = 16;

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  waveform: 'sawtooth',
  cutoff: 0.5,
  resonance: 0.5,
  envMod: 0.5,
  decay: 0.5,
  accent: 0.5,
  volume: 0.8,
};

export function createDefaultBassPattern(): BassPattern {
  return {
    steps: Array.from({ length: NUM_BASS_STEPS }, () => ({
      note: 36,
      accent: false,
      slide: false,
      gate: 'rest' as const,
    })),
  };
}

export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function midiToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return names[note % 12] + octave;
}
