import type { TransportManager } from './TransportManager';

export interface ChannelState {
  label: string;
  volume: number;   // 0–1
  pan: number;       // -1 to 1
  mute: boolean;
  solo: boolean;
  connected: boolean; // true if an engine is routed to this channel
}

export interface MixerSnapshot {
  channels: ChannelState[];
  masterVolume: number;
}

const NUM_CHANNELS = 12;

function createDefaultChannels(): ChannelState[] {
  return Array.from({ length: NUM_CHANNELS }, (_, i) => ({
    label: `Ch ${i + 1}`,
    volume: 0.8,
    pan: 0,
    mute: false,
    solo: false,
    connected: false,
  }));
}

export class MixerEngine {
  private listeners = new Set<() => void>();
  private snapshot: MixerSnapshot;

  // Audio nodes per channel — created on initAudio()
  private channelGains: GainNode[] = [];
  private channelPans: StereoPannerNode[] = [];
  private masterBus: GainNode | null = null;
  private initialized = false;

  constructor(_transport: TransportManager) {
    this.snapshot = {
      channels: createDefaultChannels(),
      masterVolume: 1.0,
    };
  }

  // --- Subscription API ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): MixerSnapshot => {
    return this.snapshot;
  };

  // --- Audio Initialization ---

  initAudio(ctx: AudioContext, masterDest: AudioNode): void {
    if (this.initialized) return;

    this.masterBus = ctx.createGain();
    this.masterBus.gain.value = this.snapshot.masterVolume;
    this.masterBus.connect(masterDest);

    for (let i = 0; i < NUM_CHANNELS; i++) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = this.snapshot.channels[i].pan;

      const gain = ctx.createGain();
      gain.gain.value = this.snapshot.channels[i].mute ? 0 : this.snapshot.channels[i].volume;

      gain.connect(pan);
      pan.connect(this.masterBus);

      this.channelGains.push(gain);
      this.channelPans.push(pan);
    }

    this.initialized = true;
  }

  // --- Channel Input Access ---

  getChannelInput(channel: number): AudioNode | null {
    if (channel < 0 || channel >= NUM_CHANNELS) return null;
    return this.channelGains[channel] ?? null;
  }

  /** Assign a label and mark channel as connected */
  assignChannel(channel: number, label: string): void {
    const channels = [...this.snapshot.channels];
    channels[channel] = { ...channels[channel], label, connected: true };
    this.emit({ channels });
  }

  // --- Channel Controls ---

  setChannelVolume(channel: number, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    const channels = [...this.snapshot.channels];
    channels[channel] = { ...channels[channel], volume: clamped };
    this.emit({ channels });
    this.applyChannelGain(channel);
  }

  setChannelPan(channel: number, pan: number): void {
    const clamped = Math.max(-1, Math.min(1, pan));
    const channels = [...this.snapshot.channels];
    channels[channel] = { ...channels[channel], pan: clamped };
    this.emit({ channels });
    if (this.channelPans[channel]) {
      this.channelPans[channel].pan.value = clamped;
    }
  }

  toggleChannelMute(channel: number): void {
    const channels = [...this.snapshot.channels];
    channels[channel] = { ...channels[channel], mute: !channels[channel].mute };
    this.emit({ channels });
    this.applyChannelGain(channel);
  }

  toggleChannelSolo(channel: number): void {
    const channels = [...this.snapshot.channels];
    channels[channel] = { ...channels[channel], solo: !channels[channel].solo };
    this.emit({ channels });
    // Solo affects all channels
    this.applyAllChannelGains();
  }

  setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.emit({ masterVolume: clamped });
    if (this.masterBus) {
      this.masterBus.gain.value = clamped;
    }
  }

  // --- Internal ---

  private applyChannelGain(channel: number): void {
    const gain = this.channelGains[channel];
    if (!gain) return;

    const ch = this.snapshot.channels[channel];
    const anySolo = this.snapshot.channels.some((c) => c.solo);

    if (ch.mute || (anySolo && !ch.solo)) {
      gain.gain.value = 0;
    } else {
      gain.gain.value = ch.volume;
    }
  }

  private applyAllChannelGains(): void {
    for (let i = 0; i < NUM_CHANNELS; i++) {
      this.applyChannelGain(i);
    }
  }

  private emit(partial: Partial<MixerSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
