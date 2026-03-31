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

const DEFAULT_MASTER = {
  volume: 0.8,
  compressor: true,
  threshold: -18,
  ratio: 4,
  knee: 8,
  attack: 0.005,
  release: 0.15,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private clock: Clock;
  private listeners = new Set<() => void>();
  private snapshot: EngineSnapshot;
  private openHatGain: GainNode | null = null;

  // Master chain nodes — created on init()
  private compressorNode: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private outputNode: AudioNode | null = null; // where voices connect to

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
      master: { ...DEFAULT_MASTER },
      presets: {
        patterns: PresetStorage.getPatternPresets(),
        kits: PresetStorage.getKitPresets(),
        activePatternId: null,
        activeKitId: null,
      },
    };

    this.clock = new Clock((time, step) => this.onTick(time, step));
  }

  // --- Subscription API ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): EngineSnapshot => {
    return this.snapshot;
  };

  // --- Lifecycle ---

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Build master chain: voices → compressor → masterGain → destination
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.applyCompressorParams();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.snapshot.master.volume;

    // Wire up the chain
    this.compressorNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Voices connect to the compressor input
    this.outputNode = this.compressorNode;
  }

  // --- Transport ---

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

  // --- Master Section ---

  setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }
    this.emit({
      master: { ...this.snapshot.master, volume: clamped },
    });
  }

  setCompressorEnabled(enabled: boolean): void {
    this.emit({
      master: { ...this.snapshot.master, compressor: enabled },
    });
    this.rewireMasterChain();
  }

  setCompressorParam(param: 'threshold' | 'ratio' | 'knee' | 'attack' | 'release', value: number): void {
    this.emit({
      master: { ...this.snapshot.master, [param]: value },
    });
    this.applyCompressorParams();
  }

  // --- Preset Management ---

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

  // --- Clock Callback ---

  private onTick(time: number, step: number): void {
    if (this.ctx) {
      const dest = this.outputNode ?? this.ctx.destination;
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
              this.ctx, dest, time, params, accent,
            );
          } else {
            voices[id](this.ctx, dest, time, params, accent);
          }
        }
      }
    }

    this.emit({
      transport: { ...this.snapshot.transport, currentStep: step },
    });
  }

  // --- Internal ---

  private applyCompressorParams(): void {
    if (!this.compressorNode) return;
    const m = this.snapshot.master;
    this.compressorNode.threshold.value = m.threshold;
    this.compressorNode.ratio.value = m.ratio;
    this.compressorNode.knee.value = m.knee;
    this.compressorNode.attack.value = m.attack;
    this.compressorNode.release.value = m.release;
  }

  private rewireMasterChain(): void {
    if (!this.ctx || !this.compressorNode || !this.masterGain) return;

    // Disconnect everything from masterGain input
    this.compressorNode.disconnect();

    if (this.snapshot.master.compressor) {
      // voices → compressor → masterGain → destination
      this.compressorNode.connect(this.masterGain);
      this.outputNode = this.compressorNode;
    } else {
      // voices → masterGain → destination (bypass compressor)
      this.outputNode = this.masterGain;
    }
  }

  private emit(partial: Partial<EngineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
