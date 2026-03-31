# SH-2 Synthesizer + Component Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Roland SH-2-style synthesizer module with two oscillators, noise mixer, IR3109 filter worklet, dual ADSR envelopes, and LFO. Also restructure all components into domain folders with shared Knob and Fader primitives extracted.

**Architecture:** New `SynthEngine` follows the established pattern (subscribe/getSnapshot, tick callback from TransportManager, mixer channel 3). New `IR3109Processor` AudioWorklet with softer saturation than the diode ladder. Component restructure moves all existing components into `shared/`, `transport/`, `drum/`, `bass/`, `mixer/`, `master/` folders, extracting `Knob` and `Fader` as shared primitives.

**Tech Stack:** TypeScript, React 19, Web Audio API, AudioWorklet, Vitest

**Spec:** `docs/superpowers/specs/2026-03-31-sh2-design.md`

---

## File Map

### Phase 1: Component Restructure + Shared Primitives

```
src/components/
  shared/
    Knob.tsx                   — NEW: extracted from ParamKnobs/MasterSection/BassKnobs/Transport
    Fader.tsx                  — NEW: extracted from MixerPanel
    PresetSelector.tsx         — MOVED from components/
    InitOverlay.tsx            — MOVED from components/
  transport/
    Transport.tsx              — MOVED from components/
  drum/
    DrumHeader.tsx             — MOVED
    InstrumentSelector.tsx     — MOVED
    ParamKnobs.tsx             — MOVED, refactored to use shared/Knob
    StepGrid.tsx               — MOVED
    AccentRow.tsx              — MOVED
    Playhead.tsx               — MOVED
  bass/
    BassSection.tsx            — MOVED
    BassHeader.tsx             — MOVED
    BassKnobs.tsx              — MOVED, refactored to use shared/Knob
    BassStepGrid.tsx           — MOVED
    BassStepEditor.tsx         — MOVED
  mixer/
    MixerPanel.tsx             — MOVED, refactored to use shared/Fader
  master/
    MasterSection.tsx          — MOVED, refactored to use shared/Knob
  App.tsx                      — MODIFIED: all import paths updated
  __tests__/
    App.test.tsx               — MODIFIED: import paths
```

### Phase 2: SH-2 Engine + IR3109 Filter

```
src/engine/synth/
  synthTypes.ts                — OscParams, ADSRParams, SH2Params, SynthStep, SynthPattern, SynthSnapshot, preset types
  ir3109Processor.ts           — IR3109 DSP class + AudioWorkletProcessor (single file)
  SynthEngine.ts               — pattern, params, presets, tick handler, synthesis
  defaultSynthPresets.ts       — 6 pattern + 6 sound built-in presets
  synthPresetStorage.ts        — localStorage CRUD
  __tests__/
    ir3109Processor.test.ts    — mock worklet globals, test DSP directly
    SynthEngine.test.ts        — state, presets, dirty tracking
    synthPresetStorage.test.ts — localStorage CRUD
```

### Phase 3: SH-2 UI + Integration

```
src/components/synth/
  SynthSection.tsx
  SynthHeader.tsx
  SynthOscSection.tsx
  SynthFilterSection.tsx
  SynthAmpSection.tsx
  SynthLFOSection.tsx
  SynthStepGrid.tsx
  SynthStepEditor.tsx
src/hooks/
  useSynth.ts                  — NEW
  useKeyboard.ts               — MODIFIED: add 'synth' to focus cycling
src/components/App.tsx         — MODIFIED: add SynthSection
src/engine/TransportManager.ts — MODIFIED: register ir3109 worklet
src/styles/index.css           — MODIFIED: synth section styles
```

---

## Phase 1: Component Restructure + Shared Primitives

### Task 1: Extract Shared Knob Component

**Files:**
- Create: `src/components/shared/Knob.tsx`

- [ ] **Step 1: Create the shared Knob component**

Extract the knob pattern used across ParamKnobs, MasterSection, BassKnobs, and Transport into a single reusable component.

```tsx
import { useCallback, useRef } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  displayValue?: string;
  onChange: (value: number) => void;
  size?: 'small' | 'medium';
}

export function Knob({ label, value, min = 0, max = 1, displayValue, onChange, size = 'medium' }: KnobProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const range = max - min;
        const delta = ((startY.current - e.clientY) / 150) * range;
        const newValue = Math.max(min, Math.min(max, startValue.current + delta));
        onChange(newValue);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, min, max, onChange],
  );

  const normalized = (value - min) / (max - min);
  const arcDeg = normalized * 280;
  const background = `conic-gradient(from 220deg, var(--accent) 0deg, var(--accent) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;
  const sizeClass = size === 'small' ? 'knob--small' : '';

  return (
    <div className={`knob ${sizeClass}`}>
      <div
        className="knob__dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
        title={displayValue ?? `${label}: ${Math.round(normalized * 100)}%`}
      >
        <div className="knob__center" />
      </div>
      {displayValue && <span className="knob__value">{displayValue}</span>}
      <span className="knob__label">{label}</span>
    </div>
  );
}
```

Add CSS for `knob--small` variant and `knob__value` to `src/styles/index.css`:

```css
.knob--small .knob__dial {
  width: 36px;
  height: 36px;
}

.knob--small .knob__center {
  width: 14px;
  height: 14px;
  top: 11px;
  left: 11px;
}

.knob__value {
  display: block;
  font-size: 9px;
  color: var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/Knob.tsx src/styles/index.css
git commit -m "feat: extract shared Knob component"
```

---

### Task 2: Extract Shared Fader Component

**Files:**
- Create: `src/components/shared/Fader.tsx`

- [ ] **Step 1: Move the Fader from MixerPanel into its own file**

Extract the `Fader` component (with its non-passive wheel handler) from `src/components/MixerPanel.tsx` into `src/components/shared/Fader.tsx`. Export it. The `SCROLL_STEP` constant goes with it.

The interface stays the same:
```ts
interface FaderProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}
```

Update `MixerPanel.tsx` to import `Fader` from `../shared/Fader` instead of defining it inline.

- [ ] **Step 2: Verify it works**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Fader.tsx src/components/MixerPanel.tsx
git commit -m "feat: extract shared Fader component"
```

---

### Task 3: Move All Components into Domain Folders

**Files:**
- Move all existing flat components into their domain folders
- Update all import paths in App.tsx and inter-component imports

This is a bulk file move + import update. The moves are:

```
components/PresetSelector.tsx    → components/shared/PresetSelector.tsx
components/InitOverlay.tsx       → components/shared/InitOverlay.tsx
components/Transport.tsx         → components/transport/Transport.tsx
components/DrumHeader.tsx        → components/drum/DrumHeader.tsx
components/InstrumentSelector.tsx → components/drum/InstrumentSelector.tsx
components/ParamKnobs.tsx        → components/drum/ParamKnobs.tsx
components/StepGrid.tsx          → components/drum/StepGrid.tsx
components/AccentRow.tsx         → components/drum/AccentRow.tsx
components/Playhead.tsx          → components/drum/Playhead.tsx
components/BassSection.tsx       → components/bass/BassSection.tsx
components/BassHeader.tsx        → components/bass/BassHeader.tsx
components/BassKnobs.tsx         → components/bass/BassKnobs.tsx
components/BassStepGrid.tsx      → components/bass/BassStepGrid.tsx
components/BassStepEditor.tsx    → components/bass/BassStepEditor.tsx
components/MixerPanel.tsx        → components/mixer/MixerPanel.tsx
components/MasterSection.tsx     → components/master/MasterSection.tsx
```

- [ ] **Step 1: Create directories and move files**

```bash
mkdir -p src/components/{transport,drum,bass,mixer,master}
# Move each file using git mv
```

- [ ] **Step 2: Update ALL import paths**

Every component that imports another component or the shared `PresetSelector`/`Knob`/`Fader` needs path updates. App.tsx imports all of them. BassSection imports BassHeader, BassKnobs, etc.

Key import path changes in App.tsx:
```ts
import { InitOverlay } from './shared/InitOverlay';
import { Transport } from './transport/Transport';
import { DrumHeader } from './drum/DrumHeader';
import { InstrumentSelector } from './drum/InstrumentSelector';
import { ParamKnobs } from './drum/ParamKnobs';
import { StepGrid } from './drum/StepGrid';
import { AccentRow } from './drum/AccentRow';
import { Playhead } from './drum/Playhead';
import { MasterSection } from './master/MasterSection';
import { BassSection } from './bass/BassSection';
import { MixerPanel } from './mixer/MixerPanel';
```

Also update:
- `BassSection.tsx` imports of `BassHeader`, `BassKnobs`, `BassStepGrid`, `BassStepEditor` (now all `./BassX` since they're in the same folder)
- `BassHeader.tsx` import of `PresetSelector` → `../shared/PresetSelector`
- `DrumHeader.tsx` import of `PresetSelector` → `../shared/PresetSelector`
- `MasterSection.tsx` import of `PresetSelector` if used → `../shared/PresetSelector`
- `Transport.tsx` hook imports stay the same (hooks are at `../../hooks/`)
- App.test.tsx import path for App stays `../App`

- [ ] **Step 3: Refactor ParamKnobs to use shared Knob**

Update `src/components/drum/ParamKnobs.tsx`: remove the inline `Knob` function, import `Knob` from `../shared/Knob` instead.

- [ ] **Step 4: Refactor BassKnobs to use shared Knob**

Update `src/components/bass/BassKnobs.tsx`: remove inline knob code, import `Knob` from `../shared/Knob`.

- [ ] **Step 5: Refactor MasterSection to use shared Knob**

Update `src/components/master/MasterSection.tsx`: remove inline `MasterKnob`, import `Knob` from `../shared/Knob`.

- [ ] **Step 6: Refactor Transport ShuffleKnob to use shared Knob**

Update `src/components/transport/Transport.tsx`: remove inline `ShuffleKnob`, use shared `Knob` component with `size="small"`.

- [ ] **Step 7: Verify everything**

Run: `npx tsc --noEmit` — no errors
Run: `npx vitest run` — all tests pass
Run: `npm run build` — build succeeds

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: restructure components into domain folders with shared primitives"
```

---

## Phase 2: SH-2 Engine + IR3109 Filter

### Task 4: Synth Types

**Files:**
- Create: `src/engine/synth/synthTypes.ts`

- [ ] **Step 1: Create the types file**

```ts
export interface OscParams {
  waveform: 'sawtooth' | 'square' | 'pulse';
  octave: number;      // -2 to +2
  tune: number;        // -1 to 1 (±1 semitone)
  pulseWidth: number;  // 0-1
  level: number;       // 0-1
}

export interface ADSRParams {
  attack: number;      // 0-1
  decay: number;       // 0-1
  sustain: number;     // 0-1
  release: number;     // 0-1
}

export interface SH2Params {
  osc1: OscParams;
  osc2: OscParams;
  noiseLevel: number;
  cutoff: number;
  resonance: number;
  filterEnvDepth: number;
  filterEnv: ADSRParams;
  ampEnv: ADSRParams;
  lfoWaveform: 'triangle' | 'square';
  lfoRate: number;
  lfoDepth: number;
  lfoDestination: 'pitch' | 'cutoff' | 'pulseWidth';
  volume: number;
  accent: number;
}

export interface SynthStep {
  note: number;
  accent: boolean;
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface SynthPattern {
  steps: SynthStep[];
}

export interface SynthSnapshot {
  pattern: SynthPattern;
  params: SH2Params;
  presets: {
    patterns: SynthPatternPreset[];
    sounds: SynthSoundPreset[];
    activePatternId: string | null;
    activeSoundId: string | null;
  };
}

export interface SynthPatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: SynthStep[];
}

export interface SynthSoundPreset {
  id: string;
  name: string;
  builtIn: boolean;
  params: SH2Params;
}

export const NUM_SYNTH_STEPS = 16;

export const DEFAULT_OSC: OscParams = {
  waveform: 'sawtooth',
  octave: 0,
  tune: 0,
  pulseWidth: 0.5,
  level: 0.8,
};

export const DEFAULT_ADSR: ADSRParams = {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.5,
  release: 0.3,
};

export const DEFAULT_SH2_PARAMS: SH2Params = {
  osc1: { ...DEFAULT_OSC },
  osc2: { ...DEFAULT_OSC, octave: -1 },
  noiseLevel: 0,
  cutoff: 0.5,
  resonance: 0.3,
  filterEnvDepth: 0.5,
  filterEnv: { ...DEFAULT_ADSR },
  ampEnv: { ...DEFAULT_ADSR },
  lfoWaveform: 'triangle',
  lfoRate: 0.3,
  lfoDepth: 0,
  lfoDestination: 'pitch',
  volume: 0.8,
  accent: 0.5,
};

export function createDefaultSynthPattern(): SynthPattern {
  return {
    steps: Array.from({ length: NUM_SYNTH_STEPS }, () => ({
      note: 48, // C3
      accent: false,
      slide: false,
      gate: 'rest' as const,
    })),
  };
}

export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function midiToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return names[note % 12] + octave;
}

/** Map 0-1 to time in seconds (logarithmic, 0.001s to 2s) */
export function adsrTimeMap(value: number): number {
  return 0.001 * Math.pow(2000, value);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/synth/synthTypes.ts
git commit -m "feat: add SH-2 synthesizer types"
```

---

### Task 5: IR3109 Filter Worklet

**Files:**
- Create: `src/engine/synth/ir3109Processor.ts`
- Create: `src/engine/synth/__tests__/ir3109Processor.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/synth/__tests__/ir3109Processor.test.ts`:

Mock the worklet globals, import the processor file, and test the `IR3109Filter` DSP class directly.

```ts
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock AudioWorklet globals before importing the processor
vi.stubGlobal('sampleRate', 44100);
vi.stubGlobal('AudioWorkletProcessor', class {});
vi.stubGlobal('registerProcessor', vi.fn());

// Now import — the processor file will execute registerProcessor but we've mocked it
const { IR3109Filter } = await import('../ir3109Processor');

describe('IR3109Filter', () => {
  const SAMPLE_RATE = 44100;

  it('passes signal through at max cutoff', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(20000);
    filter.setResonance(0);
    let output = 0;
    for (let i = 0; i < 100; i++) {
      output = filter.process(1.0);
    }
    expect(output).toBeGreaterThan(0.8);
  });

  it('attenuates signal at low cutoff', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(100);
    filter.setResonance(0);
    let peak = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      peak = Math.max(peak, Math.abs(filter.process(input)));
    }
    expect(peak).toBeLessThan(0.1);
  });

  it('creates resonant peak near cutoff', () => {
    const noRes = new IR3109Filter(SAMPLE_RATE);
    noRes.setCutoff(1000);
    noRes.setResonance(0);

    const hiRes = new IR3109Filter(SAMPLE_RATE);
    hiRes.setCutoff(1000);
    hiRes.setResonance(3.5);

    let peakNoRes = 0;
    let peakHiRes = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      peakNoRes = Math.max(peakNoRes, Math.abs(noRes.process(input)));
      peakHiRes = Math.max(peakHiRes, Math.abs(hiRes.process(input)));
    }
    expect(peakHiRes).toBeGreaterThan(peakNoRes);
  });

  it('output stays bounded with high resonance', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(5000);
    filter.setResonance(3.8);
    let maxOut = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 200 * i / SAMPLE_RATE) * 2;
      maxOut = Math.max(maxOut, Math.abs(filter.process(input)));
    }
    expect(maxOut).toBeLessThan(10);
  });

  it('has less bass loss than diode ladder at high resonance', () => {
    // Feed a low frequency (50Hz) through with high resonance
    // IR3109 should preserve more bass than a diode ladder would
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(2000);
    filter.setResonance(3.0);
    let peak = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 50 * i / SAMPLE_RATE);
      peak = Math.max(peak, Math.abs(filter.process(input)));
    }
    // Should still pass bass through reasonably well
    expect(peak).toBeGreaterThan(0.3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/synth/__tests__/ir3109Processor.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement IR3109 processor**

Create `src/engine/synth/ir3109Processor.ts`:

```ts
/**
 * IR3109-style OTA ladder filter — AudioWorkletProcessor.
 *
 * 4-pole cascaded one-pole filter with softer saturation than the
 * diode ladder (303). Uses x/(1+|x|) soft clip instead of tanh,
 * and compensates bass loss at high resonance.
 *
 * Exported class IR3109Filter is testable independently.
 */

export class IR3109Filter {
  private stage = [0, 0, 0, 0];
  private sampleRate: number;
  private g = 0;
  private resonance = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  setCutoff(freq: number): void {
    const clamped = Math.max(20, Math.min(20000, freq));
    const wc = 2 * Math.PI * clamped / this.sampleRate;
    this.g = wc / (1 + wc); // bilinear pre-warp, OTA-style
  }

  setResonance(res: number): void {
    this.resonance = Math.max(0, Math.min(4, res));
  }

  process(input: number): number {
    // Bass compensation: boost input proportional to resonance
    const compensated = input * (1 + this.resonance * 0.15);
    const feedback = this.resonance * this.stage[3];
    let x = compensated - feedback;

    // 4 cascaded stages with soft clip: x/(1+|x|)
    for (let i = 0; i < 4; i++) {
      const sc = x / (1 + Math.abs(x));
      const scStage = this.stage[i] / (1 + Math.abs(this.stage[i]));
      x = this.stage[i] + this.g * (sc - scStage);
      this.stage[i] = x;
    }

    return x;
  }

  reset(): void {
    this.stage = [0, 0, 0, 0];
  }
}

// --- AudioWorkletProcessor wrapper ---

class IR3109Processor extends AudioWorkletProcessor {
  private filter: IR3109Filter;

  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' as const },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' as const },
    ];
  }

  constructor() {
    super();
    this.filter = new IR3109Filter(sampleRate);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;

    const freqParam = parameters.frequency;
    const resParam = parameters.resonance;

    for (let i = 0; i < output.length; i++) {
      const freq = freqParam.length > 1 ? freqParam[i] : freqParam[0];
      const res = resParam.length > 1 ? resParam[i] : resParam[0];
      this.filter.setCutoff(freq);
      this.filter.setResonance(res);
      output[i] = this.filter.process(input[i]);
    }

    return true;
  }
}

registerProcessor('ir3109', IR3109Processor);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/synth/__tests__/ir3109Processor.test.ts`
Expected: All PASS.

- [ ] **Step 5: Register worklet in TransportManager**

Add to `TransportManager.init()` after the diode-ladder registration:

```ts
await this.ctx.audioWorklet.addModule(
  new URL('./synth/ir3109Processor.ts', import.meta.url)
);
```

- [ ] **Step 6: Exclude ir3109Processor.ts from tsconfig.app.json**

Add to the exclude list in `tsconfig.app.json` alongside the existing diode ladder exclusion.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add IR3109 OTA ladder filter worklet"
```

---

### Task 6: Synth Preset Storage + Defaults

**Files:**
- Create: `src/engine/synth/defaultSynthPresets.ts`
- Create: `src/engine/synth/synthPresetStorage.ts`
- Create: `src/engine/synth/__tests__/synthPresetStorage.test.ts`

- [ ] **Step 1: Create default presets**

Create `src/engine/synth/defaultSynthPresets.ts` with 6 pattern presets and 6 sound presets following the spec. Use helpers similar to bass presets. Pattern presets use MIDI notes in the C3-C5 range. Sound presets configure `SH2Params` with the characters described in the spec (Classic SH-2, Fat Unison, Pulse Lead, Dark Pad, Noise Sweep, Resonant Pluck).

- [ ] **Step 2: Create synthPresetStorage.ts**

Same pattern as `bassPresetStorage.ts`. localStorage keys: `tr909-synth-pattern-presets`, `tr909-synth-sound-presets`. Methods: `getPatternPresets`, `getSoundPresets`, `savePatternPreset`, `saveSoundPreset`, `deletePatternPreset`, `deleteSoundPreset`.

- [ ] **Step 3: Write and run tests**

Same test pattern as `bassPresetStorage.test.ts`. Returns built-ins when empty, merges user presets, saves, deletes user but not built-in.

Run: `npx vitest run src/engine/synth/__tests__/synthPresetStorage.test.ts`
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine/synth/defaultSynthPresets.ts src/engine/synth/synthPresetStorage.ts src/engine/synth/__tests__/synthPresetStorage.test.ts
git commit -m "feat: add synth preset storage with 6 pattern and 6 sound defaults"
```

---

### Task 7: SynthEngine

**Files:**
- Create: `src/engine/synth/SynthEngine.ts`
- Create: `src/engine/synth/__tests__/SynthEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Same test pattern as BassEngine.test.ts but for SynthEngine. Tests:

- Default snapshot (pattern 16 steps, default SH2Params, preset lists populated)
- `setNote(step, note)` updates step
- `toggleAccent(step)` flips
- `toggleSlide(step)` flips
- `setGate(step, gate)` updates
- `setOscParam(1, 'waveform', 'square')` updates osc1
- `setOscParam(2, 'level', 0.5)` updates osc2
- `setFilterParam('cutoff', 0.8)` updates
- `setFilterEnv('attack', 0.5)` updates
- `setAmpEnv('release', 0.7)` updates
- `setLFOParam('rate', 0.6)` updates
- `setNoiseLevel(0.3)` updates
- Subscribe notifies
- Dirty tracking: pattern edit → activePatternId null
- Dirty tracking: param edit → activeSoundId null
- savePatternPreset / saveSoundPreset creates and sets active
- loadPatternPreset / loadSoundPreset applies data
- deletePatternPreset / deleteSoundPreset removes and clears if active

- [ ] **Step 2: Implement SynthEngine**

Follow BassEngine pattern. Constructor takes `TransportManager` and `MixerEngine`, assigns mixer channel 2 (constant `SYNTH_MIXER_CHANNEL = 2`), registers tick callback.

The tick handler is more complex than BassEngine due to dual oscillators, noise, LFO, and ADSR:

**Lazy node creation on first tick:**
- Two `OscillatorNode`s (osc1, osc2) with independent waveform/frequency
- Noise: looping `AudioBufferSourceNode` through a gain node
- LFO: low-frequency `OscillatorNode` through a depth gain node
- `AudioWorkletNode('ir3109')` filter (with BiquadFilter fallback)
- Two gain nodes for VCA and filter envelope
- Wiring: (osc1 + osc2 + noise) → filter → vca → mixer channel

**Per-step logic:**
- `rest`: set VCA to 0, release filter
- `tie`: sustain, no re-trigger
- `note`: set/glide pitch on both oscs (with octave/tune offsets), trigger both ADSRs

**ADSR scheduling:** Use `setValueAtTime` + `linearRampToValueAtTime` for attack, `setTargetAtTime` for decay→sustain and release.

**LFO routing:** On node creation and when destination changes, connect/disconnect the LFO gain node to the appropriate target (oscillator detune, filter frequency param, or pulse width).

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/engine/synth/__tests__/SynthEngine.test.ts`
Expected: All PASS.

Run: `npx vitest run` — full suite passes.

- [ ] **Step 4: Commit**

```bash
git add src/engine/synth/SynthEngine.ts src/engine/synth/__tests__/SynthEngine.test.ts
git commit -m "feat: add SynthEngine with dual oscillators, IR3109 filter, ADSR, LFO"
```

---

## Phase 3: SH-2 UI + Integration

### Task 8: Synth Hooks

**Files:**
- Create: `src/hooks/useSynth.ts`

- [ ] **Step 1: Create synth hooks**

```ts
import { useSyncExternalStore } from 'react';
import { SynthEngine } from '../engine/synth/SynthEngine';
import type { SynthSnapshot, SH2Params, SynthPattern } from '../engine/synth/synthTypes';
import { transport, mixer } from './useTransport';

export const synthEngine = new SynthEngine(transport, mixer);

export function useSynthPattern(): SynthPattern {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().pattern);
}

export function useSynthParams(): SH2Params {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().params);
}

export function useSynthPresets(): SynthSnapshot['presets'] {
  return useSyncExternalStore(synthEngine.subscribe, () => synthEngine.getSnapshot().presets);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSynth.ts
git commit -m "feat: add useSynth hooks"
```

---

### Task 9: Synth UI Components

**Files:**
- Create: `src/components/synth/SynthSection.tsx`
- Create: `src/components/synth/SynthHeader.tsx`
- Create: `src/components/synth/SynthOscSection.tsx`
- Create: `src/components/synth/SynthFilterSection.tsx`
- Create: `src/components/synth/SynthAmpSection.tsx`
- Create: `src/components/synth/SynthLFOSection.tsx`
- Create: `src/components/synth/SynthStepGrid.tsx`
- Create: `src/components/synth/SynthStepEditor.tsx`

The implementer should create all 8 components following the patterns established by the bass components. All knobs use the shared `Knob` component from `../shared/Knob`.

**SynthHeader:** "SH-2" title + "SYNTHESIZER" subtitle, two PresetSelector dropdowns (Pattern + Sound).

**SynthOscSection:** Two side-by-side oscillator panels, each with: waveform cycle button (SAW/SQR/PLS), octave selector (-2 to +2), tune knob, pulse width knob, level knob. Noise level knob between them.

**SynthFilterSection:** Cutoff knob, resonance knob, env depth knob. Then 4 ADSR knobs (A/D/S/R) labeled "Filter Envelope".

**SynthAmpSection:** 4 ADSR knobs (A/D/S/R) labeled "Amp Envelope", plus volume knob.

**SynthLFOSection:** Waveform toggle (TRI/SQR), rate knob, depth knob, destination cycle button (PITCH/CUTOFF/PW).

**SynthStepGrid:** Same layout as BassStepGrid — 16 steps grouped in 4s, showing note name, gate state, accent/slide indicators. Uses `synthEngine` and `useSynthPattern`.

**SynthStepEditor:** Same controls as BassStepEditor — note +/-, octave +/-, gate buttons (N/R/T), accent toggle, slide toggle. Uses `synthEngine`.

**SynthSection:** Container wrapping all of the above, with `focused` prop for outline.

- [ ] **Step 1: Create all 8 components**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/synth/
git commit -m "feat: add SH-2 synth section UI components"
```

---

### Task 10: Synth CSS

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add synth section styles**

Append CSS for the synth section. Follow the bass section patterns. Key classes:

- `.synth-section` — container (same as `.bass-section`)
- `.synth-section--focused` — orange outline
- `.synth-header` / `.synth-header__title` / `.synth-header__controls` — same layout as bass header
- `.synth-osc-section` — flex row containing two osc panels + noise
- `.synth-osc-panel` — individual oscillator panel with border
- `.synth-osc-panel__title` — "OSC 1" / "OSC 2" label
- `.synth-osc-panel__waveform` — waveform cycle button
- `.synth-osc-panel__octave` — octave selector with -/+ buttons
- `.synth-filter-section`, `.synth-amp-section`, `.synth-lfo-section` — knob rows with labels
- `.synth-adsr` — row of 4 ADSR knobs
- `.synth-step-grid` / `.synth-step` — reuse bass step grid class patterns
- `.synth-step-editor` — reuse bass step editor class patterns
- `.synth-lfo-section__destination` — destination cycle button

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add SH-2 synth section CSS"
```

---

### Task 11: Wire SynthSection into App + Keyboard

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Update App**

Add `synthSelectedStep` state. Update `focusPanel` type to `'drum' | 'bass' | 'synth'`. Import `SynthSection` from `./synth/SynthSection`. Add it between the bass section and mixer panel. Wire up click handler to set focus panel.

- [ ] **Step 2: Update useKeyboard**

Extend `KeyboardState` with `synthSelectedStep` and `setSynthSelectedStep`. Tab now cycles drum → bass → synth. When `focusPanel === 'synth'`, same keys as bass (arrows for nav/pitch, S/A/N/R/T). Import `synthEngine` from `./useSynth`.

- [ ] **Step 3: Verify everything**

Run: `npx tsc --noEmit` — no errors
Run: `npx vitest run` — all tests pass
Run: `npm run build` — build succeeds

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire SH-2 synth section into App with keyboard focus"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Expected: All three instruments play in sync. SH-2 has two oscillators, filter sweep works with the ADSR, LFO modulates the selected destination, presets load. Tab cycles focus between all three panels. Mixer shows channel 3 as "SH-2".
