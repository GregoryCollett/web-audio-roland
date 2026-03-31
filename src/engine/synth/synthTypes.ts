export interface OscParams {
  waveform: 'sawtooth' | 'square' | 'pulse';
  octave: number;      // -2 to +2
  tune: number;        // -1 to 1 (±1 semitone)
  pulseWidth: number;  // 0-1
  level: number;       // 0-1
}

export interface ADSRParams {
  attack: number;  // 0-1
  decay: number;   // 0-1
  sustain: number; // 0-1
  release: number; // 0-1
}

export interface SH2Params {
  osc1: OscParams;
  osc2: OscParams;
  noiseLevel: number;
  cutoff: number;
  resonance: number;
  filterEnvDepth: number;
  filterEnv: ADSRParams;
  ampEnv: ADSRParams;
  lfoWaveform: 'triangle' | 'square';
  lfoRate: number;
  lfoDepth: number;
  lfoDestination: 'pitch' | 'cutoff' | 'pulseWidth';
  volume: number;
  accent: number;
}

export interface SynthStep {
  note: number;
  accent: boolean;
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface SynthPattern { steps: SynthStep[]; }

export interface SynthSnapshot {
  pattern: SynthPattern;
  params: SH2Params;
  presets: {
    patterns: SynthPatternPreset[];
    sounds: SynthSoundPreset[];
    activePatternId: string | null;
    activeSoundId: string | null;
  };
}

export interface SynthPatternPreset { id: string; name: string; builtIn: boolean; steps: SynthStep[]; }
export interface SynthSoundPreset { id: string; name: string; builtIn: boolean; params: SH2Params; }

export const NUM_SYNTH_STEPS = 16;

export const DEFAULT_OSC: OscParams = { waveform: 'sawtooth', octave: 0, tune: 0, pulseWidth: 0.5, level: 0.8 };
export const DEFAULT_ADSR: ADSRParams = { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 };
export const DEFAULT_SH2_PARAMS: SH2Params = {
  osc1: { ...DEFAULT_OSC },
  osc2: { ...DEFAULT_OSC, octave: -1 },
  noiseLevel: 0, cutoff: 0.5, resonance: 0.3, filterEnvDepth: 0.5,
  filterEnv: { ...DEFAULT_ADSR }, ampEnv: { ...DEFAULT_ADSR },
  lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
  volume: 0.8, accent: 0.5,
};

export function createDefaultSynthPattern(): SynthPattern {
  return { steps: Array.from({ length: NUM_SYNTH_STEPS }, () => ({ note: 48, accent: false, slide: false, gate: 'rest' as const })) };
}

export function midiToFreq(note: number): number { return 440 * Math.pow(2, (note - 69) / 12); }

export function midiToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[note % 12] + (Math.floor(note / 12) - 1);
}

/** Map 0-1 to time in seconds (logarithmic, 0.001s to 2s) */
export function adsrTimeMap(value: number): number { return 0.001 * Math.pow(2000, value); }
