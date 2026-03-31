import {
  type InstrumentId,
  type DrumSnapshot,
  type PatternPreset,
  type KitPreset,
  INSTRUMENT_IDS,
  NUM_STEPS,
  createDefaultSteps,
  createDefaultInstruments,
} from './types';
import { voices, openHat as openHatVoice } from './voices';
import { PresetStorage } from './presetStorage';
import type { TransportManager } from './TransportManager';

export class DrumEngine {
  private listeners = new Set<() => void>();
  private snapshot: DrumSnapshot;
  private openHatGain: GainNode | null = null;

  constructor(transport: TransportManager) {
    this.snapshot = {
      pattern: {
        steps: createDefaultSteps(),
        accents: new Array(NUM_STEPS).fill(false),
      },
      instruments: createDefaultInstruments(),
      presets: {
        patterns: PresetStorage.getPatternPresets(),
        kits: PresetStorage.getKitPresets(),
        activePatternId: null,
        activeKitId: null,
      },
    };

    transport.registerTickCallback((ctx, dest, time, step) =>
      this.onTick(ctx, dest, time, step),
    );
  }

  // --- Subscription API ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): DrumSnapshot => {
    return this.snapshot;
  };

  // --- Pattern Editing ---

  toggleStep(instrument: InstrumentId, step: number): void {
    const currentSteps = this.snapshot.pattern.steps[instrument];
    const newSteps = [...currentSteps];
    newSteps[step] = !newSteps[step];

    this.emit({
      pattern: {
        ...this.snapshot.pattern,
        steps: { ...this.snapshot.pattern.steps, [instrument]: newSteps },
      },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  toggleAccent(step: number): void {
    const newAccents = [...this.snapshot.pattern.accents];
    newAccents[step] = !newAccents[step];
    this.emit({
      pattern: { ...this.snapshot.pattern, accents: newAccents },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  // --- Instrument Params ---

  setParam(instrument: InstrumentId, param: string, value: number): void {
    const current = this.snapshot.instruments[instrument];
    this.emit({
      instruments: {
        ...this.snapshot.instruments,
        [instrument]: { ...current, [param]: value },
      },
      presets: { ...this.snapshot.presets, activeKitId: null },
    });
  }

  // --- Preset Management ---

  loadPatternPreset(id: string): void {
    const preset = this.snapshot.presets.patterns.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      pattern: { steps: structuredClone(preset.steps), accents: [...preset.accents] },
      presets: { ...this.snapshot.presets, activePatternId: id },
    });
  }

  loadKitPreset(id: string): void {
    const preset = this.snapshot.presets.kits.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      instruments: structuredClone(preset.instruments),
      presets: { ...this.snapshot.presets, activeKitId: id },
    });
  }

  savePatternPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: PatternPreset = {
      id, name, builtIn: false,
      steps: structuredClone(this.snapshot.pattern.steps),
      accents: [...this.snapshot.pattern.accents],
    };
    PresetStorage.savePatternPreset(preset);
    this.emit({
      presets: { ...this.snapshot.presets, patterns: PresetStorage.getPatternPresets(), activePatternId: id },
    });
  }

  saveKitPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: KitPreset = {
      id, name, builtIn: false,
      instruments: structuredClone(this.snapshot.instruments),
    };
    PresetStorage.saveKitPreset(preset);
    this.emit({
      presets: { ...this.snapshot.presets, kits: PresetStorage.getKitPresets(), activeKitId: id },
    });
  }

  deletePatternPreset(id: string): void {
    PresetStorage.deletePatternPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: PresetStorage.getPatternPresets(),
        activePatternId: this.snapshot.presets.activePatternId === id ? null : this.snapshot.presets.activePatternId,
      },
    });
  }

  deleteKitPreset(id: string): void {
    PresetStorage.deleteKitPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        kits: PresetStorage.getKitPresets(),
        activeKitId: this.snapshot.presets.activeKitId === id ? null : this.snapshot.presets.activeKitId,
      },
    });
  }

  // --- Tick Callback (called by TransportManager) ---

  private onTick(ctx: AudioContext, dest: AudioNode, time: number, step: number): void {
    const accent = this.snapshot.pattern.accents[step];
    for (const id of INSTRUMENT_IDS) {
      if (this.snapshot.pattern.steps[id][step]) {
        const params = this.snapshot.instruments[id];

        if (id === 'closedHat' && this.openHatGain) {
          this.openHatGain.gain.cancelScheduledValues(time);
          this.openHatGain.gain.setValueAtTime(0, time);
          this.openHatGain = null;
        }

        if (id === 'openHat') {
          this.openHatGain = openHatVoice(ctx, dest, time, params, accent);
        } else {
          voices[id](ctx, dest, time, params, accent);
        }
      }
    }
  }

  // --- Internal ---

  private emit(partial: Partial<DrumSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
