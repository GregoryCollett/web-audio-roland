# GC-SUB Subtractor Synthesizer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Reason Subtractor-inspired synthesizer with 32 waveforms, dual custom filter worklets, three ADSR envelopes, two LFOs, 8-slot mod matrix, FM/ring mod, portamento, and per-step velocity sequencer.

**Architecture:** `SubtractorEngine` follows the established pattern (subscribe/getSnapshot, tick callback from TransportManager, mixer channel 4). Two new AudioWorklet processors: SVF multimode filter and Butterworth LP. Reuses `ADSRParams`, `midiToFreq`, `midiToName`, `adsrTimeMap` from `synthTypes.ts`. 9 UI components in `components/subtractor/` using shared `Knob`, `Fader`, `PresetSelector`, `Playhead`.

**Tech Stack:** TypeScript, React 19, Web Audio API, AudioWorklet, Vitest

**Spec:** `docs/superpowers/specs/2026-04-01-subtractor-design.md`

---

## File Map

### Phase 1: Types + Waveforms
```
src/engine/subtractor/
  subtractorTypes.ts          — SubOscParams, LFOParams, ModSlot, FilterParams, SubtractorParams,
                                SubtractorStep, SubtractorPattern, SubtractorSnapshot, preset types,
                                defaults, constants
  waveforms.ts                — 32 PeriodicWave definitions, createWaveform(), WAVEFORM_NAMES
```

### Phase 2: Filter Worklets
```
public/worklets/
  subtractor-filter1-processor.js  — SVF multimode (LP12/LP24/HP/BP/Notch)
  subtractor-filter2-processor.js  — Butterworth LP
src/engine/subtractor/
  subtractorFilter1.ts        — SVFFilter DSP class (for tests)
  subtractorFilter2.ts        — ButterworthLP DSP class (for tests)
  __tests__/
    subtractorFilter1.test.ts
    subtractorFilter2.test.ts
```

### Phase 3: Engine + Presets
```
src/engine/subtractor/
  SubtractorEngine.ts
  defaultSubtractorPresets.ts  — 12 patterns + 16 sounds
  subtractorPresetStorage.ts
  __tests__/
    SubtractorEngine.test.ts
    subtractorPresetStorage.test.ts
```

### Phase 4: Hooks + UI
```
src/hooks/
  useSubtractor.ts
src/components/subtractor/
  SubtractorSection.tsx
  SubtractorHeader.tsx
  SubtractorOscSection.tsx
  SubtractorFilterSection.tsx
  SubtractorAmpSection.tsx
  SubtractorModSection.tsx
  SubtractorModMatrix.tsx
  SubtractorStepGrid.tsx
  SubtractorStepEditor.tsx
```

### Phase 5: Integration
```
src/engine/TransportManager.ts  — register two new worklets
src/hooks/useKeyboard.ts        — add 'subtractor' focus, V+arrow velocity
src/components/App.tsx           — add SubtractorSection
src/styles/index.css             — subtractor styles
```

---

## Phase 1: Types + Waveforms

### Task 1: Subtractor Types

**Files:**
- Create: `src/engine/subtractor/subtractorTypes.ts`

- [ ] **Step 1: Create the types file**

All Subtractor-specific types and defaults. Reuses `ADSRParams` from `../synth/synthTypes`. Contains:

```ts
import type { ADSRParams } from '../synth/synthTypes';
export type { ADSRParams };
export { midiToFreq, midiToName, adsrTimeMap } from '../synth/synthTypes';

export interface SubOscParams {
  waveform: number;      // 0-31
  octave: number;        // -2 to +2
  semitone: number;      // -12 to +12
  fineTune: number;      // -50 to +50 cents
  pulseWidth: number;    // 0-1
  level: number;         // 0-1
}

export interface LFOParams {
  waveform: 'triangle' | 'sawtooth' | 'square' | 'random';
  rate: number;
  delay: number;
  keySync: boolean;
}

export interface ModSlot {
  source: 'lfo1' | 'lfo2' | 'modEnv' | 'velocity' | 'none';
  destination: string;
  amount: number;        // -1 to +1
}

export interface FilterParams {
  cutoff: number;
  resonance: number;
  keyTrack: number;
}

export type Filter1Mode = 'lp12' | 'lp24' | 'hp12' | 'bp12' | 'notch';

export interface SubtractorParams {
  osc1: SubOscParams;
  osc2: SubOscParams;
  noiseLevel: number;
  ringModLevel: number;
  fmAmount: number;
  oscMix: number;
  filter1: FilterParams;
  filter1Mode: Filter1Mode;
  filter2: FilterParams;
  filterEnv: ADSRParams;
  filterEnvDepth: number;
  ampEnv: ADSRParams;
  modEnv: ADSRParams;
  modMatrix: ModSlot[];
  lfo1: LFOParams;
  lfo2: LFOParams;
  portamentoMode: 'off' | 'on' | 'auto';
  portamentoRate: number;
  volume: number;
}

export interface SubtractorStep {
  note: number;
  velocity: number;     // 0-127
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface SubtractorPattern { steps: SubtractorStep[]; }

export interface SubtractorSnapshot {
  pattern: SubtractorPattern;
  params: SubtractorParams;
  presets: {
    patterns: SubtractorPatternPreset[];
    sounds: SubtractorSoundPreset[];
    activePatternId: string | null;
    activeSoundId: string | null;
  };
}

export interface SubtractorPatternPreset { id: string; name: string; builtIn: boolean; steps: SubtractorStep[]; }
export interface SubtractorSoundPreset { id: string; name: string; builtIn: boolean; params: SubtractorParams; }

export const NUM_SUBTRACTOR_STEPS = 16;

export const MOD_DESTINATIONS = [
  'osc1Pitch', 'osc2Pitch', 'osc1PW', 'osc2PW', 'oscMix', 'fmAmount',
  'filter1Cutoff', 'filter1Resonance', 'filter2Cutoff', 'ampLevel', 'lfo1Rate', 'lfo2Rate',
] as const;
export type ModDestination = typeof MOD_DESTINATIONS[number];

export const FILTER1_MODES: Filter1Mode[] = ['lp12', 'lp24', 'hp12', 'bp12', 'notch'];

export const DEFAULT_SUB_OSC: SubOscParams = {
  waveform: 2, octave: 0, semitone: 0, fineTune: 0, pulseWidth: 0.5, level: 0.8,
};

export const DEFAULT_ADSR: ADSRParams = { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 };

export const DEFAULT_LFO: LFOParams = { waveform: 'triangle', rate: 0.3, delay: 0, keySync: false };

export function createEmptyModMatrix(): ModSlot[] {
  return Array.from({ length: 8 }, () => ({ source: 'none' as const, destination: 'filter1Cutoff', amount: 0 }));
}

export const DEFAULT_SUBTRACTOR_PARAMS: SubtractorParams = {
  osc1: { ...DEFAULT_SUB_OSC },
  osc2: { ...DEFAULT_SUB_OSC, octave: -1 },
  noiseLevel: 0, ringModLevel: 0, fmAmount: 0, oscMix: 0.5,
  filter1: { cutoff: 0.6, resonance: 0.2, keyTrack: 0.5 },
  filter1Mode: 'lp24',
  filter2: { cutoff: 0.8, resonance: 0, keyTrack: 0 },
  filterEnv: { ...DEFAULT_ADSR }, filterEnvDepth: 0.5,
  ampEnv: { ...DEFAULT_ADSR },
  modEnv: { ...DEFAULT_ADSR },
  modMatrix: createEmptyModMatrix(),
  lfo1: { ...DEFAULT_LFO }, lfo2: { ...DEFAULT_LFO, keySync: true },
  portamentoMode: 'off', portamentoRate: 0.3,
  volume: 0.8,
};

export function createDefaultSubtractorPattern(): SubtractorPattern {
  return {
    steps: Array.from({ length: NUM_SUBTRACTOR_STEPS }, () => ({
      note: 48, velocity: 100, slide: false, gate: 'rest' as const,
    })),
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/engine/subtractor/subtractorTypes.ts
git commit -m "feat: add Subtractor synthesizer types"
```

---

### Task 2: Waveforms

**Files:**
- Create: `src/engine/subtractor/waveforms.ts`

- [ ] **Step 1: Create the waveforms file**

Exports `WAVEFORM_NAMES: string[]` (32 entries) and `createWaveform(ctx: AudioContext, index: number): PeriodicWave | null`.

For indices 0-3 (sine, triangle, sawtooth, square), returns `null` — the engine sets `OscillatorNode.type` directly.

For indices 4-31, creates a `PeriodicWave` using `ctx.createPeriodicWave(real, imag)` with appropriate Fourier coefficients:

- **Pulse waves (4-5):** Set harmonics to `sin(n * PI * dutyCycle) / n` for varying duty cycles
- **Half-saw, Ramp (6-7):** Modified sawtooth harmonic series
- **Supersaw (8):** Sum of slightly detuned saw harmonics
- **Sync waves (9-10):** Harmonics that simulate hard sync timbres
- **FM bells/metallic (11-12):** Inharmonic partials from FM synthesis ratios
- **Organs (13-15):** Specific drawbar harmonic combinations
- **Formants (16-19):** Harmonic amplitudes shaped by vowel formant frequencies
- **Acoustic (20-23):** Harmonic series matching brass/string/pluck/reed spectra
- **Noise-like (24-25):** Many random-amplitude harmonics
- **Digital (26-28):** Quantized/aliased harmonic patterns
- **Harmonic (29-30):** Odd-only or even-only harmonic series
- **Sub (31):** Strong fundamental + sub-octave (harmonics 1 and 0.5 approximated)

Use 64 harmonics for each PeriodicWave definition. The Fourier coefficients are precomputed arrays.

The implementer should create all 32 waveform definitions with musically useful harmonic content. Each waveform should be distinctly audible from the others.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/engine/subtractor/waveforms.ts
git commit -m "feat: add 32 oscillator waveforms for Subtractor"
```

---

## Phase 2: Filter Worklets

### Task 3: SVF Multimode Filter (Filter 1)

**Files:**
- Create: `src/engine/subtractor/subtractorFilter1.ts` — DSP class for tests
- Create: `public/worklets/subtractor-filter1-processor.js` — worklet processor
- Create: `src/engine/subtractor/__tests__/subtractorFilter1.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock worklet globals
vi.stubGlobal('sampleRate', 44100);
vi.stubGlobal('AudioWorkletProcessor', class {});
vi.stubGlobal('registerProcessor', vi.fn());

const { SVFFilter } = await import('../subtractorFilter1');

describe('SVFFilter', () => {
  const SR = 44100;

  it('LP12 attenuates high frequencies', () => {
    const f = new SVFFilter(SR);
    f.setCutoff(200); f.setResonance(0); f.setMode(0); // LP12
    let peak = 0;
    for (let i = 0; i < SR; i++) {
      const input = Math.sin(2 * Math.PI * 5000 * i / SR);
      peak = Math.max(peak, Math.abs(f.process(input)));
    }
    expect(peak).toBeLessThan(0.1);
  });

  it('LP24 attenuates more steeply than LP12', () => {
    const f12 = new SVFFilter(SR);
    f12.setCutoff(500); f12.setResonance(0); f12.setMode(0);
    const f24 = new SVFFilter(SR);
    f24.setCutoff(500); f24.setResonance(0); f24.setMode(1);
    let peak12 = 0, peak24 = 0;
    for (let i = 0; i < SR; i++) {
      const input = Math.sin(2 * Math.PI * 2000 * i / SR);
      peak12 = Math.max(peak12, Math.abs(f12.process(input)));
      peak24 = Math.max(peak24, Math.abs(f24.process(input)));
    }
    expect(peak24).toBeLessThan(peak12);
  });

  it('HP12 passes high frequencies', () => {
    const f = new SVFFilter(SR);
    f.setCutoff(200); f.setResonance(0); f.setMode(2); // HP12
    let peak = 0;
    for (let i = 0; i < SR; i++) {
      const input = Math.sin(2 * Math.PI * 5000 * i / SR);
      peak = Math.max(peak, Math.abs(f.process(input)));
    }
    expect(peak).toBeGreaterThan(0.5);
  });

  it('BP12 passes frequencies near cutoff', () => {
    const f = new SVFFilter(SR);
    f.setCutoff(1000); f.setResonance(1); f.setMode(3); // BP12
    let peakNear = 0, peakFar = 0;
    for (let i = 0; i < SR; i++) {
      peakNear = Math.max(peakNear, Math.abs(f.process(Math.sin(2 * Math.PI * 1000 * i / SR))));
    }
    const f2 = new SVFFilter(SR);
    f2.setCutoff(1000); f2.setResonance(1); f2.setMode(3);
    for (let i = 0; i < SR; i++) {
      peakFar = Math.max(peakFar, Math.abs(f2.process(Math.sin(2 * Math.PI * 100 * i / SR))));
    }
    expect(peakNear).toBeGreaterThan(peakFar);
  });

  it('resonance creates peak', () => {
    const fNoRes = new SVFFilter(SR);
    fNoRes.setCutoff(1000); fNoRes.setResonance(0); fNoRes.setMode(0);
    const fHiRes = new SVFFilter(SR);
    fHiRes.setCutoff(1000); fHiRes.setResonance(3); fHiRes.setMode(0);
    let peakNo = 0, peakHi = 0;
    for (let i = 0; i < SR; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SR);
      peakNo = Math.max(peakNo, Math.abs(fNoRes.process(input)));
      peakHi = Math.max(peakHi, Math.abs(fHiRes.process(input)));
    }
    expect(peakHi).toBeGreaterThan(peakNo);
  });

  it('output stays bounded', () => {
    const f = new SVFFilter(SR);
    f.setCutoff(3000); f.setResonance(3.8); f.setMode(0);
    let maxOut = 0;
    for (let i = 0; i < SR; i++) {
      maxOut = Math.max(maxOut, Math.abs(f.process(Math.sin(2 * Math.PI * 200 * i / SR) * 2)));
    }
    expect(maxOut).toBeLessThan(15);
  });
});
```

- [ ] **Step 2: Implement SVFFilter DSP class**

Create `src/engine/subtractor/subtractorFilter1.ts`:

A state-variable filter with two stages. Modes select which output to use:
- LP12: stage1.low
- LP24: stage2.low (stage1.low feeds stage2)
- HP12: stage1.high
- BP12: stage1.band
- Notch: stage1.notch

Each stage maintains `low`, `high`, `band` state variables. The SVF update per sample:
```
high = input - low - q * band
band = band + f * high
low = low + f * band
notch = high + low
```
Where `f = 2 * sin(PI * cutoff / sampleRate)` and `q = 1/resonance`.

Export the class for test imports.

- [ ] **Step 3: Create the production worklet JS**

Create `public/worklets/subtractor-filter1-processor.js` — plain JS version of the same DSP inlined into an `AudioWorkletProcessor`. Registered as `'subtractor-filter1'`. AudioParams: `frequency`, `resonance`, `mode`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/subtractor/__tests__/subtractorFilter1.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/subtractor/subtractorFilter1.ts public/worklets/subtractor-filter1-processor.js src/engine/subtractor/__tests__/subtractorFilter1.test.ts
git commit -m "feat: add SVF multimode filter worklet for Subtractor"
```

---

### Task 4: Butterworth LP Filter (Filter 2)

**Files:**
- Create: `src/engine/subtractor/subtractorFilter2.ts`
- Create: `public/worklets/subtractor-filter2-processor.js`
- Create: `src/engine/subtractor/__tests__/subtractorFilter2.test.ts`

- [ ] **Step 1: Write failing tests**

Same pattern as Filter 1 tests but simpler — just LP behavior:
- Attenuates highs at low cutoff
- Passes signal at max cutoff
- Output stays bounded with resonance
- Resonance creates peak near cutoff

- [ ] **Step 2: Implement ButterworthLP DSP class**

`src/engine/subtractor/subtractorFilter2.ts`: 2-pole Butterworth lowpass. Uses the standard biquad coefficient calculation for a Butterworth LP. AudioParams: `frequency` (20-20000), `resonance` (0-2).

- [ ] **Step 3: Create the production worklet JS**

`public/worklets/subtractor-filter2-processor.js` — registered as `'subtractor-filter2'`.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/engine/subtractor/__tests__/subtractorFilter2.test.ts
git add src/engine/subtractor/subtractorFilter2.ts public/worklets/subtractor-filter2-processor.js src/engine/subtractor/__tests__/subtractorFilter2.test.ts
git commit -m "feat: add Butterworth LP filter worklet for Subtractor"
```

---

### Task 5: Register Worklets in TransportManager

**Files:**
- Modify: `src/engine/TransportManager.ts`

- [ ] **Step 1: Add worklet registration**

After the existing `ir3109-processor.js` registration in `init()`, add:

```ts
await this.ctx.audioWorklet.addModule(`${base}worklets/subtractor-filter1-processor.js`);
await this.ctx.audioWorklet.addModule(`${base}worklets/subtractor-filter2-processor.js`);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/engine/TransportManager.ts
git commit -m "feat: register Subtractor filter worklets"
```

---

## Phase 3: Engine + Presets

### Task 6: Preset Storage + Defaults

**Files:**
- Create: `src/engine/subtractor/defaultSubtractorPresets.ts`
- Create: `src/engine/subtractor/subtractorPresetStorage.ts`
- Create: `src/engine/subtractor/__tests__/subtractorPresetStorage.test.ts`

- [ ] **Step 1: Create default presets**

12 pattern presets and 16 sound presets per the spec. Pattern presets use MIDI notes C3-C5 range (48-72) with varying velocities (40-127). Sound presets configure the full `SubtractorParams` with the characters described in the spec.

The implementer should reference `docs/superpowers/specs/2026-04-01-subtractor-design.md` for the preset descriptions.

- [ ] **Step 2: Create subtractorPresetStorage.ts**

Same pattern as other preset storages. Keys: `tr909-subtractor-pattern-presets`, `tr909-subtractor-sound-presets`. Methods: `getPatternPresets`, `getSoundPresets`, `savePatternPreset`, `saveSoundPreset`, `deletePatternPreset`, `deleteSoundPreset`.

- [ ] **Step 3: Write and run tests**

Same test pattern: returns built-ins when empty, merges user presets, saves, deletes user not built-in.

- [ ] **Step 4: Commit**

```bash
git add src/engine/subtractor/defaultSubtractorPresets.ts src/engine/subtractor/subtractorPresetStorage.ts src/engine/subtractor/__tests__/subtractorPresetStorage.test.ts
git commit -m "feat: add Subtractor preset storage with 12 pattern and 16 sound defaults"
```

---

### Task 7: SubtractorEngine

**Files:**
- Create: `src/engine/subtractor/SubtractorEngine.ts`
- Create: `src/engine/subtractor/__tests__/SubtractorEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Tests for SubtractorEngine following SynthEngine.test.ts pattern:

- Default snapshot (pattern 16 steps, default SubtractorParams, presets populated)
- `setNote(step, note)` updates step
- `setVelocity(step, velocity)` updates step (clamp 0-127)
- `toggleSlide(step)` flips
- `setGate(step, gate)` updates
- `setOscParam(1, 'waveform', 8)` updates osc1
- `setOscParam(2, 'level', 0.5)` updates osc2
- `setFilterParam(1, 'cutoff', 0.8)` updates filter1
- `setFilterParam(2, 'cutoff', 0.5)` updates filter2
- `setFilter1Mode('hp12')` updates
- `setAmpEnv('attack', 0.5)` updates
- `setFilterEnv('decay', 0.2)` updates
- `setFilterEnvDepth(0.8)` updates
- `setModEnv('release', 0.4)` updates
- `setLFOParam(1, 'rate', 0.7)` updates lfo1
- `setLFOParam(2, 'keySync', true)` updates lfo2
- `setModSlot(0, { source: 'lfo1', destination: 'filter1Cutoff', amount: 0.5 })` updates
- `setPortamento('on', 0.5)` updates mode and rate
- `setFmAmount(0.3)` / `setRingModLevel(0.5)` / `setNoiseLevel(0.4)` / `setOscMix(0.7)` / `setVolume(0.6)` update
- Subscribe notifies
- Dirty tracking: pattern edit → activePatternId null
- Dirty tracking: param edit → activeSoundId null
- savePatternPreset / saveSoundPreset creates and sets active
- loadPatternPreset / loadSoundPreset applies
- deletePatternPreset / deleteSoundPreset removes and clears if active

- [ ] **Step 2: Implement SubtractorEngine**

Constructor takes `TransportManager` and `MixerEngine`. `SUBTRACTOR_MIXER_CHANNEL = 3` (channel 4 zero-indexed). Registers tick callback.

**Snapshot management:** Same subscribe/getSnapshot/emit pattern as other engines.

**Pattern methods:** `setNote`, `setVelocity`, `toggleSlide`, `setGate` — all dirty `activePatternId`.

**Param methods:** All dirty `activeSoundId`:
- `setOscParam(osc: 1|2, param: keyof SubOscParams, value)`
- `setFilterParam(filter: 1|2, param: keyof FilterParams, value)`
- `setFilter1Mode(mode: Filter1Mode)`
- `setAmpEnv(param: keyof ADSRParams, value)`
- `setFilterEnv(param: keyof ADSRParams, value)`
- `setFilterEnvDepth(value)`
- `setModEnv(param: keyof ADSRParams, value)`
- `setLFOParam(lfo: 1|2, param: string, value)`
- `setModSlot(index: number, slot: ModSlot)`
- `setPortamento(mode: string, rate?: number)`
- `setFmAmount(value)`, `setRingModLevel(value)`, `setNoiseLevel(value)`, `setOscMix(value)`, `setVolume(value)`

**Preset methods:** Same pattern as SynthEngine.

**Tick handler (synthesis):** On first tick, lazily creates persistent audio nodes:
- Two OscillatorNodes for osc1/osc2 (using `createWaveform()` for custom waveforms)
- Noise source (looping buffer)
- FM: osc2 → gain(fmAmount) → osc1.frequency
- Ring mod: osc1 → gain → output (osc2 modulates the gain)
- Osc mixer: osc1Gain + osc2Gain + noiseGain + ringModGain → summing node
- Filter 1: AudioWorkletNode('subtractor-filter1') with BiquadFilter fallback
- Filter 2: AudioWorkletNode('subtractor-filter2') with BiquadFilter fallback
- VCA gain node
- Two LFO OscillatorNodes (with S&H implemented via ScriptProcessor or message-based approach)
- Mod matrix wiring: for each active slot, connect source → gain(amount) → destination param

Per-step logic:
- `rest`: release all envelopes
- `tie`: sustain, no re-trigger
- `note`: apply portamento (based on mode), trigger all three envelopes, apply velocity-based mod matrix offsets, set oscillator frequencies, update filter envelopes

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/engine/subtractor/__tests__/SubtractorEngine.test.ts`
Expected: All PASS.

Run: `npx vitest run` — full suite passes.

- [ ] **Step 4: Commit**

```bash
git add src/engine/subtractor/SubtractorEngine.ts src/engine/subtractor/__tests__/SubtractorEngine.test.ts
git commit -m "feat: add SubtractorEngine with dual oscs, dual filters, mod matrix, FM, ring mod"
```

---

## Phase 4: Hooks + UI

### Task 8: Subtractor Hooks

**Files:**
- Create: `src/hooks/useSubtractor.ts`

- [ ] **Step 1: Create hooks**

```ts
import { useSyncExternalStore } from 'react';
import { SubtractorEngine } from '../engine/subtractor/SubtractorEngine';
import type { SubtractorSnapshot, SubtractorParams, SubtractorPattern } from '../engine/subtractor/subtractorTypes';
import { transport, mixer } from './useTransport';

export const subtractorEngine = new SubtractorEngine(transport, mixer);

export function useSubtractorPattern(): SubtractorPattern {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().pattern);
}

export function useSubtractorParams(): SubtractorParams {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().params);
}

export function useSubtractorPresets(): SubtractorSnapshot['presets'] {
  return useSyncExternalStore(subtractorEngine.subscribe, () => subtractorEngine.getSnapshot().presets);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSubtractor.ts
git commit -m "feat: add useSubtractor hooks"
```

---

### Task 9: Subtractor UI Components

**Files:**
- Create 9 components in `src/components/subtractor/`

The implementer should create all 9 components following established patterns (SH-2 synth components as reference). All use shared `Knob` from `../shared/Knob`.

**SubtractorHeader.tsx:** "GC-SUB" + "SUBTRACTOR", two PresetSelectors (Pattern + Sound).

**SubtractorOscSection.tsx:** Side-by-side osc1/osc2 panels. Each: waveform display with prev/next cycling (0-31, showing name from `WAVEFORM_NAMES`), octave selector (-2 to +2), semitone selector (-12 to +12), fine tune knob, pulse width knob, level knob. Between them: osc mix knob, FM amount knob, ring mod level knob, noise level knob.

**SubtractorFilterSection.tsx:** Filter 1: mode selector (cycle button: LP12/LP24/HP/BP/NOTCH), cutoff knob, resonance knob, key track knob, env depth knob. Filter ADSR (A/D/S/R knobs). Filter 2: cutoff knob, resonance knob, key track knob.

**SubtractorAmpSection.tsx:** Amp ADSR (A/D/S/R knobs), volume knob. Portamento: mode cycle button (OFF/ON/AUTO), rate knob.

**SubtractorModSection.tsx:** LFO1 panel (waveform cycle, rate knob, delay knob). LFO2 panel (waveform cycle, rate knob, delay knob, key sync toggle). Mod Envelope ADSR (A/D/S/R knobs).

**SubtractorModMatrix.tsx:** 8 rows. Each row: source dropdown (none/lfo1/lfo2/modEnv/velocity), destination dropdown (12 options from `MOD_DESTINATIONS`), amount knob (-1 to +1 bipolar, displayed as percentage). Use `<select>` elements for the dropdowns. Compact table layout.

**SubtractorStepGrid.tsx:** 16 steps in groups of 4. Each step shows: note name, velocity bar (thin colored bar proportional to velocity, like a mini fader), gate state (note=filled, rest=empty, tie=dashed border), slide indicator. Click to select step. Uses bass-step CSS classes for consistency.

**SubtractorStepEditor.tsx:** Note +/- (semitone), octave +/- (+12/-12), velocity knob (0-127 range using shared Knob with min=0 max=127), gate buttons (N/R/T), slide toggle.

**SubtractorSection.tsx:** Container wrapping all above + shared Playhead. Props: `selectedStep`, `onSelectStep`, `focused`.

- [ ] **Step 1: Create all 9 components**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/subtractor/
git commit -m "feat: add Subtractor synth section UI components"
```

---

### Task 10: Subtractor CSS

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Append subtractor styles**

Follow the synth section patterns. Key classes:

- `.subtractor-section` / `--focused` — container, same as synth-section
- `.subtractor-header` / `__title` / `__subtitle` / `__controls` — same as synth-header
- `.subtractor-osc-section` — flex row with osc panels + center controls
- `.subtractor-osc-panel` / `__title` / `__controls` — same as synth-osc-panel
- `.subtractor-osc-panel__waveform-display` — shows current waveform name with prev/next buttons
- `.subtractor-osc-center` — column between oscs for mix/FM/ring/noise knobs
- `.subtractor-filter-section` — flex row with filter1 panel + ADSR + filter2 panel
- `.subtractor-filter-panel` / `__mode-btn` — filter controls with mode cycle button
- `.subtractor-amp-section` — flex row: ADSR + volume + portamento
- `.subtractor-portamento` — mode button + rate knob
- `.subtractor-mod-section` — LFO1 + LFO2 + mod env row
- `.subtractor-mod-matrix` — compact table with 8 rows
- `.subtractor-mod-matrix__row` — flex row: select + select + knob
- `.subtractor-mod-matrix__select` — styled select dropdowns matching dark theme
- `.subtractor-step-grid` / `.subtractor-step` — reuse bass-step CSS classes
- `.subtractor-step__velocity-bar` — thin bar inside step showing velocity level
- `.subtractor-step-editor` — flex row with controls

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add Subtractor CSS styles"
```

---

## Phase 5: Integration

### Task 11: Wire into App + Keyboard

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Update App**

Import `SubtractorSection` from `./subtractor/SubtractorSection`. Add `subtractorSelectedStep` state. Update `focusPanel` type to `'drum' | 'bass' | 'synth' | 'subtractor'`. Add SubtractorSection between SynthSection and MixerPanel, wrapped with onClick focus handler. Pass state to useKeyboard.

- [ ] **Step 2: Update useKeyboard**

Import `subtractorEngine` from `./useSubtractor`. Extend KeyboardState with `subtractorSelectedStep` / `setSubtractorSelectedStep`. Tab cycles: drum → bass → synth → subtractor → drum.

When `focusPanel === 'subtractor'`:
- `←`/`→` — step navigation
- `↑`/`↓` — pitch ±1 semitone (default), OR velocity ±8 when `V` is held
- `S` — toggle slide
- `N`/`R`/`T` — gate type
- `V` held — modifier key: while held, up/down adjust velocity instead of pitch

The V modifier: track `vHeld` state. On `keydown` of `v`, set `vHeld = true`. On `keyup` of `v`, set `vHeld = false`. When `vHeld` and up/down pressed, adjust velocity.

Note: this requires adding a `keyup` listener alongside the existing `keydown` listener.

- [ ] **Step 3: Verify everything**

Run: `npx tsc --noEmit`
Run: `npx vitest run`
Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire Subtractor into App with keyboard focus and velocity modifier"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Succeeds. Verify `dist/worklets/` contains all 4 worklet files.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Expected: All four instruments play in sync. Subtractor has waveform selection cycling through 32 options, dual filters with mode switching, mod matrix controlling destinations, velocity displayed per step. Tab cycles through all 4 panels. Mixer shows channel 4 as "GC-SUB".
