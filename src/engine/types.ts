export const INSTRUMENT_IDS = [
  'kick', 'snare', 'clap', 'rimshot',
  'closedHat', 'openHat',
  'lowTom', 'midTom', 'hiTom',
  'crash', 'ride',
] as const;

export type InstrumentId = typeof INSTRUMENT_IDS[number];

export interface InstrumentParams {
  level: number;   // 0–1
  decay: number;   // 0–1
  tune?: number;   // 0–1, only for voices that support tuning
}

export interface EngineSnapshot {
  transport: {
    playing: boolean;
    bpm: number;
    currentStep: number; // 0–15
  };
  pattern: {
    steps: Record<InstrumentId, boolean[]>;
    accents: boolean[];
  };
  instruments: Record<InstrumentId, InstrumentParams>;
  presets: {
    patterns: PatternPreset[];
    kits: KitPreset[];
    activePatternId: string | null;
    activeKitId: string | null;
  };
}

export type VoiceTrigger = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  params: InstrumentParams,
  accent: boolean,
) => void;

/** VoiceTrigger variant that returns a GainNode for choke group support */
export type ChokableVoiceTrigger = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  params: InstrumentParams,
  accent: boolean,
) => GainNode;

export const TUNABLE_INSTRUMENTS: Set<InstrumentId> = new Set([
  'kick', 'snare', 'lowTom', 'midTom', 'hiTom',
]);

export const NUM_STEPS = 16;

export function createDefaultSteps(): Record<InstrumentId, boolean[]> {
  const steps = {} as Record<InstrumentId, boolean[]>;
  for (const id of INSTRUMENT_IDS) {
    steps[id] = new Array(NUM_STEPS).fill(false);
  }
  return steps;
}

export function createDefaultInstruments(): Record<InstrumentId, InstrumentParams> {
  const instruments = {} as Record<InstrumentId, InstrumentParams>;
  for (const id of INSTRUMENT_IDS) {
    instruments[id] = {
      level: 0.8,
      decay: 0.5,
      ...(TUNABLE_INSTRUMENTS.has(id) ? { tune: 0.5 } : {}),
    };
  }
  return instruments;
}

export interface PatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  bpm: number;
  steps: Record<InstrumentId, boolean[]>;
  accents: boolean[];
}

export interface KitPreset {
  id: string;
  name: string;
  builtIn: boolean;
  instruments: Record<InstrumentId, InstrumentParams>;
}
