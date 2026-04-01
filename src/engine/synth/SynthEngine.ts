import type {
  SynthSnapshot,
  SynthPatternPreset,
  SynthSoundPreset,
  OscParams,
  ADSRParams,
  SynthStep,
} from './synthTypes';
import {
  createDefaultSynthPattern,
  DEFAULT_SH2_PARAMS,
  NUM_SYNTH_STEPS,
  midiToFreq,
  adsrTimeMap,
} from './synthTypes';
import { SynthPresetStorage } from './synthPresetStorage';
import type { TransportManager } from '../TransportManager';
import type { MixerEngine } from '../MixerEngine';

export const SYNTH_MIXER_CHANNEL = 2;

export class SynthEngine {
  private listeners = new Set<() => void>();
  private snapshot: SynthSnapshot;
  private mixer: MixerEngine;

  // Persistent audio nodes (created lazily on first tick)
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc1Gain: GainNode | null = null;
  private osc2Gain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: AudioWorkletNode | BiquadFilterNode | null = null;
  private filterEnvGain: GainNode | null = null;
  private vca: GainNode | null = null;
  private useWorklet = true;

  // Track previous step for slide logic
  private prevStep: SynthStep | null = null;

  constructor(transport: TransportManager, mixer: MixerEngine) {
    this.mixer = mixer;
    this.snapshot = {
      pattern: createDefaultSynthPattern(),
      params: { ...DEFAULT_SH2_PARAMS },
      presets: {
        patterns: SynthPresetStorage.getPatternPresets(),
        sounds: SynthPresetStorage.getSoundPresets(),
        activePatternId: null,
        activeSoundId: null,
      },
    };

    mixer.assignChannel(SYNTH_MIXER_CHANNEL, 'GC-2');

    transport.registerTickCallback((ctx, time, step) =>
      this.onTick(ctx, time, step),
    );
  }

  // --- Subscription API ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): SynthSnapshot => {
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

  // --- Param Editing ---

  setOscParam(osc: 1 | 2, param: keyof OscParams, value: OscParams[keyof OscParams]): void {
    const key = osc === 1 ? 'osc1' : 'osc2';
    this.emit({
      params: {
        ...this.snapshot.params,
        [key]: { ...this.snapshot.params[key], [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setFilterParam(param: 'cutoff' | 'resonance' | 'filterEnvDepth', value: number): void {
    this.emit({
      params: { ...this.snapshot.params, [param]: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setFilterEnv(param: keyof ADSRParams, value: number): void {
    this.emit({
      params: {
        ...this.snapshot.params,
        filterEnv: { ...this.snapshot.params.filterEnv, [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setAmpEnv(param: keyof ADSRParams, value: number): void {
    this.emit({
      params: {
        ...this.snapshot.params,
        ampEnv: { ...this.snapshot.params.ampEnv, [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setLFOParam(param: string, value: string | number): void {
    this.emit({
      params: { ...this.snapshot.params, [param]: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setNoiseLevel(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, noiseLevel: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setVolume(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, volume: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setAccent(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, accent: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
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
    const preset: SynthPatternPreset = {
      id, name, builtIn: false,
      steps: structuredClone(this.snapshot.pattern.steps),
    };
    SynthPresetStorage.savePatternPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: SynthPresetStorage.getPatternPresets(),
        activePatternId: id,
      },
    });
  }

  deletePatternPreset(id: string): void {
    SynthPresetStorage.deletePatternPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: SynthPresetStorage.getPatternPresets(),
        activePatternId: this.snapshot.presets.activePatternId === id
          ? null
          : this.snapshot.presets.activePatternId,
      },
    });
  }

  // --- Sound Preset Methods ---

  loadSoundPreset(id: string): void {
    const preset = this.snapshot.presets.sounds.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      params: { ...preset.params },
      presets: { ...this.snapshot.presets, activeSoundId: id },
    });
  }

  saveSoundPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: SynthSoundPreset = {
      id, name, builtIn: false,
      params: structuredClone(this.snapshot.params),
    };
    SynthPresetStorage.saveSoundPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        sounds: SynthPresetStorage.getSoundPresets(),
        activeSoundId: id,
      },
    });
  }

  deleteSoundPreset(id: string): void {
    SynthPresetStorage.deleteSoundPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        sounds: SynthPresetStorage.getSoundPresets(),
        activeSoundId: this.snapshot.presets.activeSoundId === id
          ? null
          : this.snapshot.presets.activeSoundId,
      },
    });
  }

  // --- Tick Handler ---

  private onTick(ctx: AudioContext, time: number, step: number): void {
    const dest = this.mixer.getChannelInput(SYNTH_MIXER_CHANNEL);
    if (!dest) return;

    // Lazily create persistent nodes on first tick
    if (!this.osc1 || !this.vca) {
      const p = this.snapshot.params;

      // --- Oscillators ---
      this.osc1 = ctx.createOscillator();
      this.osc1.type = p.osc1.waveform === 'pulse' ? 'square' : p.osc1.waveform;
      this.osc1.frequency.value = midiToFreq(48);

      this.osc2 = ctx.createOscillator();
      this.osc2.type = p.osc2.waveform === 'pulse' ? 'square' : p.osc2.waveform;
      this.osc2.frequency.value = midiToFreq(48);

      this.osc1Gain = ctx.createGain();
      this.osc1Gain.gain.value = p.osc1.level;
      this.osc2Gain = ctx.createGain();
      this.osc2Gain.gain.value = p.osc2.level;

      // --- Noise ---
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;
      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.value = p.noiseLevel;

      // --- LFO ---
      this.lfo = ctx.createOscillator();
      this.lfo.type = p.lfoWaveform;
      this.lfo.frequency.value = p.lfoRate * 20; // map 0-1 to 0-20 Hz
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = p.lfoDepth * 100; // depth in cents / Hz

      // --- Filter ---
      this.filterEnvGain = ctx.createGain();
      this.filterEnvGain.gain.value = 0;

      try {
        this.filter = new AudioWorkletNode(ctx, 'ir3109');
        this.useWorklet = true;
      } catch {
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        const baseCutoffHz = 20 * Math.pow(1000, p.cutoff);
        biquad.frequency.value = baseCutoffHz;
        biquad.Q.value = p.resonance * 20;
        this.filter = biquad;
        this.useWorklet = false;
      }

      // --- VCA ---
      this.vca = ctx.createGain();
      this.vca.gain.value = 0;

      // --- LFO routing ---
      if (p.lfoDestination === 'pitch') {
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.osc1.detune);
        this.lfoGain.connect(this.osc2!.detune);
      } else if (p.lfoDestination === 'cutoff') {
        this.lfo.connect(this.lfoGain);
        if (this.filter instanceof BiquadFilterNode) {
          this.lfoGain.connect(this.filter.frequency);
        } else if (this.filter instanceof AudioWorkletNode) {
          const freqParam = this.filter.parameters.get('frequency');
          if (freqParam) this.lfoGain.connect(freqParam);
        }
      }
      // 'pulseWidth' — skip for now

      // --- Signal chain wiring ---
      // osc1 → osc1Gain ↘
      // osc2 → osc2Gain  → filter → vca → dest
      // noise → noiseGain ↗
      this.osc1.connect(this.osc1Gain);
      this.osc2!.connect(this.osc2Gain!);
      this.noiseSource.connect(this.noiseGain);

      this.osc1Gain.connect(this.filter);
      this.osc2Gain!.connect(this.filter);
      this.noiseGain.connect(this.filter);
      this.filter.connect(this.vca);
      this.vca.connect(dest);

      // Start oscillators and noise
      this.osc1.start();
      this.osc2!.start();
      this.noiseSource.start();
      this.lfo.start();
    }

    const params = this.snapshot.params;
    const synthStep = this.snapshot.pattern.steps[step % NUM_SYNTH_STEPS];

    if (synthStep.gate === 'rest') {
      // Release VCA
      this.vca!.gain.cancelScheduledValues(time);
      this.vca!.gain.setTargetAtTime(0, time, 0.01);
      this.prevStep = synthStep;
      return;
    }

    if (synthStep.gate === 'tie') {
      // Sustain — no re-trigger
      this.prevStep = synthStep;
      return;
    }

    // gate === 'note'
    const accentBoost = synthStep.accent ? params.accent : 0;

    // --- Pitch calculation with octave and tune offsets ---
    const semitones1 = synthStep.note + params.osc1.octave * 12 + params.osc1.tune * 1;
    const semitones2 = synthStep.note + params.osc2.octave * 12 + params.osc2.tune * 1;
    const freq1 = midiToFreq(Math.max(0, Math.min(127, semitones1)));
    const freq2 = midiToFreq(Math.max(0, Math.min(127, semitones2)));

    const prevHadSlide =
      this.prevStep !== null &&
      this.prevStep.slide === true &&
      this.prevStep.gate !== 'rest';

    if (prevHadSlide) {
      this.osc1!.frequency.cancelScheduledValues(time);
      this.osc1!.frequency.setValueAtTime(this.osc1!.frequency.value, time);
      this.osc1!.frequency.exponentialRampToValueAtTime(Math.max(1, freq1), time + 0.06);

      this.osc2!.frequency.cancelScheduledValues(time);
      this.osc2!.frequency.setValueAtTime(this.osc2!.frequency.value, time);
      this.osc2!.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), time + 0.06);
    } else {
      this.osc1!.frequency.cancelScheduledValues(time);
      this.osc1!.frequency.setValueAtTime(Math.max(1, freq1), time);

      this.osc2!.frequency.cancelScheduledValues(time);
      this.osc2!.frequency.setValueAtTime(Math.max(1, freq2), time);
    }

    // Update osc gain levels
    this.osc1Gain!.gain.setValueAtTime(params.osc1.level, time);
    this.osc2Gain!.gain.setValueAtTime(params.osc2.level, time);
    this.noiseGain!.gain.setValueAtTime(params.noiseLevel, time);

    // --- Filter envelope ---
    const baseCutoffHz = 20 * Math.pow(1000, params.cutoff);
    const envDepth = params.filterEnvDepth * (1 + accentBoost * 1.5);
    const filterPeak = Math.min(20000, baseCutoffHz * (1 + envDepth * 10));

    const fAttack  = adsrTimeMap(params.filterEnv.attack);
    const fDecay   = adsrTimeMap(params.filterEnv.decay);
    const fSustain = params.filterEnv.sustain;
    const fRelease = adsrTimeMap(params.filterEnv.release);
    const fSustainHz = Math.max(20, baseCutoffHz * (fSustain + 0.1));

    if (this.useWorklet && this.filter instanceof AudioWorkletNode) {
      const freqParam = this.filter.parameters.get('frequency');
      const resParam  = this.filter.parameters.get('resonance');
      if (freqParam) {
        freqParam.cancelScheduledValues(time);
        freqParam.setValueAtTime(Math.max(20, baseCutoffHz), time);
        freqParam.linearRampToValueAtTime(filterPeak, time + fAttack);
        freqParam.setTargetAtTime(fSustainHz, time + fAttack, fDecay / 3);
      }
      if (resParam) {
        resParam.setValueAtTime(params.resonance * 4, time);
      }
    } else if (this.filter instanceof BiquadFilterNode) {
      this.filter.frequency.cancelScheduledValues(time);
      this.filter.frequency.setValueAtTime(Math.max(20, baseCutoffHz), time);
      this.filter.frequency.linearRampToValueAtTime(filterPeak, time + fAttack);
      this.filter.frequency.setTargetAtTime(fSustainHz, time + fAttack, fDecay / 3);
      this.filter.Q.value = params.resonance * 20;
    }

    // Store fRelease on the VCA release for consistency (used below)
    void fRelease;

    // --- Amp envelope ---
    const vcaLevel = params.volume * (1 + accentBoost * 0.5);
    const aAttack  = adsrTimeMap(params.ampEnv.attack);
    const aDecay   = adsrTimeMap(params.ampEnv.decay);
    const aSustain = params.ampEnv.sustain * vcaLevel;
    const aRelease = adsrTimeMap(params.ampEnv.release);

    this.vca!.gain.cancelScheduledValues(time);
    this.vca!.gain.setValueAtTime(0, time);
    this.vca!.gain.linearRampToValueAtTime(vcaLevel, time + aAttack);
    this.vca!.gain.setTargetAtTime(aSustain, time + aAttack, aDecay / 3);

    // Schedule release (approximate step length as ~0.125s at 120 BPM; use aRelease after)
    const stepDuration = 0.125;
    this.vca!.gain.setTargetAtTime(0, time + stepDuration, aRelease / 3);

    this.prevStep = synthStep;
  }

  // --- Internal ---

  private emit(partial: Partial<SynthSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
