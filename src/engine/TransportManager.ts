import { Clock } from './clock';

export interface MasterParams {
  volume: number;
  compressor: boolean;
  threshold: number;
  ratio: number;
  knee: number;
  attack: number;
  release: number;
}

export interface TransportSnapshot {
  playing: boolean;
  bpm: number;
  shuffle: number;
  currentStep: number;
  master: MasterParams;
}

type TickCallback = (ctx: AudioContext, time: number, step: number) => void;

const DEFAULT_MASTER: MasterParams = {
  volume: 0.8,
  compressor: true,
  threshold: -18,
  ratio: 4,
  knee: 8,
  attack: 0.005,
  release: 0.15,
};

export class TransportManager {
  private ctx: AudioContext | null = null;
  private clock: Clock;
  private listeners = new Set<() => void>();
  private snapshot: TransportSnapshot;

  // Master chain nodes — created on init()
  private compressorNode: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;

  // The node that the mixer master bus should connect to
  // (compressor input when enabled, masterGain when bypassed)
  private _compressorInput: AudioNode | null = null;

  // Registered tick callbacks
  private tickCallbacks = new Set<TickCallback>();

  constructor() {
    this.snapshot = {
      playing: false,
      bpm: 120,
      shuffle: 0,
      currentStep: 0,
      master: { ...DEFAULT_MASTER },
    };

    this.clock = new Clock((time, step) => this.onTick(time, step));
  }

  // --- Subscription API (useSyncExternalStore pattern) ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): TransportSnapshot => {
    return this.snapshot;
  };

  // --- Tick Callback Registration ---
  // Tick callbacks no longer receive a dest node — engines get their
  // channel input from the mixer instead.

  registerTickCallback(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  // --- Accessors ---

  /** Returns the node the mixer master bus should connect to */
  getCompressorInput(): AudioNode | null {
    return this._compressorInput;
  }

  // --- Lifecycle ---

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    await this.ctx.audioWorklet.addModule(
      new URL('./bass/diodeLadderProcessor.ts', import.meta.url)
    );

    // Build master chain: mixer master → compressor → masterGain → destination
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.applyCompressorParams();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.snapshot.master.volume;

    this.compressorNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this._compressorInput = this.compressorNode;
  }

  getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  // --- Transport ---

  play(): void {
    if (!this.ctx || this.snapshot.playing) return;
    this.emit({ playing: true, currentStep: 0 });
    this.clock.start(this.ctx, this.snapshot.bpm, this.snapshot.shuffle);
  }

  stop(): void {
    if (!this.snapshot.playing) return;
    this.clock.stop();
    this.emit({ playing: false, currentStep: 0 });
  }

  setBpm(bpm: number): void {
    const clamped = Math.max(40, Math.min(300, bpm));
    this.emit({ bpm: clamped });
    if (this.snapshot.playing) {
      this.clock.setBpm(clamped);
    }
  }

  setShuffle(shuffle: number): void {
    const clamped = Math.max(0, Math.min(1, shuffle));
    this.emit({ shuffle: clamped });
    if (this.snapshot.playing) {
      this.clock.setShuffle(clamped);
    }
  }

  // --- Master Section ---

  setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }
    this.emit({ master: { ...this.snapshot.master, volume: clamped } });
  }

  setCompressorEnabled(enabled: boolean): void {
    this.emit({ master: { ...this.snapshot.master, compressor: enabled } });
    this.applyCompressorParams();
  }

  setCompressorParam(
    param: 'threshold' | 'ratio' | 'knee' | 'attack' | 'release',
    value: number,
  ): void {
    this.emit({ master: { ...this.snapshot.master, [param]: value } });
    this.applyCompressorParams();
  }

  // --- Clock Callback ---

  private onTick(time: number, step: number): void {
    this.emit({ currentStep: step });

    if (this.ctx) {
      for (const cb of this.tickCallbacks) {
        cb(this.ctx, time, step);
      }
    }
  }

  // --- Internal ---

  private applyCompressorParams(): void {
    if (!this.compressorNode) return;
    const m = this.snapshot.master;

    if (m.compressor) {
      // Apply user settings
      this.compressorNode.threshold.value = m.threshold;
      this.compressorNode.ratio.value = m.ratio;
      this.compressorNode.knee.value = m.knee;
      this.compressorNode.attack.value = m.attack;
      this.compressorNode.release.value = m.release;
    } else {
      // Bypass: passthrough settings (no compression)
      this.compressorNode.threshold.value = 0;
      this.compressorNode.ratio.value = 1;
      this.compressorNode.knee.value = 0;
      this.compressorNode.attack.value = 0;
      this.compressorNode.release.value = 0.01;
    }
  }

  private emit(partial: Partial<TransportSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
