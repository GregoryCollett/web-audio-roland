import type { BassPatternPreset, BassSynthPreset, BassStep } from './bassTypes';

// MIDI note constants
const C2 = 36;
const D2 = 38;
const Eb2 = 39;
const F2 = 41;
const G2 = 43;
const Ab2 = 44;
const Bb2 = 46;
const C3 = 48;
const D3 = 50;
// const Eb3 = 51;
const F3 = 53;
const G3 = 55;

type StepDef = [note: number, gate: 'note' | 'rest' | 'tie', accent?: boolean, slide?: boolean];

function makeStep(def: StepDef): BassStep {
  return {
    note: def[0],
    gate: def[1],
    accent: def[2] ?? false,
    slide: def[3] ?? false,
  };
}

function makePattern(id: string, name: string, defs: StepDef[]): BassPatternPreset {
  return {
    id,
    name,
    builtIn: true,
    steps: defs.map(makeStep),
  };
}

export const DEFAULT_BASS_PATTERN_PRESETS: BassPatternPreset[] = [
  makePattern('builtin-acid-line', 'Acid Line', [
    [C2,  'note', true,  true ],
    [C2,  'tie',  false, false],
    [C2,  'note', false, true ],
    [G2,  'note', true,  false],
    [C2,  'note', false, true ],
    [Bb2, 'note', false, false],
    [C3,  'note', true,  false],
    [C2,  'rest', false, false],
    [C2,  'note', true,  true ],
    [C2,  'note', false, true ],
    [Ab2, 'note', false, false],
    [G2,  'note', true,  false],
    [F2,  'note', false, true ],
    [Eb2, 'note', false, false],
    [D2,  'note', true,  true ],
    [C2,  'note', false, false],
  ]),

  makePattern('builtin-resonance-workout', 'Resonance Workout', [
    [C2,  'note', true,  false],
    [C2,  'rest', false, false],
    [C2,  'note', false, false],
    [C2,  'note', true,  true ],
    [C2,  'tie',  false, false],
    [C2,  'note', false, false],
    [G2,  'note', true,  false],
    [G2,  'rest', false, false],
    [F2,  'note', false, true ],
    [F2,  'note', true,  false],
    [Eb2, 'note', false, false],
    [D2,  'note', false, true ],
    [C2,  'note', true,  false],
    [C2,  'rest', false, false],
    [Bb2, 'note', false, false],
    [C3,  'note', true,  false],
  ]),

  makePattern('builtin-bubbling', 'Bubbling', [
    [C2,  'note', false, true ],
    [Eb2, 'note', false, true ],
    [G2,  'note', true,  true ],
    [G2,  'tie',  false, false],
    [F2,  'note', false, true ],
    [Eb2, 'note', false, false],
    [D2,  'rest', false, false],
    [C2,  'note', false, true ],
    [C2,  'note', false, true ],
    [D2,  'note', false, true ],
    [Eb2, 'note', true,  true ],
    [F2,  'note', false, true ],
    [G2,  'note', false, false],
    [F2,  'rest', false, false],
    [Eb2, 'note', false, true ],
    [D2,  'note', true,  false],
  ]),

  makePattern('builtin-sub-bass', 'Sub Bass', [
    [C2,  'note', true,  false],
    [C2,  'tie',  false, false],
    [C2,  'tie',  false, false],
    [C2,  'rest', false, false],
    [C2,  'note', false, false],
    [C2,  'rest', false, false],
    [C2,  'note', true,  false],
    [C2,  'tie',  false, false],
    [F2,  'note', false, false],
    [F2,  'tie',  false, false],
    [F2,  'rest', false, false],
    [G2,  'note', true,  false],
    [G2,  'tie',  false, false],
    [G2,  'rest', false, false],
    [C2,  'note', false, true ],
    [C2,  'note', true,  false],
  ]),

  makePattern('builtin-staccato-funk', 'Staccato Funk', [
    [C2,  'note', true,  false],
    [C2,  'rest', false, false],
    [Eb2, 'note', false, false],
    [C2,  'rest', false, false],
    [G2,  'note', true,  false],
    [C2,  'rest', false, false],
    [F2,  'note', false, false],
    [Eb2, 'note', false, false],
    [C2,  'note', true,  false],
    [C2,  'rest', false, false],
    [D2,  'note', false, false],
    [C2,  'rest', false, false],
    [Ab2, 'note', true,  false],
    [G2,  'note', false, false],
    [F2,  'rest', false, false],
    [G2,  'note', true,  false],
  ]),

  makePattern('builtin-arpeggiated', 'Arpeggiated', [
    [C2,  'note', false, true ],
    [G2,  'note', false, true ],
    [C3,  'note', true,  true ],
    [G3,  'note', false, false],
    [F3,  'note', false, true ],
    [C3,  'note', false, true ],
    [F2,  'note', true,  true ],
    [C2,  'note', false, false],
    [D2,  'note', false, true ],
    [F2,  'note', false, true ],
    [D3,  'note', true,  false],
    [D3,  'rest', false, false],
    [C3,  'note', false, true ],
    [G2,  'note', false, true ],
    [Eb2, 'note', true,  false],
    [C2,  'note', false, false],
  ]),
];

export const DEFAULT_BASS_SYNTH_PRESETS: BassSynthPreset[] = [
  {
    id: 'builtin-classic-acid',
    name: 'Classic Acid',
    builtIn: true,
    synth: { waveform: 'sawtooth', cutoff: 0.4, resonance: 0.7, envMod: 0.7, decay: 0.4, accent: 0.6, volume: 0.8 },
  },
  {
    id: 'builtin-squelch',
    name: 'Squelch',
    builtIn: true,
    synth: { waveform: 'square', cutoff: 0.2, resonance: 0.9, envMod: 0.9, decay: 0.3, accent: 0.8, volume: 0.75 },
  },
  {
    id: 'builtin-warm-bass',
    name: 'Warm Bass',
    builtIn: true,
    synth: { waveform: 'sawtooth', cutoff: 0.3, resonance: 0.2, envMod: 0.2, decay: 0.6, accent: 0.3, volume: 0.85 },
  },
  {
    id: 'builtin-screamer',
    name: 'Screamer',
    builtIn: true,
    synth: { waveform: 'sawtooth', cutoff: 0.7, resonance: 0.75, envMod: 0.6, decay: 0.2, accent: 0.7, volume: 0.7 },
  },
  {
    id: 'builtin-hollow',
    name: 'Hollow',
    builtIn: true,
    synth: { waveform: 'square', cutoff: 0.45, resonance: 0.45, envMod: 0.4, decay: 0.5, accent: 0.4, volume: 0.8 },
  },
  {
    id: 'builtin-dark-sub',
    name: 'Dark Sub',
    builtIn: true,
    synth: { waveform: 'sawtooth', cutoff: 0.15, resonance: 0.1, envMod: 0.05, decay: 0.7, accent: 0.2, volume: 0.9 },
  },
];
