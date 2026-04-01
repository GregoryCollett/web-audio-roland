import type { SubtractorPatternPreset, SubtractorSoundPreset, SubtractorStep } from './subtractorTypes';
import { createEmptyModMatrix } from './subtractorTypes';

// ---------------------------------------------------------------------------
// MIDI note constants (C3–C5 range, 48–72)
// ---------------------------------------------------------------------------

const C3  = 48;
const D3  = 50;
const Eb3 = 51;
const F3  = 53;
const G3  = 55;
const Ab3 = 56;
const Bb3 = 58;
const C4  = 60;
const D4  = 62;
const Eb4 = 63;
const F4  = 65;
const G4  = 67;
const Ab4 = 68;
const Bb4 = 70;
const C5  = 72;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StepDef = [note: number, gate: 'note' | 'rest' | 'tie', velocity: number, slide?: boolean];

function makeStep(def: StepDef): SubtractorStep {
  return {
    note: def[0],
    gate: def[1],
    velocity: def[2],
    slide: def[3] ?? false,
  };
}

function makePattern(
  id: string,
  name: string,
  defs: StepDef[],
): SubtractorPatternPreset {
  return {
    id,
    name,
    builtIn: true,
    steps: defs.map(makeStep),
  };
}

// ---------------------------------------------------------------------------
// Pattern presets (12)
// ---------------------------------------------------------------------------

export const DEFAULT_SUBTRACTOR_PATTERN_PRESETS: SubtractorPatternPreset[] = [
  // 1. Classic Sequence — Rising minor scale, velocity accents on downbeats, slides ascending
  makePattern('builtin-sub-classic-sequence', 'Classic Sequence', [
    [C3,  'note', 110, true ],   // step 0  — downbeat accent, slide
    [Eb3, 'note',  80, true ],   // step 1  — slide
    [F3,  'note',  80, true ],   // step 2  — slide
    [G3,  'note', 110, false],   // step 3  — downbeat accent
    [G3,  'tie',   80, false],   // step 4  — hold
    [Bb3, 'note',  80, true ],   // step 5  — slide
    [C4,  'note',  90, false],   // step 6
    [C4,  'rest',  80, false],   // step 7  — rest
    [C4,  'note', 110, true ],   // step 8  — downbeat accent, slide
    [Bb3, 'note',  80, true ],   // step 9  — slide back down
    [G3,  'note',  80, true ],   // step 10 — slide
    [F3,  'note', 100, false],   // step 11 — accent
    [Eb3, 'note',  80, true ],   // step 12 — slide
    [C3,  'note',  75, false],   // step 13
    [C3,  'tie',   75, false],   // step 14 — hold
    [C3,  'rest',  75, false],   // step 15 — rest
  ]),

  // 2. Velocity Sweep — Same note, velocity ramps up then down
  makePattern('builtin-sub-velocity-sweep', 'Velocity Sweep', [
    [C3, 'note',  40, false],   // step 0  — quiet start
    [C3, 'note',  50, false],   // step 1
    [C3, 'note',  60, false],   // step 2
    [C3, 'note',  72, false],   // step 3
    [C3, 'note',  84, false],   // step 4
    [C3, 'note',  96, false],   // step 5
    [C3, 'note', 110, false],   // step 6
    [C3, 'note', 127, false],   // step 7  — peak
    [C3, 'note', 127, false],   // step 8  — peak hold
    [C3, 'note', 110, false],   // step 9  — descend
    [C3, 'note',  96, false],   // step 10
    [C3, 'note',  84, false],   // step 11
    [C3, 'note',  72, false],   // step 12
    [C3, 'note',  60, false],   // step 13
    [C3, 'note',  50, false],   // step 14
    [C3, 'note',  40, false],   // step 15 — quiet end
  ]),

  // 3. Chord Stabs — Short gated notes on 1, &2, 4 with high velocity
  makePattern('builtin-sub-chord-stabs', 'Chord Stabs', [
    [C3,  'note', 127, false],  // step 0  — beat 1, high vel
    [C3,  'rest',  80, false],  // step 1
    [C3,  'rest',  80, false],  // step 2
    [G3,  'note', 110, false],  // step 3  — &2 stab
    [G3,  'rest',  80, false],  // step 4
    [Eb3, 'note', 100, false],  // step 5  — &2+ stab
    [Eb3, 'rest',  80, false],  // step 6
    [C3,  'rest',  80, false],  // step 7
    [C4,  'note', 127, false],  // step 8  — beat 3, high vel
    [C4,  'rest',  80, false],  // step 9
    [C4,  'rest',  80, false],  // step 10
    [G3,  'note', 110, false],  // step 11 — &4 stab
    [G3,  'rest',  80, false],  // step 12
    [C4,  'note', 120, false],  // step 13 — beat 4 emphasis
    [C4,  'rest',  80, false],  // step 14
    [C3,  'rest',  80, false],  // step 15
  ]),

  // 4. Legato Line — Long tied phrases with slides, expressive velocity
  makePattern('builtin-sub-legato-line', 'Legato Line', [
    [C3,  'note',  90, true ],  // step 0  — phrase start, slide
    [Eb3, 'note',  95, true ],  // step 1  — slide
    [F3,  'tie',   95, false],  // step 2  — hold
    [G3,  'note', 100, true ],  // step 3  — slide
    [Bb3, 'note', 105, true ],  // step 4  — slide
    [C4,  'tie',  105, false],  // step 5  — hold
    [C4,  'tie',  105, false],  // step 6  — hold
    [Bb3, 'note', 100, true ],  // step 7  — slide back
    [Ab3, 'note',  95, true ],  // step 8  — slide
    [G3,  'tie',   90, false],  // step 9  — hold
    [F3,  'note',  85, true ],  // step 10 — slide
    [Eb3, 'note',  80, true ],  // step 11 — slide
    [D3,  'tie',   80, false],  // step 12 — hold
    [C3,  'note',  75, false],  // step 13 — resolve
    [C3,  'tie',   75, false],  // step 14 — hold
    [C3,  'tie',   75, false],  // step 15 — hold
  ]),

  // 5. Rhythmic Pulse — Syncopated 16ths, velocity creates groove
  makePattern('builtin-sub-rhythmic-pulse', 'Rhythmic Pulse', [
    [C3, 'note', 110, false],   // step 0  — downbeat
    [C3, 'note',  60, false],   // step 1  — ghost
    [C3, 'rest',  60, false],   // step 2
    [C3, 'note',  90, false],   // step 3  — syncopated hit
    [C3, 'note',  65, false],   // step 4
    [C3, 'rest',  60, false],   // step 5
    [C3, 'note', 100, false],   // step 6  — accent
    [C3, 'note',  55, false],   // step 7  — ghost
    [C3, 'note', 110, false],   // step 8  — downbeat
    [C3, 'rest',  60, false],   // step 9
    [C3, 'note',  70, false],   // step 10
    [C3, 'note',  80, false],   // step 11 — accent
    [C3, 'note',  55, false],   // step 12 — ghost
    [C3, 'rest',  60, false],   // step 13
    [C3, 'note',  95, false],   // step 14 — syncopated
    [C3, 'note',  65, false],   // step 15 — ghost
  ]),

  // 6. Ambient Drift — Sparse notes with ties, low velocity, occasional peaks
  makePattern('builtin-sub-ambient-drift', 'Ambient Drift', [
    [G3,  'note',  50, false],  // step 0  — gentle start
    [G3,  'tie',   50, false],  // step 1  — hold
    [G3,  'tie',   50, false],  // step 2  — hold
    [G3,  'rest',  50, false],  // step 3
    [C4,  'note',  45, false],  // step 4  — drift up
    [C4,  'tie',   45, false],  // step 5  — hold
    [C4,  'rest',  45, false],  // step 6
    [C4,  'rest',  45, false],  // step 7
    [Eb4, 'note',  70, false],  // step 8  — peak
    [Eb4, 'tie',   70, false],  // step 9  — hold
    [Eb4, 'tie',   70, false],  // step 10 — hold
    [Eb4, 'rest',  70, false],  // step 11
    [G3,  'note',  40, false],  // step 12 — quiet settle
    [G3,  'tie',   40, false],  // step 13 — hold
    [G3,  'tie',   40, false],  // step 14 — hold
    [G3,  'tie',   40, false],  // step 15 — hold
  ]),

  // 7. Octave Bounce — Alternating low/high octave, velocity emphasizing lows
  makePattern('builtin-sub-octave-bounce', 'Octave Bounce', [
    [C3,  'note', 110, false],  // step 0  — low, strong
    [C4,  'note',  75, false],  // step 1  — high, soft
    [C3,  'note', 105, false],  // step 2  — low
    [C4,  'note',  70, false],  // step 3  — high
    [C3,  'note', 115, false],  // step 4  — low, accent
    [C4,  'note',  65, false],  // step 5  — high
    [C3,  'note',  95, false],  // step 6  — low
    [C4,  'rest',  65, false],  // step 7  — rest
    [C3,  'note', 110, false],  // step 8  — low, strong
    [C4,  'note',  80, false],  // step 9  — high
    [C3,  'note',  90, false],  // step 10 — low
    [C4,  'note',  70, false],  // step 11 — high
    [C3,  'note', 120, false],  // step 12 — low, big accent
    [C4,  'note',  65, false],  // step 13 — high
    [C3,  'note', 100, false],  // step 14 — low
    [C3,  'rest',  65, false],  // step 15 — rest
  ]),

  // 8. Trance Gate — Every step C3, velocity creates rhythmic gate
  makePattern('builtin-sub-trance-gate', 'Trance Gate', [
    [C3, 'note', 127, false],   // step 0  — full on
    [C3, 'note',  40, false],   // step 1  — ghost
    [C3, 'note', 100, false],   // step 2  — strong
    [C3, 'note',  40, false],   // step 3  — ghost
    [C3, 'note', 110, false],   // step 4  — strong
    [C3, 'note',  40, false],   // step 5  — ghost
    [C3, 'note',  80, false],   // step 6  — medium
    [C3, 'note',  40, false],   // step 7  — ghost
    [C3, 'note', 127, false],   // step 8  — full on
    [C3, 'note',  40, false],   // step 9  — ghost
    [C3, 'note', 100, false],   // step 10 — strong
    [C3, 'note',  50, false],   // step 11 — ghost+
    [C3, 'note', 115, false],   // step 12 — strong
    [C3, 'note',  40, false],   // step 13 — ghost
    [C3, 'note',  90, false],   // step 14 — medium
    [C3, 'note',  50, false],   // step 15 — ghost+
  ]),

  // 9. Arp Up-Down — Ascending 4 notes descending, slides on changes
  makePattern('builtin-sub-arp-up-down', 'Arp Up-Down', [
    [C3,  'note',  90, true ],  // step 0  — bottom, slide up
    [Eb3, 'note',  85, true ],  // step 1  — slide
    [G3,  'note',  85, true ],  // step 2  — slide
    [C4,  'note',  95, true ],  // step 3  — top, slide down
    [G3,  'note',  85, true ],  // step 4  — slide
    [Eb3, 'note',  85, true ],  // step 5  — slide
    [C3,  'note',  90, true ],  // step 6  — bottom, slide up
    [Eb3, 'note',  80, true ],  // step 7  — slide
    [G3,  'note',  80, true ],  // step 8  — slide
    [C4,  'note', 100, true ],  // step 9  — top accent, slide
    [Eb4, 'note',  95, true ],  // step 10 — higher peak, slide
    [C4,  'note',  90, true ],  // step 11 — slide back
    [G3,  'note',  85, true ],  // step 12 — slide
    [Eb3, 'note',  80, true ],  // step 13 — slide
    [C3,  'note',  90, false],  // step 14 — bottom, hold
    [C3,  'rest',  80, false],  // step 15 — rest
  ]),

  // 10. Glide Melody — Slow melody, slides every step, velocity crescendos
  makePattern('builtin-sub-glide-melody', 'Glide Melody', [
    [C3,  'note',  60, true ],  // step 0  — soft start, slide
    [D3,  'note',  65, true ],  // step 1  — slide
    [Eb3, 'note',  70, true ],  // step 2  — slide
    [F3,  'note',  75, true ],  // step 3  — slide
    [G3,  'note',  80, true ],  // step 4  — slide
    [Ab3, 'note',  85, true ],  // step 5  — slide
    [Bb3, 'note',  90, true ],  // step 6  — slide
    [C4,  'note',  95, true ],  // step 7  — slide up
    [D4,  'note', 100, true ],  // step 8  — slide, growing
    [Eb4, 'note', 105, true ],  // step 9  — slide
    [F4,  'note', 110, true ],  // step 10 — slide
    [G4,  'note', 115, true ],  // step 11 — slide
    [Ab4, 'note', 118, true ],  // step 12 — slide, near peak
    [Bb4, 'note', 122, true ],  // step 13 — slide
    [C5,  'note', 127, false],  // step 14 — peak, no slide
    [C5,  'rest', 127, false],  // step 15 — rest
  ]),

  // 11. Stutter — Rapid repeated notes with rests, velocity stutter
  makePattern('builtin-sub-stutter', 'Stutter', [
    [C3, 'note', 120, false],   // step 0  — hit
    [C3, 'rest',  80, false],   // step 1  — rest
    [C3, 'note', 100, false],   // step 2  — hit
    [C3, 'note',  60, false],   // step 3  — soft hit
    [C3, 'rest',  60, false],   // step 4  — rest
    [C3, 'note', 115, false],   // step 5  — hit
    [C3, 'rest',  60, false],   // step 6  — rest
    [C3, 'note',  50, false],   // step 7  — ghost
    [C3, 'note', 120, false],   // step 8  — hit
    [C3, 'note',  55, false],   // step 9  — ghost
    [C3, 'rest',  60, false],   // step 10 — rest
    [C3, 'note', 105, false],   // step 11 — hit
    [C3, 'note',  65, false],   // step 12 — ghost
    [C3, 'rest',  60, false],   // step 13 — rest
    [C3, 'note', 115, false],   // step 14 — hit
    [C3, 'rest',  60, false],   // step 15 — rest
  ]),

  // 12. Sparse Hits — 4-5 notes across 16 steps, high velocity, dramatic rests
  makePattern('builtin-sub-sparse-hits', 'Sparse Hits', [
    [C3,  'note', 127, false],  // step 0  — dramatic hit
    [C3,  'rest',  60, false],  // step 1
    [C3,  'rest',  60, false],  // step 2
    [C3,  'rest',  60, false],  // step 3
    [C3,  'rest',  60, false],  // step 4
    [G3,  'note', 120, false],  // step 5  — second hit
    [G3,  'rest',  60, false],  // step 6
    [G3,  'rest',  60, false],  // step 7
    [Eb4, 'note', 115, false],  // step 8  — third hit
    [Eb4, 'rest',  60, false],  // step 9
    [Eb4, 'rest',  60, false],  // step 10
    [Eb4, 'rest',  60, false],  // step 11
    [C4,  'note', 110, false],  // step 12 — fourth hit
    [C4,  'rest',  60, false],  // step 13
    [C3,  'note', 127, false],  // step 14 — final hit
    [C3,  'rest',  60, false],  // step 15
  ]),
];

// ---------------------------------------------------------------------------
// Sound presets (16)
// ---------------------------------------------------------------------------

export const DEFAULT_SUBTRACTOR_SOUND_PRESETS: SubtractorSoundPreset[] = [
  // 1. Init Patch — single saw (waveform 2), open filter, no modulation
  {
    id: 'builtin-sub-init-patch',
    name: 'Init Patch',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0,
      filter1: { cutoff: 1, resonance: 0, keyTrack: 0 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 1, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvDepth: 0,
      ampEnv: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 2. Classic Sub Bass — saw + square (waveform 3) octave -1
  {
    id: 'builtin-sub-classic-sub-bass',
    name: 'Classic Sub Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.45, resonance: 0.25, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 0.3 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.005, decay: 0.5, sustain: 0.6, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 3. Acid Lead — saw, LP24, high resonance, fast filter env
  {
    id: 'builtin-sub-acid-lead',
    name: 'Acid Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.35, resonance: 0.85, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.1 },
      filterEnvDepth: 0.9,
      ampEnv: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.15,
      volume: 0.8,
    },
  },

  // 4. FM Bell — fmAmount high, fast decay
  {
    id: 'builtin-sub-fm-bell',
    name: 'FM Bell',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 0, octave: 1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.75,
      oscMix: 0.2,
      filter1: { cutoff: 0.8, resonance: 0.1, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 1, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.6 },
      modEnv: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 5. Ring Mod Perc — ringModLevel high, short amp env, notch filter
  {
    id: 'builtin-sub-ring-mod-perc',
    name: 'Ring Mod Perc',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: 0, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0.9,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.5, keyTrack: 0.3 },
      filter1Mode: 'notch',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 6. Wobble Bass — LFO1 on filter1Cutoff via mod matrix
  {
    id: 'builtin-sub-wobble-bass',
    name: 'Wobble Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.4, resonance: 0.6, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.7, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.7 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 7. Pad Sweep — slow attack, LFO on filter cutoff
  {
    id: 'builtin-sub-pad-sweep',
    name: 'Pad Sweep',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 8, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.3, resonance: 0.2, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.6, decay: 0.5, sustain: 0.5, release: 0.7 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.6, decay: 0.5, sustain: 0.7, release: 0.8 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.3 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0.3, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 8. Pluck Bass — very short decay, resonant filter
  {
    id: 'builtin-sub-pluck-bass',
    name: 'Pluck Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.5, resonance: 0.65, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 9. Supersaw Lead — waveform 8 (supersaw), detuned osc2, bright filter
  {
    id: 'builtin-sub-supersaw-lead',
    name: 'Supersaw Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: -12, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.65, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0.1, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.35, delay: 0.2, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 10. Organ Drone — waveform 13 (Organ 1), sustained, slight vibrato
  {
    id: 'builtin-sub-organ-drone',
    name: 'Organ Drone',
    builtIn: true,
    params: {
      osc1: { waveform: 13, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 13, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.75, resonance: 0.1, keyTrack: 0.3 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
      filterEnvDepth: 0.1,
      ampEnv: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.5 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.1 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.55, delay: 0.4, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 11. Harsh Square — waveform 3, HP filter, bright and edgy
  {
    id: 'builtin-sub-harsh-square',
    name: 'Harsh Square',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 3, octave: 0, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.55, resonance: 0.4, keyTrack: 0.5 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.7, resonance: 0.2, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.25, sustain: 0.3, release: 0.2 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 12. String Pad — waveform 21 (String), slow envelope, bandpass filter
  {
    id: 'builtin-sub-string-pad',
    name: 'String Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 21, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 21, octave: 0, semitone: 0, fineTune: 10, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.15, keyTrack: 0.6 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.5, decay: 0.4, sustain: 0.6, release: 0.6 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 0.7 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.08 };
        m[1] = { source: 'lfo1', destination: 'osc2Pitch', amount: 0.08 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.5, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 13. Noise Perc — noiseLevel high, short transient
  {
    id: 'builtin-sub-noise-perc',
    name: 'Noise Perc',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      osc2: { waveform: 0, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0 },
      noiseLevel: 0.9,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0,
      filter1: { cutoff: 0.55, resonance: 0.5, keyTrack: 0 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.7, resonance: 0.2, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.08 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 14. FM Metallic — waveform 12 (FM Metallic), high fmAmount
  {
    id: 'builtin-sub-fm-metallic',
    name: 'FM Metallic',
    builtIn: true,
    params: {
      osc1: { waveform: 12, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 0, octave: 1, semitone: 4, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.6,
      oscMix: 0.3,
      filter1: { cutoff: 0.7, resonance: 0.35, keyTrack: 0.4 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.001, decay: 0.35, sustain: 0.2, release: 0.3 },
      modEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 15. Choir Stab — waveform 19 (Choir), fast attack, mod env on pitch
  {
    id: 'builtin-sub-choir-stab',
    name: 'Choir Stab',
    builtIn: true,
    params: {
      osc1: { waveform: 19, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 19, octave: 0, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.2, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.5 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.15 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 16. Glide Bass — portamento on, slow rate, saw bass
  {
    id: 'builtin-sub-glide-bass',
    name: 'Glide Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 3, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.42, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.35, sustain: 0.3, release: 0.3 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.65, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.25,
      volume: 0.85,
    },
  },
];
