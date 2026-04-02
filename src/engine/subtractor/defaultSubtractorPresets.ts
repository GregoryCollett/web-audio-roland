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

  // --- BASSES (17-36) ---

  // 17. Deep Sub Bass — sine osc1, octave -2, no filter env
  {
    id: 'builtin-sub-deep-sub',
    name: 'Deep Sub',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.9 },
      osc2: { waveform: 31, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.3, resonance: 0.1, keyTrack: 0.3 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.3 },
      filterEnvDepth: 0.2,
      ampEnv: { attack: 0.005, decay: 0.6, sustain: 0.7, release: 0.5 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.9,
    },
  },

  // 18. Acid Bass 303 — saw, lp24 resonant, fast env, portamento auto
  {
    id: 'builtin-sub-acid-bass-303',
    name: 'Acid Bass 303',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.2 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.15,
      filter1: { cutoff: 0.3, resonance: 0.9, keyTrack: 0.8 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.95, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.002, decay: 0.12, sustain: 0.05, release: 0.08 },
      filterEnvDepth: 0.95,
      ampEnv: { attack: 0.002, decay: 0.25, sustain: 0.55, release: 0.15 },
      modEnv: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 19. FM Bass — high fmAmount, short decay
  {
    id: 'builtin-sub-fm-bass',
    name: 'FM Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: -1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.85,
      oscMix: 0.4,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.3, sustain: 0.4, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 20. Reese Bass — two detuned saws, lp24
  {
    id: 'builtin-sub-reese-bass',
    name: 'Reese Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: -15, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 15, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.35, resonance: 0.4, keyTrack: 0.4 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.4 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.5, sustain: 0.7, release: 0.5 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.25 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.15, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 21. Rubber Bass — square osc, low filter, slow filter attack
  {
    id: 'builtin-sub-rubber-bass',
    name: 'Rubber Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.4, level: 0.85 },
      osc2: { waveform: 31, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.25, resonance: 0.5, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.08, decay: 0.5, sustain: 0.2, release: 0.4 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 22. Distorted Bass — supersaw, hp filter for grit, noisy
  {
    id: 'builtin-sub-distorted-bass',
    name: 'Distorted Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.9 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 25, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.1,
      ringModLevel: 0.2,
      fmAmount: 0.3,
      oscMix: 0.45,
      filter1: { cutoff: 0.55, resonance: 0.6, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.8, resonance: 0.2, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.2 },
      filterEnvDepth: 0.65,
      ampEnv: { attack: 0.005, decay: 0.35, sustain: 0.65, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'sawtooth', rate: 0.25, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 23. Pulse Bass — pulse25% waveform, mid filter
  {
    id: 'builtin-sub-pulse-bass',
    name: 'Pulse Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 4, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.25, level: 0.85 },
      osc2: { waveform: 5, octave: -1, semitone: 0, fineTune: 5, pulseWidth: 0.1, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.4, resonance: 0.55, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.003, decay: 0.2, sustain: 0.15, release: 0.15 },
      filterEnvDepth: 0.75,
      ampEnv: { attack: 0.003, decay: 0.3, sustain: 0.6, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 24. Growl Bass — LFO on filter, mid-high resonance
  {
    id: 'builtin-sub-growl-bass',
    name: 'Growl Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 7, octave: -1, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.2,
      oscMix: 0.4,
      filter1: { cutoff: 0.35, resonance: 0.7, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.25 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.65, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.55 };
        m[1] = { source: 'lfo2', destination: 'oscMix', amount: 0.2 };
        return m;
      })(),
      lfo1: { waveform: 'sawtooth', rate: 0.5, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.5, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 25. Stepped Wobble — LFO square on filter, heavy sub
  {
    id: 'builtin-sub-stepped-wobble',
    name: 'Stepped Wobble',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.3, resonance: 0.65, keyTrack: 0.4 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.4 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.005, decay: 0.5, sustain: 0.7, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.8 };
        return m;
      })(),
      lfo1: { waveform: 'square', rate: 0.35, delay: 0, keySync: false },
      lfo2: { waveform: 'triangle', rate: 0.2, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 26. Harmonic Bass — harmonic1 waveform, medium decay
  {
    id: 'builtin-sub-harmonic-bass',
    name: 'Harmonic Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 29, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 30, octave: -1, semitone: 0, fineTune: 7, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.45, resonance: 0.35, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.35, sustain: 0.3, release: 0.3 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 27. Sync Bass — SyncSaw waveform, portamento on
  {
    id: 'builtin-sub-sync-bass',
    name: 'Sync Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 9, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 9, octave: -1, semitone: 5, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.4, resonance: 0.55, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.003, decay: 0.25, sustain: 0.2, release: 0.2 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.003, decay: 0.35, sustain: 0.6, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.2,
      volume: 0.85,
    },
  },

  // 28. Ramp Bass — ramp waveform, lp12 filter
  {
    id: 'builtin-sub-ramp-bass',
    name: 'Ramp Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 7, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 7, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.4, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 0.25 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.65, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 29. Half-Saw Bass — half-saw waveform
  {
    id: 'builtin-sub-halfsaw-bass',
    name: 'Half-Saw Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 6, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.38, resonance: 0.45, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.25 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 30. Digital Bass — digital1 waveform, notch filter
  {
    id: 'builtin-sub-digital-bass',
    name: 'Digital Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 26, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 27, octave: -1, semitone: 0, fineTune: 12, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.2,
      oscMix: 0.35,
      filter1: { cutoff: 0.45, resonance: 0.5, keyTrack: 0.5 },
      filter1Mode: 'notch',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.15, release: 0.2 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.35, sustain: 0.55, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 31. Portamento Bass — gliding between notes, slow portamento
  {
    id: 'builtin-sub-porta-bass',
    name: 'Portamento Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.4, resonance: 0.35, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.35, sustain: 0.3, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.01, decay: 0.5, sustain: 0.65, release: 0.45 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.4,
      volume: 0.85,
    },
  },

  // 32. Reed Bass — reed waveform (23), warm and woody
  {
    id: 'builtin-sub-reed-bass',
    name: 'Reed Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 23, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.4, sustain: 0.7, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0.2, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.83,
    },
  },

  // 33. Moog-Style Bass — lp24, high resonance, filter env
  {
    id: 'builtin-sub-moog-bass',
    name: 'Moog-Style Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: -1, semitone: -5, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.32, resonance: 0.75, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.003, decay: 0.35, sustain: 0.1, release: 0.25 },
      filterEnvDepth: 0.85,
      ampEnv: { attack: 0.003, decay: 0.4, sustain: 0.6, release: 0.35 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.15,
      volume: 0.85,
    },
  },

  // 34. Trance Bass — supersaw, octave -1, fast filter env
  {
    id: 'builtin-sub-trance-bass',
    name: 'Trance Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: -20, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.4, resonance: 0.6, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.003, decay: 0.15, sustain: 0.1, release: 0.1 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.003, decay: 0.3, sustain: 0.6, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 35. Brass Bass — brass waveform (20), bp12 filter
  {
    id: 'builtin-sub-brass-bass',
    name: 'Brass Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 20, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 8, pulseWidth: 0.5, level: 0.35 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0.1,
      oscMix: 0.2,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.35, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.01, decay: 0.4, sustain: 0.65, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.83,
    },
  },

  // 36. Velocity Bass — velocity controls filter depth
  {
    id: 'builtin-sub-velocity-bass',
    name: 'Velocity Bass',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.3, resonance: 0.5, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.25 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.005, decay: 0.35, sustain: 0.6, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'velocity', destination: 'filterCutoff', amount: 0.6 };
        m[1] = { source: 'velocity', destination: 'ampLevel', amount: 0.4 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },


  // --- LEADS (37-56) ---

  // 37. Mono Lead — saw, lp24, fast attack
  {
    id: 'builtin-sub-mono-lead',
    name: 'Mono Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 7, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.4, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.25 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.12,
      volume: 0.8,
    },
  },

  // 38. Sync Lead — SyncSquare waveform, bright HP filter
  {
    id: 'builtin-sub-sync-lead',
    name: 'Sync Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 10, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 9, octave: 0, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.65, resonance: 0.5, keyTrack: 0.7 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.35, release: 0.2 },
      filterEnvDepth: -0.4,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.75, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.12 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.6, delay: 0.2, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 39. Detuned Lead — two saws, heavy detune
  {
    id: 'builtin-sub-detuned-lead',
    name: 'Detuned Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: -20, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 20, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.45, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 40. FM Lead — FM Bell waveform (11), high fmAmount
  {
    id: 'builtin-sub-fm-lead',
    name: 'FM Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 11, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 4, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.7,
      oscMix: 0.3,
      filter1: { cutoff: 0.7, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.35, sustain: 0.3, release: 0.25 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.3, sustain: 0.65, release: 0.3 },
      modEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'fmAmount', amount: 0.4 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 41. Screaming Lead — square, HP filter, high resonance
  {
    id: 'builtin-sub-screaming-lead',
    name: 'Screaming Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 12, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.05,
      ringModLevel: 0.15,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.7, resonance: 0.8, keyTrack: 0.8 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.2 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.15, sustain: 0.85, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.15 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.55, delay: 0.2, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.08,
      volume: 0.78,
    },
  },

  // 42. Thin Lead — pulse10%, bp filter, sharp attack
  {
    id: 'builtin-sub-thin-lead',
    name: 'Thin Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 5, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.1, level: 0.85 },
      osc2: { waveform: 5, octave: 1, semitone: 0, fineTune: 8, pulseWidth: 0.1, level: 0.3 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.5, keyTrack: 0.7 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.002, decay: 0.2, sustain: 0.3, release: 0.15 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.002, decay: 0.15, sustain: 0.75, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.25, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 43. Fat Lead — two supersaws, unison style
  {
    id: 'builtin-sub-fat-lead',
    name: 'Fat Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: -10, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: 10, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.65, resonance: 0.35, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.35, sustain: 0.55, release: 0.3 },
      filterEnvDepth: 0.45,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 44. Digital Lead — digital2 waveform, notch filter
  {
    id: 'builtin-sub-digital-lead',
    name: 'Digital Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 27, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 28, octave: 0, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.45 },
      noiseLevel: 0,
      ringModLevel: 0.1,
      fmAmount: 0.2,
      oscMix: 0.3,
      filter1: { cutoff: 0.6, resonance: 0.5, keyTrack: 0.6 },
      filter1Mode: 'notch',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.2 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.75, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.3 };
        m[1] = { source: 'lfo2', destination: 'pulseWidth', amount: 0.4 };
        return m;
      })(),
      lfo1: { waveform: 'sawtooth', rate: 0.4, delay: 0.2, keySync: true },
      lfo2: { waveform: 'triangle', rate: 0.6, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 45. Brass Lead — brass waveform (20), bp12 filter
  {
    id: 'builtin-sub-brass-lead',
    name: 'Brass Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 20, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 10, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0.1,
      oscMix: 0.25,
      filter1: { cutoff: 0.6, resonance: 0.3, keyTrack: 0.7 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 46. Glide Lead — portamento on, saw, long slide
  {
    id: 'builtin-sub-glide-lead',
    name: 'Glide Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.55, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.45, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.1 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.4, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.3,
      volume: 0.8,
    },
  },

  // 47. PWM Lead — pulse width modulated by LFO
  {
    id: 'builtin-sub-pwm-lead',
    name: 'PWM Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.6, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.45, release: 0.3 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'pulseWidth', amount: 0.6 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 48. Formant Lead — formant A waveform (16), bp filter
  {
    id: 'builtin-sub-formant-lead',
    name: 'Formant Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 16, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 17, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.55, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.45, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'oscMix', amount: 0.5 };
        return m;
      })(),
      lfo1: { waveform: 'sawtooth', rate: 0.25, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.15,
      volume: 0.78,
    },
  },

  // 49. Pluck Lead — short decay, high resonance
  {
    id: 'builtin-sub-pluck-lead',
    name: 'Pluck Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 22, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.7, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      filterEnvDepth: 0.85,
      ampEnv: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 50. Harmonic Lead — harmonic2 waveform (30), lp24
  {
    id: 'builtin-sub-harmonic-lead',
    name: 'Harmonic Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 30, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 29, octave: 0, semitone: 5, fineTune: 0, pulseWidth: 0.5, level: 0.45 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.1,
      oscMix: 0.3,
      filter1: { cutoff: 0.65, resonance: 0.35, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.45, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 51. Portamento Lead 2 — slow portamento, smooth pitch transitions
  {
    id: 'builtin-sub-porta-lead',
    name: 'Portamento Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: 0, semitone: 0, fineTune: 3, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.35, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.1 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.5, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.35,
      volume: 0.8,
    },
  },

  // 52. Ring Mod Lead — ring mod + osc detune
  {
    id: 'builtin-sub-ringmod-lead',
    name: 'Ring Mod Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 0, semitone: 5, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0.7,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.6, resonance: 0.4, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.2 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.75, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.2, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 53. Organ Lead — Organ2 waveform (14), no filter env
  {
    id: 'builtin-sub-organ-lead',
    name: 'Organ Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 14, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 15, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.75, resonance: 0.2, keyTrack: 0.4 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4 },
      filterEnvDepth: 0.15,
      ampEnv: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.4 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.4, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 54. Noise Lead — noise-bright osc, hp filter
  {
    id: 'builtin-sub-noise-lead',
    name: 'Noise Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 24, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.3,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.65, resonance: 0.55, keyTrack: 0.6 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.25, sustain: 0.35, release: 0.2 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.25 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'random', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 55. Vowel Lead — formant O waveform (18), oscMix modulated
  {
    id: 'builtin-sub-vowel-lead',
    name: 'Vowel Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 18, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 16, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'oscMix', amount: 0.7 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.12,
      volume: 0.8,
    },
  },

  // 56. Sub Octave Lead — lead + sub octave reinforcement
  {
    id: 'builtin-sub-suboctave-lead',
    name: 'Sub Octave Lead',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 31, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.55, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.3, sustain: 0.45, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },


  // --- PADS (57-71) ---

  // 57. Warm Pad — two saws, lp12, slow attack
  {
    id: 'builtin-sub-warm-pad',
    name: 'Warm Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: -6, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 6, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.4, resonance: 0.15, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.7, decay: 0.5, sustain: 0.6, release: 0.8 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.7, decay: 0.4, sustain: 0.75, release: 0.9 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.15 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.15, delay: 0.5, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 58. Dark Pad — sub waveform (31), very low cutoff
  {
    id: 'builtin-sub-dark-pad',
    name: 'Dark Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 31, octave: 0, semitone: 0, fineTune: -4, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 25, octave: 0, semitone: 0, fineTune: 4, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.22, resonance: 0.2, keyTrack: 0.4 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.8, decay: 0.6, sustain: 0.5, release: 0.9 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.6, sustain: 0, release: 0.5 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.1, delay: 0.6, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 59. Bright Pad — supersaw, open filter, shimmery
  {
    id: 'builtin-sub-bright-pad',
    name: 'Bright Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: 8, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.75, resonance: 0.2, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.6, decay: 0.5, sustain: 0.7, release: 0.8 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.5, decay: 0.4, sustain: 0.8, release: 0.9 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.06 };
        m[1] = { source: 'lfo1', destination: 'osc2Pitch', amount: 0.06 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0.4, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 60. Evolving Pad — LFO on filter and mix, random LFO
  {
    id: 'builtin-sub-evolving-pad',
    name: 'Evolving Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: -10, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 21, octave: 0, semitone: 0, fineTune: 10, pulseWidth: 0.5, level: 0.65 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.35, resonance: 0.25, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.9, decay: 0.6, sustain: 0.55, release: 1.0 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.8, decay: 0.5, sustain: 0.72, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.7, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.3 };
        m[1] = { source: 'lfo2', destination: 'oscMix', amount: 0.4 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.1, delay: 0, keySync: false },
      lfo2: { waveform: 'triangle', rate: 0.07, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 61. Choir Pad — Choir waveform (19), lp12, very slow
  {
    id: 'builtin-sub-choir-pad',
    name: 'Choir Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 19, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 19, octave: 0, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.55, resonance: 0.1, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.8, decay: 0.6, sustain: 0.6, release: 1.0 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.8, decay: 0.5, sustain: 0.75, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.6, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.05 };
        m[1] = { source: 'lfo1', destination: 'osc2Pitch', amount: 0.05 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0.6, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 62. Shimmer Pad — high octave osc2, bright, lp24
  {
    id: 'builtin-sub-shimmer-pad',
    name: 'Shimmer Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.7 },
      osc2: { waveform: 2, octave: 2, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.7, resonance: 0.15, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.7, decay: 0.5, sustain: 0.65, release: 0.9 },
      filterEnvDepth: 0.25,
      ampEnv: { attack: 0.6, decay: 0.4, sustain: 0.8, release: 1.0 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.2 };
        m[1] = { source: 'lfo2', destination: 'osc2Pitch', amount: 0.08 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.18, delay: 0.4, keySync: false },
      lfo2: { waveform: 'sawtooth', rate: 0.12, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 63. Analog Pad — triangle osc, warm lp12, gentle vibrato
  {
    id: 'builtin-sub-analog-pad',
    name: 'Analog Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 1, octave: 0, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 1, octave: 0, semitone: 0, fineTune: 8, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.45, resonance: 0.2, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.7, decay: 0.5, sustain: 0.55, release: 0.9 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.7, decay: 0.4, sustain: 0.75, release: 0.9 },
      modEnv: { attack: 0.4, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.07 };
        m[1] = { source: 'lfo1', destination: 'osc2Pitch', amount: 0.07 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0.5, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 64. Brass Pad — brass waveform (20), bp12, slow
  {
    id: 'builtin-sub-brass-pad',
    name: 'Brass Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 20, octave: 0, semitone: 0, fineTune: -6, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 20, octave: 0, semitone: 0, fineTune: 6, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0.05,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.2, keyTrack: 0.5 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.5, decay: 0.5, sustain: 0.55, release: 0.8 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.5, decay: 0.4, sustain: 0.75, release: 0.9 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.35, delay: 0.5, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 65. FM Pad — FM Bell waveform (11), evolving FM
  {
    id: 'builtin-sub-fm-pad',
    name: 'FM Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 11, octave: 0, semitone: 0, fineTune: -4, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 11, octave: 0, semitone: 7, fineTune: 4, pulseWidth: 0.5, level: 0.65 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.4,
      oscMix: 0.45,
      filter1: { cutoff: 0.6, resonance: 0.15, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.8, decay: 0.6, sustain: 0.5, release: 1.0 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.7, decay: 0.5, sustain: 0.7, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.7, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'fmAmount', amount: 0.3 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.12, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 66. Pluck Pad — pluck waveform (22), medium attack
  {
    id: 'builtin-sub-pluck-pad',
    name: 'Pluck Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 22, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 22, octave: 0, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.65 },
      noiseLevel: 0.02,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.3, decay: 0.4, sustain: 0.4, release: 0.7 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 0.8 },
      modEnv: { attack: 0.2, decay: 0.4, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0.4, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 67. Spectral Pad — digital3 waveform (28), hp12 filter, eerie
  {
    id: 'builtin-sub-spectral-pad',
    name: 'Spectral Pad',
    builtIn: true,
    params: {
      osc1: { waveform: 28, octave: 0, semitone: 0, fineTune: -7, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 26, octave: 0, semitone: 5, fineTune: 7, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.05,
      ringModLevel: 0.1,
      fmAmount: 0.15,
      oscMix: 0.45,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.5 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.9, decay: 0.7, sustain: 0.5, release: 1.0 },
      filterEnvDepth: -0.3,
      ampEnv: { attack: 0.8, decay: 0.5, sustain: 0.65, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.7, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.2 };
        m[1] = { source: 'lfo2', destination: 'osc1Pitch', amount: 0.06 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.08, delay: 0, keySync: false },
      lfo2: { waveform: 'triangle', rate: 0.25, delay: 0.3, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.68,
    },
  },


  // --- KEYS (68-77) ---

  // 68. Electric Piano — pluck waveform (22), short decay
  {
    id: 'builtin-sub-electric-piano',
    name: 'Electric Piano',
    builtIn: true,
    params: {
      osc1: { waveform: 22, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0.25,
      oscMix: 0.2,
      filter1: { cutoff: 0.65, resonance: 0.2, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.3, sustain: 0.2, release: 0.3 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.001, decay: 0.5, sustain: 0.3, release: 0.5 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 69. Full Organ — Organ3 waveform (15), sustained, no filter env
  {
    id: 'builtin-sub-full-organ',
    name: 'Full Organ',
    builtIn: true,
    params: {
      osc1: { waveform: 15, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 13, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.8, resonance: 0.1, keyTrack: 0.3 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.3 },
      filterEnvDepth: 0.05,
      ampEnv: { attack: 0.01, decay: 0.05, sustain: 0.95, release: 0.3 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 70. Mallet — sine + harmonic1 (29), medium decay
  {
    id: 'builtin-sub-mallet',
    name: 'Mallet',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 29, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.55 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0.3,
      oscMix: 0.3,
      filter1: { cutoff: 0.7, resonance: 0.2, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.25, sustain: 0.15, release: 0.2 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.3 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 71. Vibraphone — sine, slight FM, tremolo via LFO on amp
  {
    id: 'builtin-sub-vibraphone',
    name: 'Vibraphone',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 5, fineTune: 0, pulseWidth: 0.5, level: 0.35 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.15,
      oscMix: 0.2,
      filter1: { cutoff: 0.8, resonance: 0.1, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.4 },
      filterEnvDepth: 0.2,
      ampEnv: { attack: 0.001, decay: 0.6, sustain: 0.15, release: 0.6 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'ampLevel', amount: 0.35 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.6, delay: 0.2, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 72. Harpsichord — short sharp pluck, no sustain
  {
    id: 'builtin-sub-harpsichord',
    name: 'Harpsichord',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 22, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.6, resonance: 0.4, keyTrack: 0.8 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 73. Clav — Clav-like punch, short decay, high resonance
  {
    id: 'builtin-sub-clav',
    name: 'Clav',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.35, level: 0.85 },
      osc2: { waveform: 22, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.45 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.55, resonance: 0.7, keyTrack: 0.7 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.12 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 74. Tine Piano — FM Bell (11), slow release, key-tracked
  {
    id: 'builtin-sub-tine-piano',
    name: 'Tine Piano',
    builtIn: true,
    params: {
      osc1: { waveform: 11, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.5,
      oscMix: 0.25,
      filter1: { cutoff: 0.7, resonance: 0.15, keyTrack: 0.8 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.4, sustain: 0.15, release: 0.5 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.001, decay: 0.6, sustain: 0.2, release: 0.7 },
      modEnv: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 75. Drawbar Organ — Organ1 (13) + Organ2 (14) stacked
  {
    id: 'builtin-sub-drawbar-organ',
    name: 'Drawbar Organ',
    builtIn: true,
    params: {
      osc1: { waveform: 13, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 14, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.85, resonance: 0.1, keyTrack: 0.3 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.2 },
      filterEnvDepth: 0.05,
      ampEnv: { attack: 0.01, decay: 0.05, sustain: 0.95, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.5, delay: 0.3, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 76. Bell Tower — FM Metallic (12) + sine, short decay
  {
    id: 'builtin-sub-bell-tower',
    name: 'Bell Tower',
    builtIn: true,
    params: {
      osc1: { waveform: 12, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.45 },
      noiseLevel: 0,
      ringModLevel: 0.3,
      fmAmount: 0.55,
      oscMix: 0.25,
      filter1: { cutoff: 0.75, resonance: 0.2, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.5, sustain: 0.05, release: 0.4 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.001, decay: 0.7, sustain: 0.05, release: 0.7 },
      modEnv: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.25 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 77. Crystal Keys — Harmonic1 (29), lp24, glassy
  {
    id: 'builtin-sub-crystal-keys',
    name: 'Crystal Keys',
    builtIn: true,
    params: {
      osc1: { waveform: 29, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 2, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.2,
      oscMix: 0.2,
      filter1: { cutoff: 0.75, resonance: 0.25, keyTrack: 0.8 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.35, sustain: 0.1, release: 0.35 },
      filterEnvDepth: 0.45,
      ampEnv: { attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.5 },
      modEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },


  // --- FX / TEXTURES (78-92) ---

  // 78. Filter Sweep Up — rising filter from dark to bright
  {
    id: 'builtin-sub-filter-sweep-up',
    name: 'Filter Sweep Up',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.05, resonance: 0.5, keyTrack: 0.3 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 0.5 },
      filterEnvDepth: 0.95,
      ampEnv: { attack: 0.3, decay: 0.5, sustain: 0.85, release: 0.8 },
      modEnv: { attack: 0.5, decay: 0.5, sustain: 0, release: 0.5 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 79. White Noise Sweep — noise-bright (24) + noise-dark (25), HP filtered
  {
    id: 'builtin-sub-noise-sweep',
    name: 'Noise Sweep',
    builtIn: true,
    params: {
      osc1: { waveform: 24, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      osc2: { waveform: 25, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.8,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.2, resonance: 0.6, keyTrack: 0 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 0.8 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.5, decay: 0.5, sustain: 0.75, release: 0.8 },
      modEnv: { attack: 0.5, decay: 0.5, sustain: 0, release: 0.5 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.15, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 80. Metallic Drone — FM Metallic (12), high fm, notch filter
  {
    id: 'builtin-sub-metallic-drone',
    name: 'Metallic Drone',
    builtIn: true,
    params: {
      osc1: { waveform: 12, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 12, octave: 0, semitone: 5, fineTune: 12, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.1,
      ringModLevel: 0.4,
      fmAmount: 0.7,
      oscMix: 0.45,
      filter1: { cutoff: 0.5, resonance: 0.5, keyTrack: 0.3 },
      filter1Mode: 'notch',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 0.8 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.3, decay: 0.4, sustain: 0.8, release: 1.0 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.3 };
        m[1] = { source: 'lfo2', destination: 'fmAmount', amount: 0.2 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.07, delay: 0, keySync: false },
      lfo2: { waveform: 'triangle', rate: 0.13, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 81. Glitch FX — random LFO on pitch and filter, digital waveform
  {
    id: 'builtin-sub-glitch-fx',
    name: 'Glitch FX',
    builtIn: true,
    params: {
      osc1: { waveform: 26, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 27, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.2,
      ringModLevel: 0.3,
      fmAmount: 0.4,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.6, keyTrack: 0.3 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.8, resonance: 0.2, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.2, sustain: 0.5, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.5 };
        m[1] = { source: 'lfo2', destination: 'filterCutoff', amount: 0.6 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.8, delay: 0, keySync: false },
      lfo2: { waveform: 'random', rate: 0.6, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 82. Atmospheric Drone — slow formant evolution, very long envelope
  {
    id: 'builtin-sub-atmospheric-drone',
    name: 'Atmospheric Drone',
    builtIn: true,
    params: {
      osc1: { waveform: 16, octave: 0, semitone: 0, fineTune: -3, pulseWidth: 0.5, level: 0.7 },
      osc2: { waveform: 18, octave: 0, semitone: 7, fineTune: 3, pulseWidth: 0.5, level: 0.65 },
      noiseLevel: 0.08,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.3, resonance: 0.2, keyTrack: 0.3 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 1.0, decay: 0.8, sustain: 0.5, release: 1.0 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 1.0, decay: 0.5, sustain: 0.7, release: 1.0 },
      modEnv: { attack: 0.8, decay: 0.8, sustain: 0, release: 0.6 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'oscMix', amount: 0.5 };
        m[1] = { source: 'lfo2', destination: 'filterCutoff', amount: 0.2 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.05, delay: 0, keySync: false },
      lfo2: { waveform: 'sawtooth', rate: 0.08, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.68,
    },
  },

  // 83. Riser Sweep — low to high filter + pitch LFO
  {
    id: 'builtin-sub-riser',
    name: 'Riser',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: -10, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: 10, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.1,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.1, resonance: 0.4, keyTrack: 0.2 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 1.0, decay: 0.3, sustain: 1.0, release: 0.5 },
      filterEnvDepth: 0.9,
      ampEnv: { attack: 0.8, decay: 0.3, sustain: 0.85, release: 0.6 },
      modEnv: { attack: 0.8, decay: 0.5, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.3 };
        m[1] = { source: 'modEnv', destination: 'osc2Pitch', amount: 0.3 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.2, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 84. Dark Noise Texture — NoiseDark (25), slow LFO on filter
  {
    id: 'builtin-sub-dark-texture',
    name: 'Dark Texture',
    builtIn: true,
    params: {
      osc1: { waveform: 25, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      osc2: { waveform: 25, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.9,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.2, resonance: 0.4, keyTrack: 0 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.8, decay: 0.6, sustain: 0.5, release: 0.9 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.7, decay: 0.5, sustain: 0.8, release: 1.0 },
      modEnv: { attack: 0.5, decay: 0.6, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.25 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.06, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.68,
    },
  },

  // 85. Sci-Fi Zap — short digital burst, FM
  {
    id: 'builtin-sub-scifi-zap',
    name: 'Sci-Fi Zap',
    builtIn: true,
    params: {
      osc1: { waveform: 28, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 26, octave: 2, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.1,
      ringModLevel: 0.5,
      fmAmount: 0.8,
      oscMix: 0.4,
      filter1: { cutoff: 0.6, resonance: 0.7, keyTrack: 0.5 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.5 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 86. Windswept — noise + formant, slow filter LFO
  {
    id: 'builtin-sub-windswept',
    name: 'Windswept',
    builtIn: true,
    params: {
      osc1: { waveform: 17, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      osc2: { waveform: 24, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.6,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.35, resonance: 0.3, keyTrack: 0.2 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.7, decay: 0.6, sustain: 0.5, release: 0.9 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.6, decay: 0.5, sustain: 0.75, release: 0.9 },
      modEnv: { attack: 0.5, decay: 0.6, sustain: 0, release: 0.5 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.35 };
        m[1] = { source: 'lfo2', destination: 'ampLevel', amount: 0.15 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.08, delay: 0, keySync: false },
      lfo2: { waveform: 'random', rate: 0.12, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.68,
    },
  },

  // 87. Stutter FX — fast square LFO on amp, short notes
  {
    id: 'builtin-sub-stutter-fx',
    name: 'Stutter FX',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.1,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.55, resonance: 0.5, keyTrack: 0.5 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.15 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.2 },
      modEnv: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.15 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'ampLevel', amount: 0.8 };
        return m;
      })(),
      lfo1: { waveform: 'square', rate: 0.85, delay: 0, keySync: false },
      lfo2: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.75,
    },
  },

  // 88. Tape Hiss — dark noise texture with subtle pitch variation
  {
    id: 'builtin-sub-tape-hiss',
    name: 'Tape Hiss',
    builtIn: true,
    params: {
      osc1: { waveform: 25, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      osc2: { waveform: 24, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.85,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.2, keyTrack: 0 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 0.8 },
      filterEnvDepth: 0.2,
      ampEnv: { attack: 0.5, decay: 0.4, sustain: 0.8, release: 0.9 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'filterCutoff', amount: 0.1 };
        return m;
      })(),
      lfo1: { waveform: 'random', rate: 0.15, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.6,
    },
  },

  // 89. Resonant Sweep — high resonance, filter sweep
  {
    id: 'builtin-sub-resonant-sweep',
    name: 'Resonant Sweep',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: -15, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.4,
      filter1: { cutoff: 0.1, resonance: 0.9, keyTrack: 0.3 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.9, decay: 0.5, sustain: 0.7, release: 0.8 },
      filterEnvDepth: 0.85,
      ampEnv: { attack: 0.3, decay: 0.4, sustain: 0.8, release: 0.8 },
      modEnv: { attack: 0.5, decay: 0.5, sustain: 0, release: 0.5 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.15, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.72,
    },
  },

  // 90. Laser Zap — fast pitch envelope, high fm
  {
    id: 'builtin-sub-laser-zap',
    name: 'Laser Zap',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.5,
      oscMix: 0.2,
      filter1: { cutoff: 0.7, resonance: 0.5, keyTrack: 0.5 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      modEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.7 };
        m[1] = { source: 'modEnv', destination: 'osc2Pitch', amount: 0.7 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.78,
    },
  },

  // 91. Alien Choir — Choir + ring mod, eerie vibrato
  {
    id: 'builtin-sub-alien-choir',
    name: 'Alien Choir',
    builtIn: true,
    params: {
      osc1: { waveform: 19, octave: 0, semitone: 0, fineTune: -7, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 19, octave: 0, semitone: 0, fineTune: 7, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0.05,
      ringModLevel: 0.5,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.5, resonance: 0.3, keyTrack: 0.4 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 0.8 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 0.5, decay: 0.4, sustain: 0.7, release: 0.9 },
      modEnv: { attack: 0.3, decay: 0.5, sustain: 0, release: 0.4 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'lfo1', destination: 'osc1Pitch', amount: 0.15 };
        m[1] = { source: 'lfo1', destination: 'osc2Pitch', amount: -0.15 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.25, delay: 0.4, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.7,
    },
  },

  // 92. Detuned Drone — portamento on, extremely slow, dark
  {
    id: 'builtin-sub-detuned-drone',
    name: 'Detuned Drone',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: -1, semitone: 0, fineTune: -30, pulseWidth: 0.5, level: 0.75 },
      osc2: { waveform: 2, octave: -1, semitone: 0, fineTune: 30, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.25, resonance: 0.3, keyTrack: 0.3 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.85, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 1.0, decay: 0.7, sustain: 0.6, release: 1.0 },
      filterEnvDepth: 0.3,
      ampEnv: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 1.0 },
      modEnv: { attack: 0.7, decay: 0.7, sustain: 0, release: 0.6 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.06, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'on',
      portamentoRate: 0.5,
      volume: 0.7,
    },
  },


  // --- PERCUSSIVE (93-102) ---

  // 93. Synth Kick — sine + sub, fast pitch env
  {
    id: 'builtin-sub-synth-kick',
    name: 'Synth Kick',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.9 },
      osc2: { waveform: 31, octave: -2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.1,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.3,
      filter1: { cutoff: 0.4, resonance: 0.2, keyTrack: 0 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.8 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.9,
    },
  },

  // 94. Tom Synth — pitched drum, mid resonance
  {
    id: 'builtin-sub-tom-synth',
    name: 'Tom Synth',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.15,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.5, resonance: 0.4, keyTrack: 0.3 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.25 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.5 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 95. Click Perc — very short, digital
  {
    id: 'builtin-sub-click-perc',
    name: 'Click Perc',
    builtIn: true,
    params: {
      osc1: { waveform: 26, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 24, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.4,
      ringModLevel: 0.3,
      fmAmount: 0.3,
      oscMix: 0.4,
      filter1: { cutoff: 0.7, resonance: 0.4, keyTrack: 0 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.03 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
      modEnv: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 96. FM Drum — FM Metallic (12) + noise, pitched hit
  {
    id: 'builtin-sub-fm-drum',
    name: 'FM Drum',
    builtIn: true,
    params: {
      osc1: { waveform: 12, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: -1, semitone: 3, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      noiseLevel: 0.25,
      ringModLevel: 0,
      fmAmount: 0.7,
      oscMix: 0.3,
      filter1: { cutoff: 0.5, resonance: 0.4, keyTrack: 0.2 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
      filterEnvDepth: 0.65,
      ampEnv: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.18 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.45 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 97. Snare Synth — noise + square, short
  {
    id: 'builtin-sub-snare-synth',
    name: 'Snare Synth',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.5 },
      osc2: { waveform: 24, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.6 },
      noiseLevel: 0.7,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.35,
      filter1: { cutoff: 0.55, resonance: 0.35, keyTrack: 0 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.07 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 98. Cowbell Synth — ring mod, square, notch filter
  {
    id: 'builtin-sub-cowbell-synth',
    name: 'Cowbell Synth',
    builtIn: true,
    params: {
      osc1: { waveform: 3, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 3, octave: 1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.8 },
      noiseLevel: 0,
      ringModLevel: 0.8,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.65, resonance: 0.5, keyTrack: 0.2 },
      filter1Mode: 'notch',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 99. Perc Pluck — pluck waveform (22), very short, pitched
  {
    id: 'builtin-sub-perc-pluck',
    name: 'Perc Pluck',
    builtIn: true,
    params: {
      osc1: { waveform: 22, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.1,
      ringModLevel: 0,
      fmAmount: 0.2,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.5, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      filterEnvDepth: 0.75,
      ampEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 100. Metallic Hit — FM Metallic (12), ring mod, sharp transient
  {
    id: 'builtin-sub-metallic-hit',
    name: 'Metallic Hit',
    builtIn: true,
    params: {
      osc1: { waveform: 12, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 12, octave: 0, semitone: 4, fineTune: 0, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0.05,
      ringModLevel: 0.6,
      fmAmount: 0.55,
      oscMix: 0.45,
      filter1: { cutoff: 0.65, resonance: 0.45, keyTrack: 0.3 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 101. Zap Drum — SyncSaw, hp filter, ultra-short
  {
    id: 'builtin-sub-zap-drum',
    name: 'Zap Drum',
    builtIn: true,
    params: {
      osc1: { waveform: 9, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.2,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.55, keyTrack: 0.2 },
      filter1Mode: 'hp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modEnv: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.6 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },

  // 102. Body Drum — sine + noise, bodied mid punch
  {
    id: 'builtin-sub-body-drum',
    name: 'Body Drum',
    builtIn: true,
    params: {
      osc1: { waveform: 0, octave: -1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 1, octave: -1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.3,
      ringModLevel: 0,
      fmAmount: 0.1,
      oscMix: 0.25,
      filter1: { cutoff: 0.45, resonance: 0.45, keyTrack: 0.2 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
      filterEnvDepth: 0.6,
      ampEnv: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.22 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: (() => {
        const m = createEmptyModMatrix();
        m[0] = { source: 'modEnv', destination: 'osc1Pitch', amount: 0.4 };
        return m;
      })(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.85,
    },
  },


  // --- ARPEGGIO-FRIENDLY (103-116) ---

  // 103. Arp Stab — short gate, bright, punchy
  {
    id: 'builtin-sub-arp-stab',
    name: 'Arp Stab',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 3, octave: 0, semitone: 0, fineTune: 3, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.6, resonance: 0.55, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.08 },
      filterEnvDepth: 0.85,
      ampEnv: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 104. Arp Bell — FM Bell (11), medium decay
  {
    id: 'builtin-sub-arp-bell',
    name: 'Arp Bell',
    builtIn: true,
    params: {
      osc1: { waveform: 11, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 7, fineTune: 0, pulseWidth: 0.5, level: 0.55 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.6,
      oscMix: 0.25,
      filter1: { cutoff: 0.75, resonance: 0.2, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.2 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.35 },
      modEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.12 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 105. Arp Pluck — pluck waveform, key synced LFO
  {
    id: 'builtin-sub-arp-pluck',
    name: 'Arp Pluck',
    builtIn: true,
    params: {
      osc1: { waveform: 22, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 22, octave: 1, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.35 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.65, resonance: 0.5, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.15 },
      modEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 106. Arp Marimba — harmonic1 (29), short decay
  {
    id: 'builtin-sub-arp-marimba',
    name: 'Arp Marimba',
    builtIn: true,
    params: {
      osc1: { waveform: 29, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0.03,
      ringModLevel: 0,
      fmAmount: 0.15,
      oscMix: 0.2,
      filter1: { cutoff: 0.7, resonance: 0.2, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.12 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 107. Arp Zap — SyncSaw (9), very short
  {
    id: 'builtin-sub-arp-zap',
    name: 'Arp Zap',
    builtIn: true,
    params: {
      osc1: { waveform: 9, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 10, octave: 0, semitone: 5, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0.2,
      fmAmount: 0.2,
      oscMix: 0.3,
      filter1: { cutoff: 0.65, resonance: 0.55, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      filterEnvDepth: 0.8,
      ampEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modEnv: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 108. Arp Organ — organ waveform (13), short gate
  {
    id: 'builtin-sub-arp-organ',
    name: 'Arp Organ',
    builtIn: true,
    params: {
      osc1: { waveform: 13, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 14, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.75, resonance: 0.2, keyTrack: 0.5 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.12, sustain: 0.4, release: 0.1 },
      filterEnvDepth: 0.35,
      ampEnv: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.12 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 109. Arp Glass — digital2 (27), resonant, short decay
  {
    id: 'builtin-sub-arp-glass',
    name: 'Arp Glass',
    builtIn: true,
    params: {
      osc1: { waveform: 27, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 2, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.2,
      oscMix: 0.15,
      filter1: { cutoff: 0.7, resonance: 0.4, keyTrack: 0.8 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.15, sustain: 0.05, release: 0.12 },
      filterEnvDepth: 0.5,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0.05, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 110. Arp String — string waveform (21), medium decay
  {
    id: 'builtin-sub-arp-string',
    name: 'Arp String',
    builtIn: true,
    params: {
      osc1: { waveform: 21, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 21, octave: 1, semitone: 0, fineTune: 7, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.6, resonance: 0.25, keyTrack: 0.6 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
      filterEnvDepth: 0.45,
      ampEnv: { attack: 0.01, decay: 0.25, sustain: 0.2, release: 0.25 },
      modEnv: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.12 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.4, delay: 0.2, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 111. Arp Portamento — glide arp with auto portamento
  {
    id: 'builtin-sub-arp-porta',
    name: 'Arp Portamento',
    builtIn: true,
    params: {
      osc1: { waveform: 2, octave: 0, semitone: 0, fineTune: -5, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 2, octave: 0, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.65 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.45,
      filter1: { cutoff: 0.55, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.15 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2 },
      modEnv: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.12 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'auto',
      portamentoRate: 0.18,
      volume: 0.82,
    },
  },

  // 112. Arp Pulse — pulse10% (5), short, bright
  {
    id: 'builtin-sub-arp-pulse',
    name: 'Arp Pulse',
    builtIn: true,
    params: {
      osc1: { waveform: 5, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.1, level: 0.85 },
      osc2: { waveform: 4, octave: 0, semitone: 7, fineTune: 0, pulseWidth: 0.25, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.25,
      filter1: { cutoff: 0.65, resonance: 0.5, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.08 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.15, sustain: 0.15, release: 0.12 },
      modEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },


  // 113. Arp Supersaw — supersaw, detuned, short decay
  {
    id: 'builtin-sub-arp-supersaw',
    name: 'Arp Supersaw',
    builtIn: true,
    params: {
      osc1: { waveform: 8, octave: 0, semitone: 0, fineTune: -8, pulseWidth: 0.5, level: 0.8 },
      osc2: { waveform: 8, octave: 0, semitone: 0, fineTune: 8, pulseWidth: 0.5, level: 0.75 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.6, resonance: 0.4, keyTrack: 0.6 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.12, sustain: 0.1, release: 0.1 },
      filterEnvDepth: 0.7,
      ampEnv: { attack: 0.001, decay: 0.18, sustain: 0.1, release: 0.15 },
      modEnv: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 114. Arp Choir — choir waveform (19), short gate
  {
    id: 'builtin-sub-arp-choir',
    name: 'Arp Choir',
    builtIn: true,
    params: {
      osc1: { waveform: 19, octave: 0, semitone: 0, fineTune: -4, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 19, octave: 0, semitone: 0, fineTune: 4, pulseWidth: 0.5, level: 0.7 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.5,
      filter1: { cutoff: 0.65, resonance: 0.2, keyTrack: 0.6 },
      filter1Mode: 'lp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.12 },
      filterEnvDepth: 0.4,
      ampEnv: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.18 },
      modEnv: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.8,
    },
  },

  // 115. Arp Reed — reed waveform (23), woody short notes
  {
    id: 'builtin-sub-arp-reed',
    name: 'Arp Reed',
    builtIn: true,
    params: {
      osc1: { waveform: 23, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 0, octave: 1, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.3 },
      noiseLevel: 0.05,
      ringModLevel: 0,
      fmAmount: 0,
      oscMix: 0.2,
      filter1: { cutoff: 0.6, resonance: 0.35, keyTrack: 0.7 },
      filter1Mode: 'bp12',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.005, decay: 0.12, sustain: 0.1, release: 0.1 },
      filterEnvDepth: 0.55,
      ampEnv: { attack: 0.005, decay: 0.18, sustain: 0.15, release: 0.15 },
      modEnv: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.08 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },

  // 116. Arp Harmonic — harmonic2 (30), medium decay, key-synced
  {
    id: 'builtin-sub-arp-harmonic',
    name: 'Arp Harmonic',
    builtIn: true,
    params: {
      osc1: { waveform: 30, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.85 },
      osc2: { waveform: 29, octave: 1, semitone: 0, fineTune: 5, pulseWidth: 0.5, level: 0.4 },
      noiseLevel: 0,
      ringModLevel: 0,
      fmAmount: 0.1,
      oscMix: 0.25,
      filter1: { cutoff: 0.65, resonance: 0.3, keyTrack: 0.7 },
      filter1Mode: 'lp24',
      filter2: { cutoff: 0.9, resonance: 0, keyTrack: 0 },
      filterEnv: { attack: 0.001, decay: 0.18, sustain: 0.1, release: 0.15 },
      filterEnvDepth: 0.45,
      ampEnv: { attack: 0.001, decay: 0.25, sustain: 0.1, release: 0.2 },
      modEnv: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modMatrix: createEmptyModMatrix(),
      lfo1: { waveform: 'triangle', rate: 0.3, delay: 0, keySync: true },
      lfo2: { waveform: 'square', rate: 0.3, delay: 0, keySync: false },
      portamentoMode: 'off',
      portamentoRate: 0.1,
      volume: 0.82,
    },
  },



];
