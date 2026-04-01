import type {
  SubtractorSnapshot,
  SubtractorPatternPreset,
  SubtractorSoundPreset,
  SubOscParams,
  FilterParams,
  ADSRParams,
  ModSlot,
} from './subtractorTypes';
import {
  createDefaultSubtractorPattern,
  DEFAULT_SUBTRACTOR_PARAMS,
  NUM_SUBTRACTOR_STEPS,
  midiToFreq,
  adsrTimeMap,
} from './subtractorTypes';
import type { Filter1Mode } from './subtractorTypes';
import { SubtractorPresetStorage } from './subtractorPresetStorage';
import { createWaveform } from './waveforms';
import type { TransportManager } from '../TransportManager';
import type { MixerEngine } from '../MixerEngine';

export const SUBTRACTOR_MIXER_CHANNEL = 3;

// Native oscillator type lookup for waveform indices 0-3
const NATIVE_TYPES: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];

export class SubtractorEngine {
  private listeners = new Set<() => void>();
  private snapshot: SubtractorSnapshot;
  private mixer: MixerEngine;

  // Persistent audio nodes (lazily created on first tick)
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc1Gain: GainNode | null = null;
  private osc2Gain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private ringModGain: GainNode | null = null;
  private fmGain: GainNode | null = null;
  private oscSum: GainNode | null = null;
  private filter1: AudioWorkletNode | BiquadFilterNode | null = null;
  private filter2: AudioWorkletNode | BiquadFilterNode | null = null;
  private vca: GainNode | null = null;
  private lfo1: OscillatorNode | null = null;
  private lfo2: OscillatorNode | null = null;
  private useFilter1Worklet = true;
  private useFilter2Worklet = true;
  private audioCtx: AudioContext | null = null;

  // Track previous step for slide/portamento logic
  private prevNote: number | null = null;

  constructor(transport: TransportManager, mixer: MixerEngine) {
    this.mixer = mixer;
    this.snapshot = {
      pattern: createDefaultSubtractorPattern(),
      params: structuredClone(DEFAULT_SUBTRACTOR_PARAMS),
      presets: {
        patterns: SubtractorPresetStorage.getPatternPresets(),
        sounds: SubtractorPresetStorage.getSoundPresets(),
        activePatternId: null,
        activeSoundId: null,
      },
    };

    mixer.assignChannel(SUBTRACTOR_MIXER_CHANNEL, 'GC-3');

    transport.registerTickCallback((ctx, time, step) =>
      this.onTick(ctx, time, step),
    );
  }

  // ---------------------------------------------------------------------------
  // Subscription API
  // ---------------------------------------------------------------------------

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): SubtractorSnapshot => {
    return this.snapshot;
  };

  // ---------------------------------------------------------------------------
  // Pattern editing — all dirty activePatternId
  // ---------------------------------------------------------------------------

  setNote(step: number, note: number): void {
    const clamped = Math.max(0, Math.min(127, note));
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], note: clamped };
    this.emit({
      pattern: { ...this.snapshot.pattern, steps: newSteps },
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  setVelocity(step: number, velocity: number): void {
    const clamped = Math.max(0, Math.min(127, velocity));
    const newSteps = [...this.snapshot.pattern.steps];
    newSteps[step] = { ...newSteps[step], velocity: clamped };
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

  // ---------------------------------------------------------------------------
  // Param editing — all dirty activeSoundId
  // ---------------------------------------------------------------------------

  setOscParam(osc: 1 | 2, param: keyof SubOscParams, value: SubOscParams[keyof SubOscParams]): void {
    const key = osc === 1 ? 'osc1' : 'osc2';
    this.emit({
      params: {
        ...this.snapshot.params,
        [key]: { ...this.snapshot.params[key], [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });

    // Apply waveform change to live oscillator
    if (param === 'waveform') {
      const oscNode = osc === 1 ? this.osc1 : this.osc2;
      if (oscNode && this.audioCtx) {
        this.applyWaveform(oscNode, value as number);
      }
    }
  }

  private applyWaveform(osc: OscillatorNode, waveformIndex: number): void {
    if (waveformIndex <= 3) {
      osc.type = NATIVE_TYPES[waveformIndex];
    } else if (this.audioCtx) {
      const wave = createWaveform(this.audioCtx, waveformIndex);
      if (wave) osc.setPeriodicWave(wave);
    }
  }

  setFilterParam(filter: 1 | 2, param: keyof FilterParams, value: number): void {
    const key = filter === 1 ? 'filter1' : 'filter2';
    this.emit({
      params: {
        ...this.snapshot.params,
        [key]: { ...this.snapshot.params[key], [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setFilter1Mode(mode: Filter1Mode): void {
    this.emit({
      params: { ...this.snapshot.params, filter1Mode: mode },
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

  setFilterEnv(param: keyof ADSRParams, value: number): void {
    this.emit({
      params: {
        ...this.snapshot.params,
        filterEnv: { ...this.snapshot.params.filterEnv, [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setFilterEnvDepth(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, filterEnvDepth: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setModEnv(param: keyof ADSRParams, value: number): void {
    this.emit({
      params: {
        ...this.snapshot.params,
        modEnv: { ...this.snapshot.params.modEnv, [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setLFOParam(lfo: 1 | 2, param: string, value: string | number | boolean): void {
    const key = lfo === 1 ? 'lfo1' : 'lfo2';
    this.emit({
      params: {
        ...this.snapshot.params,
        [key]: { ...this.snapshot.params[key], [param]: value },
      },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setModSlot(index: number, slot: ModSlot): void {
    const newMatrix = [...this.snapshot.params.modMatrix] as typeof this.snapshot.params.modMatrix;
    newMatrix[index] = { ...slot };
    this.emit({
      params: { ...this.snapshot.params, modMatrix: newMatrix },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setPortamento(mode: string, rate?: number): void {
    const updates: Partial<typeof this.snapshot.params> = { portamentoMode: mode as 'off' | 'on' | 'auto' };
    if (rate !== undefined) {
      updates.portamentoRate = rate;
    }
    this.emit({
      params: { ...this.snapshot.params, ...updates },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setFmAmount(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, fmAmount: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setRingModLevel(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, ringModLevel: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setNoiseLevel(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, noiseLevel: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setOscMix(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, oscMix: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  setVolume(value: number): void {
    this.emit({
      params: { ...this.snapshot.params, volume: value },
      presets: { ...this.snapshot.presets, activeSoundId: null },
    });
  }

  // ---------------------------------------------------------------------------
  // Pattern preset methods
  // ---------------------------------------------------------------------------

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
    const preset: SubtractorPatternPreset = {
      id,
      name,
      builtIn: false,
      steps: structuredClone(this.snapshot.pattern.steps),
    };
    SubtractorPresetStorage.savePatternPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: SubtractorPresetStorage.getPatternPresets(),
        activePatternId: id,
      },
    });
  }

  deletePatternPreset(id: string): void {
    SubtractorPresetStorage.deletePatternPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: SubtractorPresetStorage.getPatternPresets(),
        activePatternId:
          this.snapshot.presets.activePatternId === id
            ? null
            : this.snapshot.presets.activePatternId,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Sound preset methods
  // ---------------------------------------------------------------------------

  loadSoundPreset(id: string): void {
    const preset = this.snapshot.presets.sounds.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      params: structuredClone(preset.params),
      presets: { ...this.snapshot.presets, activeSoundId: id },
    });
  }

  saveSoundPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: SubtractorSoundPreset = {
      id,
      name,
      builtIn: false,
      params: structuredClone(this.snapshot.params),
    };
    SubtractorPresetStorage.saveSoundPreset(preset);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        sounds: SubtractorPresetStorage.getSoundPresets(),
        activeSoundId: id,
      },
    });
  }

  deleteSoundPreset(id: string): void {
    SubtractorPresetStorage.deleteSoundPreset(id);
    this.emit({
      presets: {
        ...this.snapshot.presets,
        sounds: SubtractorPresetStorage.getSoundPresets(),
        activeSoundId:
          this.snapshot.presets.activeSoundId === id
            ? null
            : this.snapshot.presets.activeSoundId,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Tick handler (synthesis)
  // ---------------------------------------------------------------------------

  private onTick(ctx: AudioContext, time: number, step: number): void {
    const dest = this.mixer.getChannelInput(SUBTRACTOR_MIXER_CHANNEL);
    if (!dest) return;

    // Lazily create persistent nodes on first tick
    if (!this.vca) {
      this.initNodes(ctx, dest);
    }

    const params = this.snapshot.params;
    const seqStep = this.snapshot.pattern.steps[step % NUM_SUBTRACTOR_STEPS];

    if (seqStep.gate === 'rest') {
      // Release amp envelope
      this.vca!.gain.cancelScheduledValues(time);
      this.vca!.gain.setTargetAtTime(0, time, adsrTimeMap(params.ampEnv.release) / 3);
      this.prevNote = null;
      return;
    }

    if (seqStep.gate === 'tie') {
      // Sustain — no re-trigger
      return;
    }

    // gate === 'note' — trigger all envelopes and set pitch
    const velocity = seqStep.velocity / 127;

    // --- Frequency calculation ---
    const note1 = seqStep.note + params.osc1.octave * 12 + params.osc1.semitone;
    const note2 = seqStep.note + params.osc2.octave * 12 + params.osc2.semitone;
    const freq1 = midiToFreq(Math.max(0, Math.min(127, note1))) *
      Math.pow(2, params.osc1.fineTune / 1200);
    const freq2 = midiToFreq(Math.max(0, Math.min(127, note2))) *
      Math.pow(2, params.osc2.fineTune / 1200);

    // --- Portamento ---
    const portMode = params.portamentoMode;
    const portTime = adsrTimeMap(params.portamentoRate);
    const hasPrevNote = this.prevNote !== null;

    if (portMode === 'on' || (portMode === 'auto' && hasPrevNote && seqStep.slide)) {
      // Glide to new frequency
      this.osc1!.frequency.cancelScheduledValues(time);
      this.osc1!.frequency.setValueAtTime(this.osc1!.frequency.value, time);
      this.osc1!.frequency.exponentialRampToValueAtTime(Math.max(1, freq1), time + portTime);

      this.osc2!.frequency.cancelScheduledValues(time);
      this.osc2!.frequency.setValueAtTime(this.osc2!.frequency.value, time);
      this.osc2!.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), time + portTime);
    } else {
      this.osc1!.frequency.cancelScheduledValues(time);
      this.osc1!.frequency.setValueAtTime(Math.max(1, freq1), time);

      this.osc2!.frequency.cancelScheduledValues(time);
      this.osc2!.frequency.setValueAtTime(Math.max(1, freq2), time);
    }

    // --- Oscillator mix ---
    const osc1Level = params.osc1.level * (1 - params.oscMix);
    const osc2Level = params.osc2.level * params.oscMix;
    this.osc1Gain!.gain.setValueAtTime(osc1Level, time);
    this.osc2Gain!.gain.setValueAtTime(osc2Level, time);
    this.noiseGain!.gain.setValueAtTime(params.noiseLevel, time);
    this.ringModGain!.gain.setValueAtTime(params.ringModLevel, time);
    this.fmGain!.gain.setValueAtTime(params.fmAmount * 200, time); // scale to Hz range

    // --- Velocity-based mod matrix ---
    for (const slot of params.modMatrix) {
      if (slot.source === 'velocity' && slot.destination === 'ampLevel') {
        const velMod = slot.amount * velocity;
        const baseLevel = params.volume;
        this.vca!.gain.setValueAtTime(Math.max(0, baseLevel + velMod), time);
      }
    }

    // --- Filter 1 envelope ---
    const f1Cutoff = params.filter1.cutoff;
    const baseCutoff1Hz = 20 * Math.pow(1000, f1Cutoff);
    const envDepth = params.filterEnvDepth;
    const filterPeak1 = Math.max(20, Math.min(20000, baseCutoff1Hz * (1 + Math.max(0, envDepth) * 10)));
    const fSustainHz1 = Math.max(20, baseCutoff1Hz * (params.filterEnv.sustain + 0.1));

    const fAttack  = adsrTimeMap(params.filterEnv.attack);
    const fDecay   = adsrTimeMap(params.filterEnv.decay);
    const fRelease = adsrTimeMap(params.filterEnv.release);
    void fRelease;

    // Keyboard tracking: adjust cutoff based on note relative to C4 (MIDI 60)
    const keyTrackOffset1 = (seqStep.note - 60) * params.filter1.keyTrack * 0.01;
    const trackedCutoff1 = Math.min(20000, Math.max(20, baseCutoff1Hz * Math.pow(2, keyTrackOffset1)));

    if (this.useFilter1Worklet && this.filter1 instanceof AudioWorkletNode) {
      const freqParam = this.filter1.parameters.get('frequency');
      const resParam  = this.filter1.parameters.get('resonance');
      if (freqParam) {
        freqParam.cancelScheduledValues(time);
        freqParam.setValueAtTime(Math.max(20, trackedCutoff1), time);
        freqParam.linearRampToValueAtTime(filterPeak1, time + fAttack);
        freqParam.setTargetAtTime(fSustainHz1, time + fAttack, fDecay / 3);
      }
      if (resParam) {
        resParam.cancelScheduledValues(time);
        resParam.setValueAtTime(Math.min(4, params.filter1.resonance * 4), time);
      }
    } else if (this.filter1 instanceof BiquadFilterNode) {
      this.filter1.frequency.cancelScheduledValues(time);
      this.filter1.frequency.setValueAtTime(Math.max(20, trackedCutoff1), time);
      this.filter1.frequency.linearRampToValueAtTime(filterPeak1, time + fAttack);
      this.filter1.frequency.setTargetAtTime(fSustainHz1, time + fAttack, fDecay / 3);
      this.filter1.Q.value = params.filter1.resonance * 20;
    }

    // --- Filter 2 ---
    const f2Cutoff = params.filter2.cutoff;
    const baseCutoff2Hz = 20 * Math.pow(1000, f2Cutoff);
    const keyTrackOffset2 = (seqStep.note - 60) * params.filter2.keyTrack * 0.01;
    const trackedCutoff2 = Math.min(20000, Math.max(20, baseCutoff2Hz * Math.pow(2, keyTrackOffset2)));

    if (this.useFilter2Worklet && this.filter2 instanceof AudioWorkletNode) {
      const freqParam = this.filter2.parameters.get('frequency');
      const resParam  = this.filter2.parameters.get('resonance');
      if (freqParam) {
        freqParam.cancelScheduledValues(time);
        freqParam.setValueAtTime(trackedCutoff2, time);
      }
      if (resParam) {
        resParam.cancelScheduledValues(time);
        resParam.setValueAtTime(params.filter2.resonance * 2, time);
      }
    } else if (this.filter2 instanceof BiquadFilterNode) {
      this.filter2.frequency.cancelScheduledValues(time);
      this.filter2.frequency.setValueAtTime(trackedCutoff2, time);
      this.filter2.Q.value = params.filter2.resonance * 20;
    }

    // --- Amp envelope ---
    const ampAttack  = adsrTimeMap(params.ampEnv.attack);
    const ampDecay   = adsrTimeMap(params.ampEnv.decay);
    const ampSustain = params.ampEnv.sustain * params.volume * velocity;
    const ampRelease = adsrTimeMap(params.ampEnv.release);

    this.vca!.gain.cancelScheduledValues(time);
    this.vca!.gain.setValueAtTime(0, time);
    this.vca!.gain.linearRampToValueAtTime(params.volume * velocity, time + ampAttack);
    this.vca!.gain.setTargetAtTime(ampSustain, time + ampAttack, ampDecay / 3);

    // Schedule release (approximate step duration at 120 BPM = 0.125s)
    const stepDuration = 0.125;
    this.vca!.gain.setTargetAtTime(0, time + stepDuration, ampRelease / 3);

    this.prevNote = seqStep.note;
  }

  // ---------------------------------------------------------------------------
  // Node initialisation
  // ---------------------------------------------------------------------------

  private initNodes(ctx: AudioContext, dest: AudioNode): void {
    this.audioCtx = ctx;
    const p = this.snapshot.params;

    // --- Oscillator 1 ---
    this.osc1 = ctx.createOscillator();
    if (p.osc1.waveform <= 3) {
      this.osc1.type = NATIVE_TYPES[p.osc1.waveform];
    } else {
      const wave = createWaveform(ctx, p.osc1.waveform);
      if (wave) this.osc1.setPeriodicWave(wave);
    }
    this.osc1.frequency.value = midiToFreq(48);

    // --- Oscillator 2 ---
    this.osc2 = ctx.createOscillator();
    if (p.osc2.waveform <= 3) {
      this.osc2.type = NATIVE_TYPES[p.osc2.waveform];
    } else {
      const wave = createWaveform(ctx, p.osc2.waveform);
      if (wave) this.osc2.setPeriodicWave(wave);
    }
    this.osc2.frequency.value = midiToFreq(48);

    // --- Osc gain nodes ---
    this.osc1Gain = ctx.createGain();
    this.osc1Gain.gain.value = p.osc1.level * (1 - p.oscMix);
    this.osc2Gain = ctx.createGain();
    this.osc2Gain.gain.value = p.osc2.level * p.oscMix;

    // --- Noise source ---
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

    // --- FM: osc2 → fmGain → osc1.frequency ---
    this.fmGain = ctx.createGain();
    this.fmGain.gain.value = p.fmAmount * 200;

    // --- Ring mod: multiply osc1 * osc2 via gain ---
    this.ringModGain = ctx.createGain();
    this.ringModGain.gain.value = p.ringModLevel;

    // --- Osc sum node ---
    this.oscSum = ctx.createGain();
    this.oscSum.gain.value = 1;

    // --- LFO 1 ---
    this.lfo1 = ctx.createOscillator();
    this.lfo1.type = p.lfo1.waveform === 'square' ? 'square' : 'triangle';
    this.lfo1.frequency.value = p.lfo1.rate * 20; // 0-1 → 0-20 Hz

    // --- LFO 2 ---
    this.lfo2 = ctx.createOscillator();
    this.lfo2.type = p.lfo2.waveform === 'square' ? 'square' : 'triangle';
    this.lfo2.frequency.value = p.lfo2.rate * 20;

    // --- Filter 1 ---
    try {
      this.filter1 = new AudioWorkletNode(ctx, 'subtractor-filter1');
      this.useFilter1Worklet = true;
    } catch {
      const biquad = ctx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.value = 20 * Math.pow(1000, p.filter1.cutoff);
      biquad.Q.value = p.filter1.resonance * 20;
      this.filter1 = biquad;
      this.useFilter1Worklet = false;
    }

    // --- Filter 2 ---
    try {
      this.filter2 = new AudioWorkletNode(ctx, 'subtractor-filter2');
      this.useFilter2Worklet = true;
    } catch {
      const biquad = ctx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.value = 20 * Math.pow(1000, p.filter2.cutoff);
      biquad.Q.value = p.filter2.resonance * 20;
      this.filter2 = biquad;
      this.useFilter2Worklet = false;
    }

    // --- VCA ---
    this.vca = ctx.createGain();
    this.vca.gain.value = 0;

    // --- Signal chain wiring ---
    // FM routing: osc2 → fmGain → osc1.frequency
    this.osc2.connect(this.fmGain);
    this.fmGain.connect(this.osc1.frequency);

    // Ring mod: osc2 modulates osc1 output via gain node
    // osc1 → oscSum
    // osc1 → ringModGain (osc2 controls gain) → oscSum
    this.osc1.connect(this.osc1Gain);
    this.osc2.connect(this.osc2Gain!);
    this.noiseSource.connect(this.noiseGain);
    this.osc2.connect(this.ringModGain.gain); // ring mod: osc2 controls ring gain

    this.osc1Gain.connect(this.oscSum);
    this.osc2Gain!.connect(this.oscSum);
    this.noiseGain.connect(this.oscSum);
    this.ringModGain.connect(this.oscSum);

    // oscSum → filter1 → filter2 → vca → dest
    this.oscSum.connect(this.filter1);
    this.filter1.connect(this.filter2);
    this.filter2.connect(this.vca);
    this.vca.connect(dest);

    // Start all running nodes
    this.osc1.start();
    this.osc2.start();
    this.noiseSource.start();
    this.lfo1.start();
    this.lfo2.start();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private emit(partial: Partial<SubtractorSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
