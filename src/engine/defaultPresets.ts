import type { PatternPreset, KitPreset, InstrumentId, InstrumentParams } from './types';
import { INSTRUMENT_IDS, NUM_STEPS, TUNABLE_INSTRUMENTS } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function patternPreset(
  id: string,
  name: string,
  bpm: number,
  active: Partial<Record<InstrumentId, number[]>>,
  accentSteps: number[] = [],
): PatternPreset {
  const steps = {} as Record<InstrumentId, boolean[]>;
  for (const inst of INSTRUMENT_IDS) {
    steps[inst] = new Array(NUM_STEPS).fill(false);
  }
  for (const inst of INSTRUMENT_IDS) {
    const indices = active[inst];
    if (indices) {
      for (const i of indices) {
        steps[inst][i] = true;
      }
    }
  }
  const accents = new Array(NUM_STEPS).fill(false);
  for (const i of accentSteps) {
    accents[i] = true;
  }
  return { id, name, builtIn: true, bpm, steps, accents };
}

function kitPreset(
  id: string,
  name: string,
  params: Partial<Record<InstrumentId, { level?: number; decay?: number; tune?: number }>>,
): KitPreset {
  const instruments = {} as Record<InstrumentId, InstrumentParams>;
  for (const inst of INSTRUMENT_IDS) {
    const defaults: InstrumentParams = {
      level: 0.8,
      decay: 0.5,
      ...(TUNABLE_INSTRUMENTS.has(inst) ? { tune: 0.5 } : {}),
    };
    const overrides = params[inst] ?? {};
    instruments[inst] = { ...defaults, ...overrides };
  }
  return { id, name, builtIn: true, instruments };
}

// All 16 steps helper
const ALL_STEPS: number[] = Array.from({ length: NUM_STEPS }, (_, i) => i);

// ---------------------------------------------------------------------------
// Pattern Presets
// ---------------------------------------------------------------------------

export const DEFAULT_PATTERN_PRESETS: PatternPreset[] = [
  patternPreset(
    'builtin-four-on-the-floor',
    'Four on the Floor',
    124,
    {
      kick:      [0, 4, 8, 12],
      clap:      [4, 12],
      closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
      openHat:   [2, 6, 10, 14],
    },
    [0, 4, 8, 12],
  ),

  patternPreset(
    'builtin-techno-drive',
    'Techno Drive',
    130,
    {
      kick:      [0, 2, 4, 6, 8, 10, 12, 14],
      rimshot:   [3, 11],
      closedHat: [0, 4, 8, 12],
      crash:     [0],
    },
    [0, 8],
  ),

  patternPreset(
    'builtin-boom-bap',
    'Boom Bap',
    90,
    {
      kick:      [0, 5],
      snare:     [4, 12],
      closedHat: [0, 2, 4, 6, 8, 10, 14],
      openHat:   [12],
    },
    [0, 4, 12],
  ),

  patternPreset(
    'builtin-electro-funk',
    'Electro Funk',
    115,
    {
      kick:      [0, 3, 6, 10],
      clap:      [4, 12],
      closedHat: ALL_STEPS,
      rimshot:   [2, 8, 14],
    },
    [0, 2, 4, 8, 12, 14],
  ),

  patternPreset(
    'builtin-breakbeat',
    'Breakbeat',
    135,
    {
      kick:      [0, 4, 9, 13],
      snare:     [4, 12],
      closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
      openHat:   [7, 15],
    },
    [0, 4, 9, 12],
  ),

  patternPreset(
    'builtin-minimal-pulse',
    'Minimal Pulse',
    122,
    {
      kick:      [0, 8],
      clap:      [12],
      closedHat: ALL_STEPS,
    },
    [0],
  ),

  patternPreset(
    'builtin-latin-percussion',
    'Latin Percussion',
    110,
    {
      rimshot:   [0, 3, 6, 10, 12],
      lowTom:    [4, 14],
      midTom:    [2, 8],
      hiTom:     [0, 6, 12],
      closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
    },
    [0, 6, 12],
  ),
];

// ---------------------------------------------------------------------------
// Kit Presets
// ---------------------------------------------------------------------------

export const DEFAULT_KIT_PRESETS: KitPreset[] = [
  kitPreset(
    'builtin-classic-909',
    'Classic 909',
    {}, // all defaults
  ),

  kitPreset(
    'builtin-punchy',
    'Punchy',
    {
      kick:      { level: 1.0, decay: 0.2, tune: 0.5 },
      snare:     { level: 1.0, decay: 0.25, tune: 0.5 },
      clap:      { level: 0.95, decay: 0.2 },
      rimshot:   { level: 0.9, decay: 0.2 },
      closedHat: { level: 0.9, decay: 0.2 },
      openHat:   { level: 0.9, decay: 0.25 },
      lowTom:    { level: 0.95, decay: 0.3, tune: 0.5 },
      midTom:    { level: 0.95, decay: 0.3, tune: 0.5 },
      hiTom:     { level: 0.95, decay: 0.3, tune: 0.5 },
      crash:     { level: 0.9, decay: 0.25 },
      ride:      { level: 0.9, decay: 0.25 },
    },
  ),

  kitPreset(
    'builtin-deep',
    'Deep',
    {
      kick:      { level: 0.95, decay: 0.8, tune: 0.3 },
      snare:     { level: 0.85, decay: 0.6, tune: 0.4 },
      clap:      { level: 0.8, decay: 0.65 },
      rimshot:   { level: 0.75, decay: 0.6 },
      closedHat: { level: 0.5, decay: 0.5 },
      openHat:   { level: 0.5, decay: 0.55 },
      lowTom:    { level: 0.9, decay: 0.75, tune: 0.3 },
      midTom:    { level: 0.88, decay: 0.7, tune: 0.32 },
      hiTom:     { level: 0.85, decay: 0.65, tune: 0.35 },
      crash:     { level: 0.75, decay: 0.7 },
      ride:      { level: 0.7, decay: 0.65 },
    },
  ),

  kitPreset(
    'builtin-crispy',
    'Crispy',
    {
      kick:      { level: 0.9, decay: 0.2, tune: 0.55 },
      snare:     { level: 0.9, decay: 0.15, tune: 0.7 },
      clap:      { level: 0.85, decay: 0.15 },
      rimshot:   { level: 0.85, decay: 0.15 },
      closedHat: { level: 0.9, decay: 0.15 },
      openHat:   { level: 0.9, decay: 0.2 },
      lowTom:    { level: 0.85, decay: 0.2, tune: 0.55 },
      midTom:    { level: 0.85, decay: 0.18, tune: 0.58 },
      hiTom:     { level: 0.85, decay: 0.15, tune: 0.6 },
      crash:     { level: 0.9, decay: 0.2 },
      ride:      { level: 0.9, decay: 0.2 },
    },
  ),

  kitPreset(
    'builtin-lofi',
    'Lo-Fi',
    {
      kick:      { level: 0.5, decay: 0.75, tune: 0.38 },
      snare:     { level: 0.48, decay: 0.7, tune: 0.35 },
      clap:      { level: 0.45, decay: 0.65 },
      rimshot:   { level: 0.42, decay: 0.65 },
      closedHat: { level: 0.4, decay: 0.7 },
      openHat:   { level: 0.4, decay: 0.75 },
      lowTom:    { level: 0.52, decay: 0.8, tune: 0.37 },
      midTom:    { level: 0.5, decay: 0.78, tune: 0.36 },
      hiTom:     { level: 0.48, decay: 0.75, tune: 0.35 },
      crash:     { level: 0.55, decay: 0.8 },
      ride:      { level: 0.55, decay: 0.78 },
    },
  ),

  kitPreset(
    'builtin-percussion-heavy',
    'Percussion Heavy',
    {
      kick:      { level: 0.5, decay: 0.5, tune: 0.5 },
      snare:     { level: 0.5, decay: 0.5, tune: 0.5 },
      clap:      { level: 0.5, decay: 0.5 },
      rimshot:   { level: 1.0, decay: 0.5 },
      closedHat: { level: 0.85, decay: 0.5 },
      openHat:   { level: 0.85, decay: 0.5 },
      lowTom:    { level: 1.0, decay: 0.5, tune: 0.5 },
      midTom:    { level: 1.0, decay: 0.5, tune: 0.5 },
      hiTom:     { level: 1.0, decay: 0.5, tune: 0.5 },
      crash:     { level: 0.85, decay: 0.5 },
      ride:      { level: 0.85, decay: 0.5 },
    },
  ),
];
