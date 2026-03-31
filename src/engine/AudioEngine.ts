import {
  type InstrumentId,
  type EngineSnapshot,
  type PatternPreset,
  type KitPreset,
  INSTRUMENT_IDS,
  NUM_STEPS,
  createDefaultSteps,
  createDefaultInstruments,
} from './types';
import { Clock } from './clock';
import { voices, openHat as openHatVoice } from './voices';
import { PresetStorage } from './presetStorage';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private clock: Clock;
  private listeners = new Set<() => void>();
  private snapshot: EngineSnapshot;
  private openHatGain: GainNode | null = null;

  constructor() {
    this.snapshot = {
      transport: {
        playing: false,
        bpm: 120,
        shuffle: 0,
        currentStep: 0,
      },
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

    this.clock = new Clock((time, step) => this.onTick(time, step));
  }

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): EngineSnapshot => {
    return this.snapshot;
  };

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  play(): void {
    if (!this.ctx || this.snapshot.transport.playing) return;
    this.emit({
      transport: { ...this.snapshot.transport, playing: true, currentStep: 0 },
    });
    this.clock.start(this.ctx, this.snapshot.transport.bpm, this.snapshot.transport.shuffle);
  }

  stop(): void {
    if (!this.snapshot.transport.playing) return;
    this.clock.stop();
    this.emit({
      transport: { ...this.snapshot.transport, playing: false, currentStep: 0 },
    });
  }

  setBpm(bpm: number): void {
    const clamped = Math.max(40, Math.min(300, bpm));
    this.emit({
      transport: { ...this.snapshot.transport, bpm: clamped },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
    if (this.snapshot.transport.playing) {
      this.clock.setBpm(clamped);
    }
  }

  setShuffle(shuffle: number): void {
    const clamped = Math.max(0, Math.min(1, shuffle));
    this.emit({
      transport: { ...this.snapshot.transport, shuffle: clamped },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
    if (this.snapshot.transport.playing) {
      this.clock.setShuffle(clamped);
    }
  }

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

  loadPatternPreset(id: string): void {
    const preset = this.snapshot.presets.patterns.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      pattern: { steps: structuredClone(preset.steps), accents: [...preset.accents] },
      transport: { ...this.snapshot.transport, bpm: preset.bpm, shuffle: preset.shuffle },
      presets: { ...this.snapshot.presets, activePatternId: id },
    });
    if (this.snapshot.transport.playing) {
      this.clock.setBpm(preset.bpm);
      this.clock.setShuffle(preset.shuffle);
    }
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
      bpm: this.snapshot.transport.bpm,
      shuffle: this.snapshot.transport.shuffle,
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

  private onTick(time: number, step: number): void {
    if (this.ctx) {
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
            this.openHatGain = openHatVoice(
              this.ctx, this.ctx.destination, time, params, accent,
            );
          } else {
            voices[id](this.ctx, this.ctx.destination, time, params, accent);
          }
        }
      }
    }

    this.emit({
      transport: { ...this.snapshot.transport, currentStep: step },
    });
  }

  private emit(partial: Partial<EngineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
