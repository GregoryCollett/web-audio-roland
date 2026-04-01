// Re-export shared utilities from synthTypes
export { ADSRParams, midiToFreq, midiToName, adsrTimeMap } from '../synth/synthTypes';
import type { ADSRParams } from '../synth/synthTypes';
import { DEFAULT_ADSR as SYNTH_DEFAULT_ADSR } from '../synth/synthTypes';

// ---------------------------------------------------------------------------
// Oscillator
// ---------------------------------------------------------------------------

export interface SubOscParams {
  waveform: number;     // 0-31
  octave: number;       // -2 to +2
  semitone: number;     // -12 to +12
  fineTune: number;     // -50 to +50 cents
  pulseWidth: number;   // 0-1
  level: number;        // 0-1
}

// ---------------------------------------------------------------------------
// LFO
// ---------------------------------------------------------------------------

export type LFOWaveform = 'triangle' | 'sawtooth' | 'square' | 'random';

export interface LFOParams {
  waveform: LFOWaveform;
  rate: number;      // 0-1
  delay: number;     // 0-1
  keySync: boolean;
}

// ---------------------------------------------------------------------------
// Modulation
// ---------------------------------------------------------------------------

export type ModSource = 'lfo1' | 'lfo2' | 'modEnv' | 'velocity' | 'none';

export interface ModSlot {
  source: ModSource;
  destination: string;
  amount: number; // -1 to +1
}

export const MOD_DESTINATIONS: string[] = [
  'osc1Pitch',
  'osc2Pitch',
  'oscMix',
  'filterCutoff',
  'filterResonance',
  'ampLevel',
  'pulseWidth',
  'lfo1Rate',
  'lfo2Rate',
  'fmAmount',
  'panPosition',
  'portamentoRate',
];

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

export interface FilterParams {
  cutoff: number;     // 0-1
  resonance: number;  // 0-1
  keyTrack: number;   // 0-1
}

export type Filter1Mode = 'lp12' | 'lp24' | 'hp12' | 'bp12' | 'notch';

export const FILTER1_MODES: Filter1Mode[] = ['lp12', 'lp24', 'hp12', 'bp12', 'notch'];

// ---------------------------------------------------------------------------
// Main synth params
// ---------------------------------------------------------------------------

export type PortamentoMode = 'off' | 'on' | 'auto';

export interface SubtractorParams {
  osc1: SubOscParams;
  osc2: SubOscParams;
  noiseLevel: number;       // 0-1
  ringModLevel: number;     // 0-1
  fmAmount: number;         // 0-1
  oscMix: number;           // 0-1 (0 = osc1 only, 1 = osc2 only)
  filter1: FilterParams;
  filter1Mode: Filter1Mode;
  filter2: FilterParams;
  filterEnv: ADSRParams;
  filterEnvDepth: number;   // -1 to +1
  ampEnv: ADSRParams;
  modEnv: ADSRParams;
  modMatrix: [ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot];
  lfo1: LFOParams;
  lfo2: LFOParams;
  portamentoMode: PortamentoMode;
  portamentoRate: number;   // 0-1
  volume: number;           // 0-1
}

// ---------------------------------------------------------------------------
// Pattern / sequencer
// ---------------------------------------------------------------------------

export interface SubtractorStep {
  note: number;      // 0-127
  velocity: number;  // 0-127
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface SubtractorPattern {
  steps: SubtractorStep[];
}

export interface SubtractorSnapshot {
  pattern: SubtractorPattern;
  params: SubtractorParams;
  presets: {
    patterns: SubtractorPatternPreset[];
    sounds: SubtractorSoundPreset[];
    activePatternId: string | null;
    activeSoundId: string | null;
  };
}

export interface SubtractorPatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: SubtractorStep[];
}

export interface SubtractorSoundPreset {
  id: string;
  name: string;
  builtIn: boolean;
  params: SubtractorParams;
}

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

export const NUM_SUBTRACTOR_STEPS = 16;

export const DEFAULT_SUB_OSC: SubOscParams = {
  waveform: 2,      // Sawtooth
  octave: 0,
  semitone: 0,
  fineTune: 0,
  pulseWidth: 0.5,
  level: 0.8,
};

export const DEFAULT_ADSR: ADSRParams = { ...SYNTH_DEFAULT_ADSR };

export const DEFAULT_LFO: LFOParams = {
  waveform: 'triangle',
  rate: 0.3,
  delay: 0,
  keySync: false,
};

export function createEmptyModMatrix(): [ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot, ModSlot] {
  const empty: ModSlot = { source: 'none', destination: MOD_DESTINATIONS[0], amount: 0 };
  return [
    { ...empty },
    { ...empty },
    { ...empty },
    { ...empty },
    { ...empty },
    { ...empty },
    { ...empty },
    { ...empty },
  ];
}

export const DEFAULT_SUBTRACTOR_PARAMS: SubtractorParams = {
  osc1: { ...DEFAULT_SUB_OSC },
  osc2: { ...DEFAULT_SUB_OSC, octave: -1, level: 0.5 },
  noiseLevel: 0,
  ringModLevel: 0,
  fmAmount: 0,
  oscMix: 0.5,
  filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.5 },
  filter1Mode: 'lp24',
  filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
  filterEnv: { ...DEFAULT_ADSR },
  filterEnvDepth: 0.4,
  ampEnv: { ...DEFAULT_ADSR },
  modEnv: { ...DEFAULT_ADSR },
  modMatrix: createEmptyModMatrix(),
  lfo1: { ...DEFAULT_LFO },
  lfo2: { ...DEFAULT_LFO, waveform: 'square' },
  portamentoMode: 'off',
  portamentoRate: 0.1,
  volume: 0.8,
};

export function createDefaultSubtractorPattern(): SubtractorPattern {
  return {
    steps: Array.from({ length: NUM_SUBTRACTOR_STEPS }, () => ({
      note: 48,
      velocity: 100,
      slide: false,
      gate: 'rest' as const,
    })),
  };
}
