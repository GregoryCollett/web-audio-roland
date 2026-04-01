import type { SynthPatternPreset, SynthSoundPreset, SynthStep } from './synthTypes';

// MIDI note constants (C3-C5 range)
const C3  = 48;
const Eb3 = 51;
const F3  = 53;
const G3  = 55;
const Bb3 = 58;
const C4  = 60;
const Eb4 = 63;
const G4  = 67;

type StepDef = [note: number, gate: 'note' | 'rest' | 'tie', accent?: boolean, slide?: boolean];

function makeStep(def: StepDef): SynthStep {
  return {
    note: def[0],
    gate: def[1],
    accent: def[2] ?? false,
    slide: def[3] ?? false,
  };
}

function makePattern(id: string, name: string, defs: StepDef[]): SynthPatternPreset {
  return {
    id,
    name,
    builtIn: true,
    steps: defs.map(makeStep),
  };
}

export const DEFAULT_SYNTH_PATTERN_PRESETS: SynthPatternPreset[] = [
  // 1. Sequence One — Rising C minor line with slides on ascending notes, accents on downbeats
  makePattern('builtin-synth-sequence-one', 'Sequence One', [
    [C3,  'note', true,  true ],   // step 0  — downbeat accent, slide into next
    [Eb3, 'note', false, true ],   // step 1  — slide into next
    [F3,  'note', false, true ],   // step 2  — slide into next
    [G3,  'note', true,  false],   // step 3  — downbeat accent
    [G3,  'tie',  false, false],   // step 4  — hold
    [Bb3, 'note', false, true ],   // step 5  — slide into next
    [C4,  'note', false, false],   // step 6
    [C4,  'rest', false, false],   // step 7  — rest
    [C4,  'note', true,  true ],   // step 8  — downbeat accent, slide into next
    [Bb3, 'note', false, true ],   // step 9  — slide back down
    [G3,  'note', false, true ],   // step 10 — slide
    [F3,  'note', true,  false],   // step 11 — accent
    [Eb3, 'note', false, true ],   // step 12 — slide
    [C3,  'note', false, false],   // step 13
    [C3,  'tie',  false, false],   // step 14 — hold
    [C3,  'rest', false, false],   // step 15 — rest
  ]),

  // 2. Pulse Drive — Steady eighth notes on C3, accents every 4 steps, some rests
  makePattern('builtin-synth-pulse-drive', 'Pulse Drive', [
    [C3,  'note', true,  false],   // step 0  — accent
    [C3,  'note', false, false],   // step 1
    [C3,  'rest', false, false],   // step 2  — rest for rhythm
    [C3,  'note', false, false],   // step 3
    [C3,  'note', true,  false],   // step 4  — accent
    [C3,  'note', false, false],   // step 5
    [C3,  'note', false, false],   // step 6
    [C3,  'rest', false, false],   // step 7  — rest for rhythm
    [C3,  'note', true,  false],   // step 8  — accent
    [C3,  'note', false, false],   // step 9
    [C3,  'rest', false, false],   // step 10 — rest
    [C3,  'note', false, false],   // step 11
    [C3,  'note', true,  false],   // step 12 — accent
    [C3,  'note', false, false],   // step 13
    [C3,  'note', false, false],   // step 14
    [C3,  'rest', false, false],   // step 15 — rest
  ]),

  // 3. Slow Melody — Quarter notes (every 4 steps) with ties creating long phrases
  makePattern('builtin-synth-slow-melody', 'Slow Melody', [
    [C3,  'note', false, false],   // step 0  — quarter note start
    [C3,  'tie',  false, false],   // step 1  — hold
    [C3,  'tie',  false, false],   // step 2  — hold
    [C3,  'tie',  false, false],   // step 3  — hold
    [Eb3, 'note', false, false],   // step 4  — quarter note
    [Eb3, 'tie',  false, false],   // step 5  — hold
    [Eb3, 'tie',  false, false],   // step 6  — hold
    [Eb3, 'tie',  false, false],   // step 7  — hold
    [F3,  'note', true,  false],   // step 8  — accented quarter note
    [F3,  'tie',  false, false],   // step 9  — hold
    [F3,  'tie',  false, false],   // step 10 — hold
    [F3,  'tie',  false, false],   // step 11 — hold
    [G3,  'note', false, false],   // step 12 — quarter note
    [G3,  'tie',  false, false],   // step 13 — hold
    [G3,  'tie',  false, false],   // step 14 — hold
    [G3,  'tie',  false, false],   // step 15 — hold
  ]),

  // 4. Arp Cascade — Fast ascending then descending, slides connecting, accents on peaks
  makePattern('builtin-synth-arp-cascade', 'Arp Cascade', [
    [C3,  'note', false, true ],   // step 0  — ascending start, slide
    [Eb3, 'note', false, true ],   // step 1  — slide
    [G3,  'note', false, true ],   // step 2  — slide
    [C4,  'note', true,  false],   // step 3  — peak accent
    [C4,  'rest', false, false],   // step 4  — brief rest
    [G3,  'note', false, true ],   // step 5  — descending, slide
    [Eb3, 'note', false, true ],   // step 6  — slide
    [C3,  'note', false, false],   // step 7  — bottom
    [C3,  'note', false, true ],   // step 8  — ascending again
    [Eb3, 'note', false, true ],   // step 9  — slide
    [G3,  'note', false, true ],   // step 10 — slide
    [C4,  'note', true,  true ],   // step 11 — peak accent, slide into descent
    [G4,  'note', false, true ],   // step 12 — high peak, slide back
    [Eb4, 'note', false, true ],   // step 13 — slide
    [C4,  'note', false, true ],   // step 14 — slide
    [G3,  'note', false, false],   // step 15 — land
  ]),

  // 5. Stab Pattern — Short staccato hits with rests, syncopated (steps 0,3,6,8,11,14)
  makePattern('builtin-synth-stab-pattern', 'Stab Pattern', [
    [C3,  'note', true,  false],   // step 0
    [C3,  'rest', false, false],   // step 1
    [C3,  'rest', false, false],   // step 2
    [G3,  'note', false, false],   // step 3
    [G3,  'rest', false, false],   // step 4
    [G3,  'rest', false, false],   // step 5
    [Eb3, 'note', false, false],   // step 6
    [Eb3, 'rest', false, false],   // step 7
    [C4,  'note', true,  false],   // step 8
    [C4,  'rest', false, false],   // step 9
    [C4,  'rest', false, false],   // step 10
    [F3,  'note', false, false],   // step 11
    [F3,  'rest', false, false],   // step 12
    [F3,  'rest', false, false],   // step 13
    [G3,  'note', false, false],   // step 14
    [G3,  'rest', false, false],   // step 15
  ]),

  // 6. Drone Evolve — Step 0 note C3, rests are ties with note changes at steps 8 (Eb3) and 12 (F3)
  makePattern('builtin-synth-drone-evolve', 'Drone Evolve', [
    [C3,  'note', false, false],   // step 0  — C3 drone begins
    [C3,  'tie',  false, false],   // step 1  — hold
    [C3,  'tie',  false, false],   // step 2  — hold
    [C3,  'tie',  false, false],   // step 3  — hold
    [C3,  'tie',  false, false],   // step 4  — hold
    [C3,  'tie',  false, false],   // step 5  — hold
    [C3,  'tie',  false, false],   // step 6  — hold
    [C3,  'tie',  false, false],   // step 7  — hold
    [Eb3, 'note', false, false],   // step 8  — evolves to Eb3
    [Eb3, 'tie',  false, false],   // step 9  — hold
    [Eb3, 'tie',  false, false],   // step 10 — hold
    [Eb3, 'tie',  false, false],   // step 11 — hold
    [F3,  'note', false, false],   // step 12 — evolves to F3
    [F3,  'tie',  false, false],   // step 13 — hold
    [F3,  'tie',  false, false],   // step 14 — hold
    [F3,  'tie',  false, false],   // step 15 — hold
  ]),
];

export const DEFAULT_SYNTH_SOUND_PRESETS: SynthSoundPreset[] = [
  {
    id: 'builtin-synth-classic-sh2',
    name: 'Classic GC-2',
    builtIn: true,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0,  tune: 0,   pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 'sawtooth', octave: -1, tune: 0,   pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      cutoff: 0.5, resonance: 0.3, filterEnvDepth: 0.5,
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      ampEnv:    { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
      volume: 0.8, accent: 0.5,
    },
  },
  {
    id: 'builtin-synth-fat-unison',
    name: 'Fat Unison',
    builtIn: true,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0, tune: 0,   pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 'sawtooth', octave: 0, tune: 0.1, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      cutoff: 0.35, resonance: 0.2, filterEnvDepth: 0.4,
      filterEnv: { attack: 0.01, decay: 0.5, sustain: 0.4, release: 0.4 },
      ampEnv:    { attack: 0.01, decay: 0.7, sustain: 0.3, release: 0.5 },
      lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
      volume: 0.8, accent: 0.5,
    },
  },
  {
    id: 'builtin-synth-pulse-lead',
    name: 'Pulse Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 'pulse',    octave: 0, tune: 0, pulseWidth: 0.3, level: 0.8 },
      osc2: { waveform: 'square',   octave: 1, tune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      cutoff: 0.6, resonance: 0.4, filterEnvDepth: 0.5,
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.2 },
      ampEnv:    { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.2 },
      lfoWaveform: 'triangle', lfoRate: 0.5, lfoDepth: 0.15, lfoDestination: 'pitch',
      volume: 0.8, accent: 0.5,
    },
  },
  {
    id: 'builtin-synth-dark-pad',
    name: 'Dark Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0,  tune: 0,    pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 'sawtooth', octave: -1, tune: 0.05, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      cutoff: 0.25, resonance: 0.15, filterEnvDepth: 0.3,
      filterEnv: { attack: 0.6, decay: 0.5, sustain: 0.4, release: 0.7 },
      ampEnv:    { attack: 0.6, decay: 0.5, sustain: 0.6, release: 0.7 },
      lfoWaveform: 'triangle', lfoRate: 0.15, lfoDepth: 0.3, lfoDestination: 'cutoff',
      volume: 0.75, accent: 0.3,
    },
  },
  {
    id: 'builtin-synth-noise-sweep',
    name: 'Noise Sweep',
    builtIn: true,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0,  tune: 0, pulseWidth: 0.5, level: 0.5 },
      osc2: { waveform: 'sawtooth', octave: -1, tune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.4,
      cutoff: 0.3, resonance: 0.25, filterEnvDepth: 0.8,
      filterEnv: { attack: 0.01, decay: 0.8, sustain: 0.1, release: 0.4 },
      ampEnv:    { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.3 },
      lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
      volume: 0.75, accent: 0.5,
    },
  },
  {
    id: 'builtin-synth-resonant-pluck',
    name: 'Resonant Pluck',
    builtIn: true,
    params: {
      osc1: { waveform: 'sawtooth', octave: 0, tune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 'sawtooth', octave: 0, tune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      cutoff: 0.4, resonance: 0.7, filterEnvDepth: 0.6,
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0,   release: 0.05 },
      ampEnv:    { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.1  },
      lfoWaveform: 'triangle', lfoRate: 0.3, lfoDepth: 0, lfoDestination: 'pitch',
      volume: 0.8, accent: 0.6,
    },
  },
];
