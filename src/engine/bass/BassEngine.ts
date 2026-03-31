import type { BassSnapshot, BassPatternPreset, BassSynthPreset, SynthParams, BassStep } from './bassTypes';
import { createDefaultBassPattern, DEFAULT_SYNTH_PARAMS, midiToFreq, NUM_BASS_STEPS } from './bassTypes';
import { BassPresetStorage } from './bassPresetStorage';
import type { TransportManager } from '../TransportManager';

export class BassEngine {
  private listeners = new Set<() => void>();
  private snapshot: BassSnapshot;

  // Persistent synth nodes (created lazily on first tick)
  private oscillator: OscillatorNode | null = null;
  private filter: AudioWorkletNode | BiquadFilterNode | null = null;
  private vca: GainNode | null = null;
  private useWorklet = true;

  // Track previous step info for slide
  private prevStep: BassStep | null = null;
  private prevStepIndex = -1;

  constructor(transport: TransportManager) {
    this.snapshot = {
      pattern: createDefaultBassPattern(),
      synth: { ...DEFAULT_SYNTH_PARAMS },
      presets: {
        patterns: BassPresetStorage.getPatternPresets(),
        synths: BassPresetStorage.getSynthPresets(),
        activePatternId: null,
        activeSynthId: null,
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

  getSnapshot = (): BassSnapshot => {
    return this.snapshot;
  };

  // --- Pattern Editing ---

  setNote(step: number, note: number): void {
    const clamped = Math.max(0, Math.min(127, note));
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], note: clamped };
    this.emit({
      pattern: { ...this.snapshot.pattern, steps: newSteps },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  toggleAccent(step: number): void {
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], accent: !newSteps[step].accent };
    this.emit({
      pattern: { ...this.snapshot.pattern, steps: newSteps },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  toggleSlide(step: number): void {
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], slide: !newSteps[step].slide };
    this.emit({
      pattern: { ...this.snapshot.pattern, steps: newSteps },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  setGate(step: number, gate: 'note' | 'rest' | 'tie'): void {
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], gate };
    this.emit({
      pattern: { ...this.snapshot.pattern, steps: newSteps },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  // --- Synth Params ---

  setSynthParam(param: keyof SynthParams, value: SynthParams[keyof SynthParams]): void {
    this.emit({
      synth: { ...this.snapshot.synth, [param]: value },
      presets: { ...this.snapshot.presets, activeSynthId: null },
    });
  }

  setWaveform(wf: 'sawtooth' | 'square'): void {
    this.emit({
      synth: { ...this.snapshot.synth, waveform: wf },
      presets: { ...this.snapshot.presets, activeSynthId: null },
    });
    // Update live oscillator if it exists
    if (this.oscillator) {
      this.oscillator.type = wf;
    }
  }

  // --- Pattern Preset Methods ---

  loadPatternPreset(id: string): void {
    const preset = this.snapshot.presets.patterns.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      pattern: { steps: structuredClone(preset.steps) },
      presets: { ...this.snapshot.presets, activePatternId: id },
    });
  }

  savePatternPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: BassPatternPreset = {
      id, name, builtIn: false,
      steps: structuredClone(this.snapshot.pattern.steps),
    };
    BassPresetStorage.savePatternPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: BassPresetStorage.getPatternPresets(),
        activePatternId: id,
      },
    });
  }

  deletePatternPreset(id: string): void {
    BassPresetStorage.deletePatternPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: BassPresetStorage.getPatternPresets(),
        activePatternId: this.snapshot.presets.activePatternId === id ? null : this.snapshot.presets.activePatternId,
      },
    });
  }

  // --- Synth Preset Methods ---

  loadSynthPreset(id: string): void {
    const preset = this.snapshot.presets.synths.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      synth: { ...preset.synth },
      presets: { ...this.snapshot.presets, activeSynthId: id },
    });
  }

  saveSynthPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: BassSynthPreset = {
      id, name, builtIn: false,
      synth: { ...this.snapshot.synth },
    };
    BassPresetStorage.saveSynthPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        synths: BassPresetStorage.getSynthPresets(),
        activeSynthId: id,
      },
    });
  }

  deleteSynthPreset(id: string): void {
    BassPresetStorage.deleteSynthPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        synths: BassPresetStorage.getSynthPresets(),
        activeSynthId: this.snapshot.presets.activeSynthId === id ? null : this.snapshot.presets.activeSynthId,
      },
    });
  }

  // --- Tick Handler ---

  private onTick(ctx: AudioContext, dest: AudioNode, time: number, step: number): void {
    // Lazily create persistent synth nodes on first tick
    if (!this.oscillator || !this.vca) {
      this.oscillator = ctx.createOscillator();
      this.oscillator.type = this.snapshot.synth.waveform;
      this.oscillator.frequency.value = midiToFreq(36);

      this.vca = ctx.createGain();
      this.vca.gain.value = 0;

      // Try to create the AudioWorklet diode-ladder filter node
      try {
        this.filter = new AudioWorkletNode(ctx, 'diode-ladder');
        this.useWorklet = true;
      } catch {
        // Fall back to a biquad lowpass filter
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        this.filter = biquad;
        this.useWorklet = false;
      }

      // Wire: oscillator → filter → vca → dest
      this.oscillator.connect(this.filter);
      this.filter.connect(this.vca);
      this.vca.connect(dest);
      this.oscillator.start();
    }

    const synth = this.snapshot.synth;
    const bassStep = this.snapshot.pattern.steps[step % NUM_BASS_STEPS];

    if (bassStep.gate === 'rest') {
      // Silence
      this.vca.gain.cancelScheduledValues(time);
      this.vca.gain.setValueAtTime(0, time);
      this.prevStep = bassStep;
      this.prevStepIndex = step;
      return;
    }

    if (bassStep.gate === 'tie') {
      // Sustain previous note — do nothing
      this.prevStep = bassStep;
      this.prevStepIndex = step;
      return;
    }

    // gate === 'note'
    const accentBoost = bassStep.accent ? synth.accent : 0;
    const freq = midiToFreq(bassStep.note);

    // Determine if we should slide from previous step
    const prevHadSlide =
      this.prevStep !== null &&
      this.prevStep.slide === true &&
      this.prevStep.gate !== 'rest';

    // Set pitch — slide or immediate
    if (prevHadSlide) {
      this.oscillator.frequency.cancelScheduledValues(time);
      this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, time);
      this.oscillator.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
    } else {
      this.oscillator.frequency.cancelScheduledValues(time);
      this.oscillator.frequency.setValueAtTime(freq, time);
    }

    // Filter envelope
    const baseCutoffHz = 20 * Math.pow(1000, synth.cutoff);
    const envAmount = baseCutoffHz * synth.envMod * 4 * (1 + accentBoost * 2);
    const decayTime = 0.03 + synth.decay * 0.5;

    if (this.useWorklet && this.filter instanceof AudioWorkletNode) {
      const cutoffParam = this.filter.parameters.get('cutoff');
      if (cutoffParam) {
        cutoffParam.cancelScheduledValues(time);
        cutoffParam.setValueAtTime(baseCutoffHz + envAmount, time);
        cutoffParam.setTargetAtTime(baseCutoffHz, time, decayTime / 3);
      }
    } else if (this.filter instanceof BiquadFilterNode) {
      this.filter.frequency.cancelScheduledValues(time);
      this.filter.frequency.setValueAtTime(baseCutoffHz + envAmount, time);
      this.filter.frequency.setTargetAtTime(baseCutoffHz, time, decayTime / 3);
    }

    // VCA envelope
    const vcaLevel = synth.volume * (1 + accentBoost * 0.5);
    this.vca.gain.cancelScheduledValues(time);
    this.vca.gain.setValueAtTime(vcaLevel, time);
    this.vca.gain.setTargetAtTime(0, time + 0.01, decayTime / 3);

    this.prevStep = bassStep;
    this.prevStepIndex = step;
  }

  // --- Internal ---

  private emit(partial: Partial<BassSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
