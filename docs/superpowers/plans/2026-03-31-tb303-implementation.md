# TB-303 Bass Synthesizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a TB-303 bass synthesizer with custom diode ladder filter, sharing transport/master with the existing 909 drum machine via an extracted TransportManager.

**Architecture:** Extract shared transport/clock/master into `TransportManager`. Rename `AudioEngine` to `DrumEngine` (drums only). Create `BassEngine` for the 303 with its own sequencer, synth params, and presets. The 303's signature filter is a custom `AudioWorkletProcessor` implementing a 4-pole diode ladder model. Both engines register tick callbacks with the transport.

**Tech Stack:** TypeScript, React 19, Web Audio API, AudioWorklet, Vitest

**Spec:** `docs/superpowers/specs/2026-03-31-tb303-design.md`

---

## File Map

### Phase 1: Transport Extraction + DrumEngine Rename
```
src/engine/
  TransportManager.ts          — NEW: clock, AudioContext, master chain, transport state
  DrumEngine.ts                — RENAMED from AudioEngine.ts, transport/master removed
  types.ts                     — MODIFIED: DrumSnapshot replaces EngineSnapshot
  clock.ts                     — unchanged (used by TransportManager)
  clockWorker.ts               — unchanged
  presetStorage.ts             — unchanged
  defaultPresets.ts            — MODIFIED: PatternPreset loses bpm/shuffle (now in transport)
src/hooks/
  useTransport.ts              — NEW: useSyncExternalStore hooks for TransportManager
  useDrum.ts                   — RENAMED from useEngine.ts, transport/master hooks removed
src/components/
  App.tsx                      — MODIFIED: wire TransportManager + DrumEngine
  Transport.tsx                — MODIFIED: use useTransport hooks + transport instance
  MasterSection.tsx            — MODIFIED: use useTransport hooks + transport instance
src/engine/__tests__/
  TransportManager.test.ts     — NEW
  AudioEngine.test.ts          — RENAMED to DrumEngine.test.ts, adapted
  presetStorage.test.ts        — MODIFIED: PatternPreset shape change
```

### Phase 2: Bass Engine + Diode Ladder Filter
```
src/engine/bass/
  bassTypes.ts                 — NEW: BassStep, BassPattern, SynthParams, BassSnapshot, preset types
  diodeLadderDSP.ts            — NEW: pure DSP math functions (testable)
  diodeLadderProcessor.ts      — NEW: AudioWorkletProcessor wrapper
  BassEngine.ts                — NEW: bass pattern, synth, synthesis, presets
  defaultBassPresets.ts        — NEW: 6 pattern + 6 synth built-in presets
  bassPresetStorage.ts         — NEW: localStorage for bass presets
src/engine/bass/__tests__/
  diodeLadderDSP.test.ts       — NEW
  BassEngine.test.ts           — NEW
  bassPresetStorage.test.ts    — NEW
src/hooks/
  useBass.ts                   — NEW: useSyncExternalStore hooks for BassEngine
```

### Phase 3: Bass UI + Keyboard
```
src/components/
  BassSection.tsx              — NEW: container
  BassHeader.tsx               — NEW: title, presets, waveform toggle
  BassKnobs.tsx                — NEW: synth parameter knobs
  BassStepGrid.tsx             — NEW: 16-step note sequencer
  BassStepEditor.tsx           — NEW: selected step editing controls
  App.tsx                      — MODIFIED: add BassSection
src/hooks/
  useKeyboard.ts               — MODIFIED: Tab focus, 303 keys
src/styles/
  index.css                    — MODIFIED: bass section styles
```

---

## Phase 1: Transport Extraction + DrumEngine Rename

### Task 1: Create TransportManager

**Files:**
- Create: `src/engine/TransportManager.ts`
- Create: `src/engine/__tests__/TransportManager.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/TransportManager.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransportManager } from '../TransportManager';

describe('TransportManager', () => {
  it('returns default snapshot', () => {
    const tm = new TransportManager();
    const snap = tm.getSnapshot();
    expect(snap.playing).toBe(false);
    expect(snap.bpm).toBe(120);
    expect(snap.shuffle).toBe(0);
    expect(snap.currentStep).toBe(0);
    expect(snap.master.volume).toBe(0.8);
    expect(snap.master.compressor).toBe(true);
  });

  it('setBpm updates bpm and notifies', () => {
    const tm = new TransportManager();
    const cb = vi.fn();
    tm.subscribe(cb);
    tm.setBpm(140);
    expect(tm.getSnapshot().bpm).toBe(140);
    expect(cb).toHaveBeenCalled();
  });

  it('setBpm clamps to 40-300', () => {
    const tm = new TransportManager();
    tm.setBpm(10);
    expect(tm.getSnapshot().bpm).toBe(40);
    tm.setBpm(500);
    expect(tm.getSnapshot().bpm).toBe(300);
  });

  it('setShuffle updates and clamps 0-1', () => {
    const tm = new TransportManager();
    tm.setShuffle(0.5);
    expect(tm.getSnapshot().shuffle).toBe(0.5);
    tm.setShuffle(2);
    expect(tm.getSnapshot().shuffle).toBe(1);
  });

  it('setMasterVolume updates volume', () => {
    const tm = new TransportManager();
    tm.setMasterVolume(0.5);
    expect(tm.getSnapshot().master.volume).toBe(0.5);
  });

  it('setCompressorParam updates param', () => {
    const tm = new TransportManager();
    tm.setCompressorParam('threshold', -24);
    expect(tm.getSnapshot().master.threshold).toBe(-24);
  });

  it('setCompressorEnabled toggles', () => {
    const tm = new TransportManager();
    tm.setCompressorEnabled(false);
    expect(tm.getSnapshot().master.compressor).toBe(false);
  });

  it('subscribe returns unsubscribe function', () => {
    const tm = new TransportManager();
    const cb = vi.fn();
    const unsub = tm.subscribe(cb);
    tm.setBpm(130);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    tm.setBpm(140);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('registerTickCallback and unregister', () => {
    const tm = new TransportManager();
    const cb = vi.fn();
    const unregister = tm.registerTickCallback(cb);
    expect(typeof unregister).toBe('function');
    unregister();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/TransportManager.test.ts`
Expected: FAIL — TransportManager not found.

- [ ] **Step 3: Implement TransportManager**

Create `src/engine/TransportManager.ts`:

```ts
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

type TickCallback = (ctx: AudioContext, dest: AudioNode, time: number, step: number) => void;

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
  private tickCallbacks = new Set<TickCallback>();
  private snapshot: TransportSnapshot;

  private compressorNode: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private outputNode: AudioNode | null = null;

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

  // --- Subscription API ---

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = (): TransportSnapshot => {
    return this.snapshot;
  };

  // --- Tick Registration ---

  registerTickCallback(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  // --- Accessors for engines ---

  getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  getOutputNode(): AudioNode | null {
    return this.outputNode;
  }

  // --- Lifecycle ---

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.applyCompressorParams();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.snapshot.master.volume;

    this.compressorNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.outputNode = this.compressorNode;
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

  // --- Master ---

  setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }
    this.emit({ master: { ...this.snapshot.master, volume: clamped } });
  }

  setCompressorEnabled(enabled: boolean): void {
    this.emit({ master: { ...this.snapshot.master, compressor: enabled } });
    this.rewireMasterChain();
  }

  setCompressorParam(param: 'threshold' | 'ratio' | 'knee' | 'attack' | 'release', value: number): void {
    this.emit({ master: { ...this.snapshot.master, [param]: value } });
    this.applyCompressorParams();
  }

  // --- Clock Callback ---

  private onTick(time: number, step: number): void {
    this.emit({ currentStep: step });

    if (!this.ctx) return;
    const dest = this.outputNode ?? this.ctx.destination;
    for (const cb of this.tickCallbacks) {
      cb(this.ctx, dest, time, step);
    }
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
    this.compressorNode.disconnect();
    if (this.snapshot.master.compressor) {
      this.compressorNode.connect(this.masterGain);
      this.outputNode = this.compressorNode;
    } else {
      this.outputNode = this.masterGain;
    }
  }

  private emit(partial: Partial<TransportSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/TransportManager.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/TransportManager.ts src/engine/__tests__/TransportManager.test.ts
git commit -m "feat: extract TransportManager from AudioEngine"
```

---

### Task 2: Update Types — DrumSnapshot replaces EngineSnapshot

**Files:**
- Modify: `src/engine/types.ts`

- [ ] **Step 1: Replace EngineSnapshot with DrumSnapshot**

Update `src/engine/types.ts`. Remove the `EngineSnapshot` interface and replace with `DrumSnapshot`. Remove the `transport` and `master` fields (those now live in `TransportSnapshot`). Also remove `bpm` and `shuffle` from `PatternPreset` since those are now transport concerns.

The updated `types.ts` should have:

```ts
export interface DrumSnapshot {
  pattern: {
    steps: Record<InstrumentId, boolean[]>;
    accents: boolean[];
  };
  instruments: Record<InstrumentId, InstrumentParams>;
  presets: {
    patterns: PatternPreset[];
    kits: KitPreset[];
    activePatternId: string | null;
    activeKitId: string | null;
  };
}
```

And `PatternPreset` loses `bpm` and `shuffle`:

```ts
export interface PatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: Record<InstrumentId, boolean[]>;
  accents: boolean[];
}
```

Keep everything else unchanged (INSTRUMENT_IDS, InstrumentParams, VoiceTrigger, ChokableVoiceTrigger, TUNABLE_INSTRUMENTS, NUM_STEPS, createDefaultSteps, createDefaultInstruments, KitPreset).

- [ ] **Step 2: Commit (will have compile errors until DrumEngine is updated)**

```bash
git add src/engine/types.ts
git commit -m "refactor: replace EngineSnapshot with DrumSnapshot, remove bpm/shuffle from PatternPreset"
```

---

### Task 3: Rename AudioEngine to DrumEngine and Refactor

**Files:**
- Create: `src/engine/DrumEngine.ts` (replacing `src/engine/AudioEngine.ts`)
- Delete: `src/engine/AudioEngine.ts`
- Modify: `src/engine/__tests__/AudioEngine.test.ts` → rename to `DrumEngine.test.ts`

- [ ] **Step 1: Create DrumEngine.ts**

Create `src/engine/DrumEngine.ts`. This is the existing AudioEngine with transport/master removed. It receives a `TransportManager` in the constructor and registers a tick callback.

```ts
import type {
  InstrumentId,
  DrumSnapshot,
  PatternPreset,
  KitPreset,
} from './types';
import { INSTRUMENT_IDS, NUM_STEPS, createDefaultSteps, createDefaultInstruments } from './types';
import { voices, openHat as openHatVoice } from './voices';
import { PresetStorage } from './presetStorage';
import type { TransportManager } from './TransportManager';

export class DrumEngine {
  private transport: TransportManager;
  private listeners = new Set<() => void>();
  private snapshot: DrumSnapshot;
  private openHatGain: GainNode | null = null;

  constructor(transport: TransportManager) {
    this.transport = transport;
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

    transport.registerTickCallback((ctx, dest, time, step) => this.onTick(ctx, dest, time, step));
  }

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

  // --- Tick Handler ---

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

  private emit(partial: Partial<DrumSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

- [ ] **Step 2: Delete old AudioEngine.ts**

```bash
rm src/engine/AudioEngine.ts
```

- [ ] **Step 3: Update DrumEngine tests**

Rename `src/engine/__tests__/AudioEngine.test.ts` to `src/engine/__tests__/DrumEngine.test.ts`. Update to import `DrumEngine` and `TransportManager`. Construct with `new DrumEngine(new TransportManager())`. Remove transport/master tests (those are in TransportManager.test.ts now). Remove dirty tracking tests for `setBpm`/`setShuffle` (those no longer exist on DrumEngine). Keep pattern, instrument, preset, and remaining dirty tracking tests.

The updated test file should import and construct like:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrumEngine } from '../DrumEngine';
import { TransportManager } from '../TransportManager';

describe('DrumEngine', () => {
  let transport: TransportManager;

  beforeEach(() => {
    localStorage.clear();
    transport = new TransportManager();
  });

  it('returns a default snapshot', () => {
    const engine = new DrumEngine(transport);
    const snap = engine.getSnapshot();
    expect(snap.pattern.steps.kick.length).toBe(16);
    expect(snap.pattern.steps.kick.every((s) => s === false)).toBe(true);
    expect(snap.pattern.accents.length).toBe(16);
    expect(snap.instruments.kick.level).toBe(0.8);
    expect(snap.instruments.kick.tune).toBe(0.5);
    expect(snap.instruments.clap.tune).toBeUndefined();
  });

  // ... keep all the existing pattern, instrument, preset, and dirty tracking tests
  // (toggleStep, toggleAccent, setParam, subscribe, getSnapshot reference stability,
  //  loadPatternPreset, loadKitPreset, savePatternPreset, saveKitPreset,
  //  deletePatternPreset, deleteKitPreset,
  //  dirty tracking for toggleStep/toggleAccent/setParam)
  //
  // Remove: setBpm dirty tracking test, setShuffle dirty tracking test
  // (those methods no longer exist on DrumEngine)
  //
  // Update loadPatternPreset test: no longer sets bpm/shuffle
```

- [ ] **Step 4: Update defaultPresets.ts — remove bpm/shuffle from patternPreset helper**

Remove the `bpm` and `shuffle` parameters and fields from the `patternPreset()` helper function and all its call sites. Pattern presets now only contain steps + accents.

- [ ] **Step 5: Update presetStorage.test.ts — PatternPreset no longer has bpm/shuffle**

Update the `makePatternPreset` helper in the test to remove `bpm` and `shuffle` fields.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: rename AudioEngine to DrumEngine, remove transport/master"
```

---

### Task 4: Update Hooks — useTransport.ts + useDrum.ts

**Files:**
- Create: `src/hooks/useTransport.ts`
- Rename: `src/hooks/useEngine.ts` → `src/hooks/useDrum.ts`

- [ ] **Step 1: Create useTransport.ts**

Create `src/hooks/useTransport.ts`:

```ts
import { useSyncExternalStore } from 'react';
import { TransportManager } from '../engine/TransportManager';
import type { TransportSnapshot, MasterParams } from '../engine/TransportManager';

export const transport = new TransportManager();

export function useTransportSnapshot(): TransportSnapshot {
  return useSyncExternalStore(transport.subscribe, transport.getSnapshot);
}

export function useMaster(): MasterParams {
  return useSyncExternalStore(
    transport.subscribe,
    () => transport.getSnapshot().master,
  );
}
```

- [ ] **Step 2: Create useDrum.ts**

Create `src/hooks/useDrum.ts`. It imports `transport` from `useTransport.ts` and creates the `DrumEngine` with it:

```ts
import { useSyncExternalStore, useRef } from 'react';
import { DrumEngine } from '../engine/DrumEngine';
import type { InstrumentId, InstrumentParams, DrumSnapshot } from '../engine/types';
import { transport } from './useTransport';

export const drumEngine = new DrumEngine(transport);

export function useDrumSnapshot(): DrumSnapshot {
  return useSyncExternalStore(drumEngine.subscribe, drumEngine.getSnapshot);
}

export function useDrumPattern(): DrumSnapshot['pattern'] {
  return useSyncExternalStore(
    drumEngine.subscribe,
    () => drumEngine.getSnapshot().pattern,
  );
}

export function useInstrumentParams(id: InstrumentId): InstrumentParams {
  const prevRef = useRef<InstrumentParams>(drumEngine.getSnapshot().instruments[id]);
  return useSyncExternalStore(drumEngine.subscribe, () => {
    const next = drumEngine.getSnapshot().instruments[id];
    if (
      prevRef.current.level === next.level &&
      prevRef.current.decay === next.decay &&
      prevRef.current.tune === next.tune
    ) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  });
}

export function useDrumPresets(): DrumSnapshot['presets'] {
  return useSyncExternalStore(
    drumEngine.subscribe,
    () => drumEngine.getSnapshot().presets,
  );
}
```

- [ ] **Step 3: Delete old useEngine.ts**

```bash
rm src/hooks/useEngine.ts
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: split hooks into useTransport and useDrum"
```

---

### Task 5: Update All Components for New Hook Imports

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/Transport.tsx`
- Modify: `src/components/MasterSection.tsx`
- Modify: `src/components/InstrumentSelector.tsx` (no changes needed — no engine import)
- Modify: `src/components/ParamKnobs.tsx`
- Modify: `src/components/StepGrid.tsx`
- Modify: `src/components/AccentRow.tsx`
- Modify: `src/components/Playhead.tsx`
- Modify: `src/components/InitOverlay.tsx`
- Modify: `src/hooks/useKeyboard.ts`
- Modify: `src/components/__tests__/App.test.tsx`
- Modify: `src/hooks/__tests__/useEngine.test.ts` → rename/update

- [ ] **Step 1: Update all component imports**

Every component that imported from `../hooks/useEngine` needs updating:

**Transport.tsx:** Change `import { useTransport, engine } from '../hooks/useEngine'` to `import { useTransportSnapshot, transport } from '../hooks/useTransport'`. Replace `engine.setShuffle(...)` with `transport.setShuffle(...)`, `engine.setBpm(...)` with `transport.setBpm(...)`, `engine.play()` with `transport.play()`, `engine.stop()` with `transport.stop()`. Replace `useTransport()` call with `useTransportSnapshot()`. Update the title from "TR-909" to just show the shared transport.

**MasterSection.tsx:** Change `import { useMaster, engine } from '../hooks/useEngine'` to `import { useMaster, transport } from '../hooks/useTransport'`. Replace all `engine.setMasterVolume(...)`, `engine.setCompressorEnabled(...)`, `engine.setCompressorParam(...)` with `transport.*`.

**InitOverlay.tsx:** Change `import { engine } from '../hooks/useEngine'` to `import { transport } from '../hooks/useTransport'`. Replace `engine.init()` with `transport.init()`.

**ParamKnobs.tsx:** Change `import { useInstrumentParams, engine } from '../hooks/useEngine'` to `import { useInstrumentParams, drumEngine } from '../hooks/useDrum'`. Replace `engine.setParam(...)` with `drumEngine.setParam(...)`.

**StepGrid.tsx:** Change `import { usePattern, engine } from '../hooks/useEngine'` to `import { useDrumPattern, drumEngine } from '../hooks/useDrum'`. Replace `usePattern()` with `useDrumPattern()`, `engine.toggleStep(...)` with `drumEngine.toggleStep(...)`.

**AccentRow.tsx:** Same pattern — `import { useDrumPattern, drumEngine } from '../hooks/useDrum'`. Replace `usePattern()` with `useDrumPattern()`, `engine.toggleAccent(...)` with `drumEngine.toggleAccent(...)`.

**Playhead.tsx:** Change `import { useTransport } from '../hooks/useEngine'` to `import { useTransportSnapshot } from '../hooks/useTransport'`. Replace `useTransport()` with `useTransportSnapshot()`.

**App.tsx:** Update imports to use `useDrumPresets`, `drumEngine` from `useDrum`, and `transport` from `useTransport`. Replace all `engine.*` calls.

**useKeyboard.ts:** Change `import { engine } from './useEngine'` to `import { drumEngine } from './useDrum'` and `import { transport } from './useTransport'`. Replace `engine.setBpm/setShuffle/play/stop` with `transport.*`, and `engine.toggleStep/toggleAccent` with `drumEngine.*`.

- [ ] **Step 2: Update/rename hook tests**

Rename `src/hooks/__tests__/useEngine.test.ts` to `src/hooks/__tests__/useDrum.test.ts`. Update imports to use `useDrumPattern`, `useInstrumentParams`, `drumEngine` from `../useDrum` and `useTransportSnapshot` from `../useTransport`.

- [ ] **Step 3: Update App.test.tsx**

Update any imports that reference the old engine/hooks.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: update all components and hooks for TransportManager + DrumEngine"
```

---

## Phase 2: Bass Engine + Diode Ladder Filter

### Task 6: Bass Types

**Files:**
- Create: `src/engine/bass/bassTypes.ts`

- [ ] **Step 1: Create bass types**

Create `src/engine/bass/bassTypes.ts`:

```ts
export interface BassStep {
  note: number;       // MIDI note number (0-127)
  accent: boolean;
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}

export interface BassPattern {
  steps: BassStep[];  // 16 steps
}

export interface SynthParams {
  waveform: 'sawtooth' | 'square';
  cutoff: number;       // 0–1
  resonance: number;    // 0–1
  envMod: number;       // 0–1
  decay: number;        // 0–1
  accent: number;       // 0–1
  volume: number;       // 0–1
}

export interface BassSnapshot {
  pattern: BassPattern;
  synth: SynthParams;
  presets: {
    patterns: BassPatternPreset[];
    synths: BassSynthPreset[];
    activePatternId: string | null;
    activeSynthId: string | null;
  };
}

export interface BassPatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: BassStep[];
}

export interface BassSynthPreset {
  id: string;
  name: string;
  builtIn: boolean;
  synth: SynthParams;
}

export const NUM_BASS_STEPS = 16;

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  waveform: 'sawtooth',
  cutoff: 0.5,
  resonance: 0.5,
  envMod: 0.5,
  decay: 0.5,
  accent: 0.5,
  volume: 0.8,
};

export function createDefaultBassPattern(): BassPattern {
  return {
    steps: Array.from({ length: NUM_BASS_STEPS }, () => ({
      note: 36, // C2
      accent: false,
      slide: false,
      gate: 'rest' as const,
    })),
  };
}

/** Convert MIDI note to frequency in Hz */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Convert MIDI note to display name like "C2", "F#3" */
export function midiToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return names[note % 12] + octave;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/bass/bassTypes.ts
git commit -m "feat: add bass synthesizer types"
```

---

### Task 7: Diode Ladder DSP

**Files:**
- Create: `src/engine/bass/diodeLadderDSP.ts`
- Create: `src/engine/bass/__tests__/diodeLadderDSP.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/bass/__tests__/diodeLadderDSP.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DiodeLadderFilter } from '../diodeLadderDSP';

describe('DiodeLadderFilter', () => {
  const SAMPLE_RATE = 44100;

  it('passes signal through at max cutoff', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(20000);
    filter.setResonance(0);

    // Feed a DC signal
    let output = 0;
    for (let i = 0; i < 100; i++) {
      output = filter.process(1.0);
    }
    // Should pass through mostly unchanged
    expect(output).toBeGreaterThan(0.8);
  });

  it('attenuates signal at low cutoff', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(100);
    filter.setResonance(0);

    // Feed a high frequency signal (1kHz sine)
    let peakOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      const output = filter.process(input);
      peakOutput = Math.max(peakOutput, Math.abs(output));
    }
    // 1kHz should be heavily attenuated with 100Hz cutoff
    expect(peakOutput).toBeLessThan(0.1);
  });

  it('creates resonant peak near cutoff', () => {
    const filterNoRes = new DiodeLadderFilter(SAMPLE_RATE);
    filterNoRes.setCutoff(1000);
    filterNoRes.setResonance(0);

    const filterHighRes = new DiodeLadderFilter(SAMPLE_RATE);
    filterHighRes.setCutoff(1000);
    filterHighRes.setResonance(3.5);

    // Feed near-cutoff frequency (1kHz sine)
    let peakNoRes = 0;
    let peakHighRes = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      peakNoRes = Math.max(peakNoRes, Math.abs(filterNoRes.process(input)));
      peakHighRes = Math.max(peakHighRes, Math.abs(filterHighRes.process(input)));
    }
    // High resonance should boost signal near cutoff
    expect(peakHighRes).toBeGreaterThan(peakNoRes);
  });

  it('soft clips — output stays bounded', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(5000);
    filter.setResonance(3.8);

    let maxOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 200 * i / SAMPLE_RATE) * 2;
      const output = filter.process(input);
      maxOutput = Math.max(maxOutput, Math.abs(output));
    }
    // Should not blow up even with high resonance and hot input
    expect(maxOutput).toBeLessThan(10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/bass/__tests__/diodeLadderDSP.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement DiodeLadderFilter**

Create `src/engine/bass/diodeLadderDSP.ts`:

```ts
/**
 * 4-pole diode ladder lowpass filter.
 *
 * Models the topology of the TB-303's filter: 4 cascaded one-pole stages
 * with nonlinear (tanh) saturation and a resonance feedback path.
 *
 * This is the pure DSP implementation — used directly by the AudioWorklet
 * processor and independently testable without Web Audio.
 */
export class DiodeLadderFilter {
  private stage = [0, 0, 0, 0];
  private sampleRate: number;
  private cutoff = 1000;
  private resonance = 0;
  private g = 0; // filter coefficient derived from cutoff

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.updateCoefficients();
  }

  setCutoff(freq: number): void {
    this.cutoff = Math.max(20, Math.min(20000, freq));
    this.updateCoefficients();
  }

  setResonance(res: number): void {
    this.resonance = Math.max(0, Math.min(4, res));
  }

  process(input: number): number {
    // Feedback: subtract resonance-scaled output of 4th stage
    const feedback = this.resonance * this.stage[3];
    let x = input - feedback;

    // 4 cascaded one-pole stages with tanh saturation
    for (let i = 0; i < 4; i++) {
      x = this.stage[i] + this.g * (Math.tanh(x) - Math.tanh(this.stage[i]));
      this.stage[i] = x;
    }

    return x;
  }

  reset(): void {
    this.stage = [0, 0, 0, 0];
  }

  private updateCoefficients(): void {
    // Bilinear transform pre-warped coefficient
    const wc = 2 * Math.PI * this.cutoff / this.sampleRate;
    this.g = Math.tanh(wc / 2);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/bass/__tests__/diodeLadderDSP.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/bass/diodeLadderDSP.ts src/engine/bass/__tests__/diodeLadderDSP.test.ts
git commit -m "feat: add diode ladder filter DSP implementation"
```

---

### Task 8: Diode Ladder AudioWorklet Processor

**Files:**
- Create: `src/engine/bass/diodeLadderProcessor.ts`

- [ ] **Step 1: Create the AudioWorklet processor**

Create `src/engine/bass/diodeLadderProcessor.ts`:

```ts
/**
 * AudioWorkletProcessor wrapping the diode ladder filter.
 *
 * AudioParams:
 *   - frequency: filter cutoff in Hz (20–20000)
 *   - resonance: feedback amount (0–4)
 *
 * This file runs on the audio rendering thread.
 */

// Inline the DSP to avoid import issues in the worklet scope
class DiodeLadderFilter {
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
    this.g = Math.tanh(wc / 2);
  }

  setResonance(res: number): void {
    this.resonance = Math.max(0, Math.min(4, res));
  }

  process(input: number): number {
    const feedback = this.resonance * this.stage[3];
    let x = input - feedback;
    for (let i = 0; i < 4; i++) {
      x = this.stage[i] + this.g * (Math.tanh(x) - Math.tanh(this.stage[i]));
      this.stage[i] = x;
    }
    return x;
  }
}

class DiodeLadderProcessor extends AudioWorkletProcessor {
  private filter: DiodeLadderFilter;

  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
    ];
  }

  constructor() {
    super();
    this.filter = new DiodeLadderFilter(sampleRate);
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;

    const freqParam = parameters.frequency;
    const resParam = parameters.resonance;

    for (let i = 0; i < output.length; i++) {
      // a-rate: read per-sample if array length > 1, otherwise use single value
      const freq = freqParam.length > 1 ? freqParam[i] : freqParam[0];
      const res = resParam.length > 1 ? resParam[i] : resParam[0];

      this.filter.setCutoff(freq);
      this.filter.setResonance(res);
      output[i] = this.filter.process(input[i]);
    }

    return true;
  }
}

registerProcessor('diode-ladder', DiodeLadderProcessor);
```

- [ ] **Step 2: Update TransportManager.init() to register the worklet**

Add worklet registration to `TransportManager.init()` after creating the AudioContext. Add this after the `await this.ctx.resume()` line:

```ts
// Register the diode ladder AudioWorklet
await this.ctx.audioWorklet.addModule(
  new URL('./bass/diodeLadderProcessor.ts', import.meta.url)
);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/engine/bass/diodeLadderProcessor.ts src/engine/TransportManager.ts
git commit -m "feat: add diode ladder AudioWorklet processor"
```

---

### Task 9: Bass Preset Storage + Default Presets

**Files:**
- Create: `src/engine/bass/bassPresetStorage.ts`
- Create: `src/engine/bass/defaultBassPresets.ts`
- Create: `src/engine/bass/__tests__/bassPresetStorage.test.ts`

- [ ] **Step 1: Create default bass presets**

Create `src/engine/bass/defaultBassPresets.ts`:

```ts
import type { BassPatternPreset, BassSynthPreset, BassStep, SynthParams } from './bassTypes';
import { NUM_BASS_STEPS } from './bassTypes';

function bassPatternPreset(
  id: string,
  name: string,
  stepDefs: Array<{ note: number; gate?: 'note' | 'rest' | 'tie'; accent?: boolean; slide?: boolean }>,
): BassPatternPreset {
  const steps: BassStep[] = Array.from({ length: NUM_BASS_STEPS }, (_, i) => {
    const def = stepDefs[i] ?? {};
    return {
      note: def.note ?? 36,
      gate: def.gate ?? 'rest',
      accent: def.accent ?? false,
      slide: def.slide ?? false,
    };
  });
  return { id, name, builtIn: true, steps };
}

function bassSynthPreset(id: string, name: string, synth: SynthParams): BassSynthPreset {
  return { id, name, builtIn: true, synth };
}

// C2=36, D2=38, Eb2=39, F2=41, G2=43, Ab2=44, Bb2=46, C3=48
const C2 = 36, D2 = 38, Eb2 = 39, F2 = 41, G2 = 43, Ab2 = 44, Bb2 = 46, C3 = 48;
const D3 = 50, Eb3 = 51, F3 = 53, G3 = 55;

export const DEFAULT_BASS_PATTERN_PRESETS: BassPatternPreset[] = [
  bassPatternPreset('builtin-acid-line', 'Acid Line', [
    { note: C2, gate: 'note', accent: true },
    { note: C2, gate: 'rest' },
    { note: Eb2, gate: 'note', slide: true },
    { note: F2, gate: 'note', accent: true },
    { note: G2, gate: 'note', slide: true },
    { note: Ab2, gate: 'note' },
    { note: G2, gate: 'tie' },
    { note: G2, gate: 'rest' },
    { note: C3, gate: 'note', accent: true, slide: true },
    { note: Bb2, gate: 'note' },
    { note: Ab2, gate: 'note', slide: true },
    { note: G2, gate: 'note' },
    { note: F2, gate: 'note', accent: true },
    { note: Eb2, gate: 'note', slide: true },
    { note: D2, gate: 'note' },
    { note: C2, gate: 'note' },
  ]),

  bassPatternPreset('builtin-resonance-workout', 'Resonance Workout', [
    { note: C2, gate: 'note', accent: true, slide: true },
    { note: C3, gate: 'note', accent: true, slide: true },
    { note: G2, gate: 'note', slide: true },
    { note: Eb3, gate: 'note', accent: true },
    { note: C2, gate: 'rest' },
    { note: F2, gate: 'note', slide: true },
    { note: Ab2, gate: 'note', accent: true, slide: true },
    { note: C3, gate: 'note' },
    { note: C2, gate: 'note', accent: true, slide: true },
    { note: G3, gate: 'note', accent: true, slide: true },
    { note: F3, gate: 'note' },
    { note: Eb3, gate: 'note', slide: true },
    { note: C3, gate: 'note', accent: true },
    { note: G2, gate: 'note', slide: true },
    { note: Eb2, gate: 'note' },
    { note: C2, gate: 'note', accent: true },
  ]),

  bassPatternPreset('builtin-bubbling', 'Bubbling', [
    { note: C2, gate: 'note', accent: true },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'rest' },
    { note: Eb2, gate: 'note' },
    { note: Eb2, gate: 'rest' },
    { note: C2, gate: 'note' },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'tie' },
    { note: G2, gate: 'note', accent: true },
    { note: G2, gate: 'rest' },
    { note: F2, gate: 'note' },
    { note: F2, gate: 'rest' },
    { note: Eb2, gate: 'note' },
    { note: Eb2, gate: 'tie' },
    { note: Eb2, gate: 'rest' },
    { note: C2, gate: 'note', accent: true },
  ]),

  bassPatternPreset('builtin-sub-bass', 'Sub Bass', [
    { note: C2, gate: 'note', accent: true },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'tie' },
    { note: F2, gate: 'note' },
    { note: F2, gate: 'tie' },
    { note: F2, gate: 'tie' },
    { note: F2, gate: 'tie' },
    { note: Ab2, gate: 'note' },
    { note: Ab2, gate: 'tie' },
    { note: G2, gate: 'note' },
    { note: G2, gate: 'tie' },
    { note: C2, gate: 'note', accent: true },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'tie' },
    { note: C2, gate: 'tie' },
  ]),

  bassPatternPreset('builtin-staccato-funk', 'Staccato Funk', [
    { note: C2, gate: 'note', accent: true },
    { note: C2, gate: 'rest' },
    { note: C2, gate: 'note' },
    { note: Eb2, gate: 'rest' },
    { note: G2, gate: 'note', accent: true },
    { note: G2, gate: 'rest' },
    { note: F2, gate: 'note' },
    { note: C2, gate: 'rest' },
    { note: Eb2, gate: 'note', accent: true },
    { note: Eb2, gate: 'rest' },
    { note: C2, gate: 'note' },
    { note: G2, gate: 'rest' },
    { note: C3, gate: 'note', accent: true },
    { note: C3, gate: 'rest' },
    { note: Bb2, gate: 'note' },
    { note: Ab2, gate: 'rest' },
  ]),

  bassPatternPreset('builtin-arpeggiated', 'Arpeggiated', [
    { note: C2, gate: 'note', accent: true },
    { note: Eb2, gate: 'note', slide: true },
    { note: G2, gate: 'note', slide: true },
    { note: C3, gate: 'note', accent: true },
    { note: G2, gate: 'note', slide: true },
    { note: Eb2, gate: 'note', slide: true },
    { note: C2, gate: 'note' },
    { note: C2, gate: 'rest' },
    { note: F2, gate: 'note', accent: true },
    { note: Ab2, gate: 'note', slide: true },
    { note: C3, gate: 'note', slide: true },
    { note: F3, gate: 'note', accent: true },
    { note: C3, gate: 'note', slide: true },
    { note: Ab2, gate: 'note', slide: true },
    { note: F2, gate: 'note' },
    { note: F2, gate: 'rest' },
  ]),
];

export const DEFAULT_BASS_SYNTH_PRESETS: BassSynthPreset[] = [
  bassSynthPreset('builtin-classic-acid', 'Classic Acid', {
    waveform: 'sawtooth', cutoff: 0.4, resonance: 0.7, envMod: 0.7, decay: 0.4, accent: 0.6, volume: 0.8,
  }),
  bassSynthPreset('builtin-squelch', 'Squelch', {
    waveform: 'square', cutoff: 0.2, resonance: 0.9, envMod: 0.9, decay: 0.3, accent: 0.8, volume: 0.75,
  }),
  bassSynthPreset('builtin-warm-bass', 'Warm Bass', {
    waveform: 'sawtooth', cutoff: 0.3, resonance: 0.2, envMod: 0.2, decay: 0.6, accent: 0.3, volume: 0.85,
  }),
  bassSynthPreset('builtin-screamer', 'Screamer', {
    waveform: 'sawtooth', cutoff: 0.7, resonance: 0.75, envMod: 0.6, decay: 0.2, accent: 0.7, volume: 0.7,
  }),
  bassSynthPreset('builtin-hollow', 'Hollow', {
    waveform: 'square', cutoff: 0.45, resonance: 0.45, envMod: 0.4, decay: 0.5, accent: 0.4, volume: 0.8,
  }),
  bassSynthPreset('builtin-dark-sub', 'Dark Sub', {
    waveform: 'sawtooth', cutoff: 0.15, resonance: 0.1, envMod: 0.05, decay: 0.7, accent: 0.2, volume: 0.9,
  }),
];
```

- [ ] **Step 2: Create bassPresetStorage.ts**

Create `src/engine/bass/bassPresetStorage.ts`:

```ts
import type { BassPatternPreset, BassSynthPreset } from './bassTypes';
import { DEFAULT_BASS_PATTERN_PRESETS, DEFAULT_BASS_SYNTH_PRESETS } from './defaultBassPresets';

const PATTERN_KEY = 'tr909-bass-pattern-presets';
const SYNTH_KEY = 'tr909-bass-synth-presets';

function readJSON<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const BassPresetStorage = {
  getPatternPresets(): BassPatternPreset[] {
    return [...DEFAULT_BASS_PATTERN_PRESETS, ...readJSON<BassPatternPreset>(PATTERN_KEY)];
  },

  getSynthPresets(): BassSynthPreset[] {
    return [...DEFAULT_BASS_SYNTH_PRESETS, ...readJSON<BassSynthPreset>(SYNTH_KEY)];
  },

  savePatternPreset(preset: BassPatternPreset): void {
    const existing = readJSON<BassPatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, [...existing.filter((p) => p.id !== preset.id), preset]);
  },

  saveSynthPreset(preset: BassSynthPreset): void {
    const existing = readJSON<BassSynthPreset>(SYNTH_KEY);
    writeJSON(SYNTH_KEY, [...existing.filter((p) => p.id !== preset.id), preset]);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_BASS_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<BassPatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteSynthPreset(id: string): void {
    if (DEFAULT_BASS_SYNTH_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<BassSynthPreset>(SYNTH_KEY);
    writeJSON(SYNTH_KEY, existing.filter((p) => p.id !== id));
  },
};
```

- [ ] **Step 3: Write and run tests for bassPresetStorage**

Create `src/engine/bass/__tests__/bassPresetStorage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BassPresetStorage } from '../bassPresetStorage';
import { DEFAULT_BASS_PATTERN_PRESETS, DEFAULT_BASS_SYNTH_PRESETS } from '../defaultBassPresets';

describe('BassPresetStorage', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns built-in pattern presets when empty', () => {
    const presets = BassPresetStorage.getPatternPresets();
    expect(presets.length).toBe(DEFAULT_BASS_PATTERN_PRESETS.length);
  });

  it('returns built-in synth presets when empty', () => {
    const presets = BassPresetStorage.getSynthPresets();
    expect(presets.length).toBe(DEFAULT_BASS_SYNTH_PRESETS.length);
  });

  it('saves and retrieves a user pattern preset', () => {
    const preset = { id: 'user-1', name: 'Test', builtIn: false, steps: DEFAULT_BASS_PATTERN_PRESETS[0].steps };
    BassPresetStorage.savePatternPreset(preset);
    expect(BassPresetStorage.getPatternPresets().find((p) => p.id === 'user-1')).toBeDefined();
  });

  it('saves and retrieves a user synth preset', () => {
    const preset = { id: 'user-s1', name: 'Test', builtIn: false, synth: DEFAULT_BASS_SYNTH_PRESETS[0].synth };
    BassPresetStorage.saveSynthPreset(preset);
    expect(BassPresetStorage.getSynthPresets().find((p) => p.id === 'user-s1')).toBeDefined();
  });

  it('deletes user preset but not built-in', () => {
    const preset = { id: 'user-1', name: 'Test', builtIn: false, steps: DEFAULT_BASS_PATTERN_PRESETS[0].steps };
    BassPresetStorage.savePatternPreset(preset);
    BassPresetStorage.deletePatternPreset('user-1');
    expect(BassPresetStorage.getPatternPresets().find((p) => p.id === 'user-1')).toBeUndefined();

    const builtInId = DEFAULT_BASS_PATTERN_PRESETS[0].id;
    BassPresetStorage.deletePatternPreset(builtInId);
    expect(BassPresetStorage.getPatternPresets().find((p) => p.id === builtInId)).toBeDefined();
  });
});
```

Run: `npx vitest run src/engine/bass/__tests__/bassPresetStorage.test.ts`
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine/bass/defaultBassPresets.ts src/engine/bass/bassPresetStorage.ts src/engine/bass/__tests__/bassPresetStorage.test.ts
git commit -m "feat: add bass preset storage with 6 pattern and 6 synth defaults"
```

---

### Task 10: BassEngine

**Files:**
- Create: `src/engine/bass/BassEngine.ts`
- Create: `src/engine/bass/__tests__/BassEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/bass/__tests__/BassEngine.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BassEngine } from '../BassEngine';
import { TransportManager } from '../../TransportManager';

describe('BassEngine', () => {
  let transport: TransportManager;

  beforeEach(() => {
    localStorage.clear();
    transport = new TransportManager();
  });

  it('returns default snapshot', () => {
    const bass = new BassEngine(transport);
    const snap = bass.getSnapshot();
    expect(snap.pattern.steps.length).toBe(16);
    expect(snap.synth.waveform).toBe('sawtooth');
    expect(snap.synth.cutoff).toBe(0.5);
    expect(snap.presets.patterns.length).toBeGreaterThan(0);
    expect(snap.presets.synths.length).toBeGreaterThan(0);
    expect(snap.presets.activePatternId).toBeNull();
    expect(snap.presets.activeSynthId).toBeNull();
  });

  it('setNote updates step note', () => {
    const bass = new BassEngine(transport);
    bass.setNote(0, 48);
    expect(bass.getSnapshot().pattern.steps[0].note).toBe(48);
  });

  it('toggleAccent flips accent', () => {
    const bass = new BassEngine(transport);
    bass.toggleAccent(0);
    expect(bass.getSnapshot().pattern.steps[0].accent).toBe(true);
    bass.toggleAccent(0);
    expect(bass.getSnapshot().pattern.steps[0].accent).toBe(false);
  });

  it('toggleSlide flips slide', () => {
    const bass = new BassEngine(transport);
    bass.toggleSlide(0);
    expect(bass.getSnapshot().pattern.steps[0].slide).toBe(true);
  });

  it('setGate updates gate type', () => {
    const bass = new BassEngine(transport);
    bass.setGate(0, 'note');
    expect(bass.getSnapshot().pattern.steps[0].gate).toBe('note');
    bass.setGate(0, 'tie');
    expect(bass.getSnapshot().pattern.steps[0].gate).toBe('tie');
  });

  it('setSynthParam updates synth params', () => {
    const bass = new BassEngine(transport);
    bass.setSynthParam('cutoff', 0.8);
    expect(bass.getSnapshot().synth.cutoff).toBe(0.8);
  });

  it('setWaveform updates waveform', () => {
    const bass = new BassEngine(transport);
    bass.setWaveform('square');
    expect(bass.getSnapshot().synth.waveform).toBe('square');
  });

  it('subscribe notifies on change', () => {
    const bass = new BassEngine(transport);
    const cb = vi.fn();
    const unsub = bass.subscribe(cb);
    bass.setNote(0, 48);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    bass.setNote(0, 36);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('dirty tracking: pattern edit nullifies activePatternId', () => {
    const bass = new BassEngine(transport);
    const presetId = bass.getSnapshot().presets.patterns[0].id;
    bass.loadPatternPreset(presetId);
    expect(bass.getSnapshot().presets.activePatternId).toBe(presetId);
    bass.setNote(0, 48);
    expect(bass.getSnapshot().presets.activePatternId).toBeNull();
  });

  it('dirty tracking: synth edit nullifies activeSynthId', () => {
    const bass = new BassEngine(transport);
    const presetId = bass.getSnapshot().presets.synths[0].id;
    bass.loadSynthPreset(presetId);
    expect(bass.getSnapshot().presets.activeSynthId).toBe(presetId);
    bass.setSynthParam('cutoff', 0.9);
    expect(bass.getSnapshot().presets.activeSynthId).toBeNull();
  });

  it('savePatternPreset creates preset and sets activePatternId', () => {
    const bass = new BassEngine(transport);
    bass.setGate(0, 'note');
    const beforeCount = bass.getSnapshot().presets.patterns.length;
    bass.savePatternPreset('My Bass');
    const snap = bass.getSnapshot();
    expect(snap.presets.patterns.length).toBe(beforeCount + 1);
    expect(snap.presets.activePatternId).not.toBeNull();
  });

  it('saveSynthPreset creates preset and sets activeSynthId', () => {
    const bass = new BassEngine(transport);
    bass.setSynthParam('cutoff', 0.9);
    const beforeCount = bass.getSnapshot().presets.synths.length;
    bass.saveSynthPreset('My Synth');
    const snap = bass.getSnapshot();
    expect(snap.presets.synths.length).toBe(beforeCount + 1);
    expect(snap.presets.activeSynthId).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/bass/__tests__/BassEngine.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement BassEngine**

Create `src/engine/bass/BassEngine.ts`:

```ts
import type {
  BassSnapshot,
  BassPatternPreset,
  BassSynthPreset,
  SynthParams,
  BassStep,
} from './bassTypes';
import { createDefaultBassPattern, DEFAULT_SYNTH_PARAMS, midiToFreq, NUM_BASS_STEPS } from './bassTypes';
import { BassPresetStorage } from './bassPresetStorage';
import type { TransportManager } from '../TransportManager';

export class BassEngine {
  private transport: TransportManager;
  private listeners = new Set<() => void>();
  private snapshot: BassSnapshot;

  // Audio nodes — created when transport is initialized
  private osc: OscillatorNode | null = null;
  private filterNode: AudioWorkletNode | null = null;
  private vca: GainNode | null = null;
  private isPlaying = false;

  constructor(transport: TransportManager) {
    this.transport = transport;
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

    transport.registerTickCallback((ctx, dest, time, step) => this.onTick(ctx, dest, time, step));
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
    this.updateStep(step, { note: clamped });
    this.dirtyPattern();
  }

  toggleAccent(step: number): void {
    const current = this.snapshot.pattern.steps[step];
    this.updateStep(step, { accent: !current.accent });
    this.dirtyPattern();
  }

  toggleSlide(step: number): void {
    const current = this.snapshot.pattern.steps[step];
    this.updateStep(step, { slide: !current.slide });
    this.dirtyPattern();
  }

  setGate(step: number, gate: 'note' | 'rest' | 'tie'): void {
    this.updateStep(step, { gate });
    this.dirtyPattern();
  }

  // --- Synth Params ---

  setSynthParam(param: keyof SynthParams, value: number | string): void {
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
    if (this.osc) {
      this.osc.type = wf;
    }
  }

  // --- Preset Management ---

  loadPatternPreset(id: string): void {
    const preset = this.snapshot.presets.patterns.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      pattern: { steps: structuredClone(preset.steps) },
      presets: { ...this.snapshot.presets, activePatternId: id },
    });
  }

  loadSynthPreset(id: string): void {
    const preset = this.snapshot.presets.synths.find((p) => p.id === id);
    if (!preset) return;
    this.emit({
      synth: { ...preset.synth },
      presets: { ...this.snapshot.presets, activeSynthId: id },
    });
    // Apply waveform change to live oscillator
    if (this.osc) {
      this.osc.type = preset.synth.waveform;
    }
  }

  savePatternPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: BassPatternPreset = {
      id, name, builtIn: false,
      steps: structuredClone(this.snapshot.pattern.steps),
    };
    BassPresetStorage.savePatternPreset(preset);
    this.emit({
      presets: { ...this.snapshot.presets, patterns: BassPresetStorage.getPatternPresets(), activePatternId: id },
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
      presets: { ...this.snapshot.presets, synths: BassPresetStorage.getSynthPresets(), activeSynthId: id },
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
    if (!this.osc) {
      this.initSynthNodes(ctx, dest);
    }

    const bassStep = this.snapshot.pattern.steps[step];
    const synth = this.snapshot.synth;
    const nextStep = this.snapshot.pattern.steps[(step + 1) % NUM_BASS_STEPS];

    if (bassStep.gate === 'rest') {
      // Silence — close the VCA
      this.vca!.gain.setValueAtTime(0, time);
      return;
    }

    if (bassStep.gate === 'tie') {
      // Sustain — don't re-trigger envelope, just keep playing
      return;
    }

    // --- Gate: 'note' ---
    const freq = midiToFreq(bassStep.note);
    const accentBoost = bassStep.accent ? synth.accent : 0;

    // Set or slide pitch
    const prevStep = this.snapshot.pattern.steps[(step - 1 + NUM_BASS_STEPS) % NUM_BASS_STEPS];
    if (prevStep.slide && prevStep.gate !== 'rest') {
      // Slide from previous note to this one
      this.osc!.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
    } else {
      this.osc!.frequency.setValueAtTime(freq, time);
    }

    // VCA envelope
    const volume = synth.volume * (1 + accentBoost * 0.5);
    this.vca!.gain.cancelScheduledValues(time);
    this.vca!.gain.setValueAtTime(volume, time);

    // If next step is not a tie or slide, schedule note off
    if (!bassStep.slide || nextStep.gate === 'rest') {
      const decayTime = 0.03 + synth.decay * 0.5;
      this.vca!.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
    }

    // Filter envelope
    const baseCutoffHz = 20 * Math.pow(1000, synth.cutoff); // 20–20000 Hz log scale
    const envAmount = baseCutoffHz * synth.envMod * 4 * (1 + accentBoost * 2);
    const decayTime = 0.03 + synth.decay * 0.5;

    if (this.filterNode) {
      const freqParam = this.filterNode.parameters.get('frequency');
      const resParam = this.filterNode.parameters.get('resonance');
      if (freqParam) {
        freqParam.cancelScheduledValues(time);
        freqParam.setValueAtTime(Math.min(20000, baseCutoffHz + envAmount), time);
        freqParam.exponentialRampToValueAtTime(Math.max(20, baseCutoffHz), time + decayTime);
      }
      if (resParam) {
        resParam.setValueAtTime(synth.resonance * 4, time);
      }
    }
  }

  private initSynthNodes(ctx: AudioContext, dest: AudioNode): void {
    const synth = this.snapshot.synth;

    this.osc = ctx.createOscillator();
    this.osc.type = synth.waveform;
    this.osc.frequency.value = midiToFreq(36); // C2 default

    this.vca = ctx.createGain();
    this.vca.gain.value = 0;

    try {
      this.filterNode = new AudioWorkletNode(ctx, 'diode-ladder');
      this.osc.connect(this.filterNode);
      this.filterNode.connect(this.vca);
    } catch {
      // Worklet not available — connect directly (fallback)
      this.osc.connect(this.vca);
    }

    this.vca.connect(dest);
    this.osc.start();
  }

  // --- Internal ---

  private updateStep(step: number, partial: Partial<BassStep>): void {
    const steps = [...this.snapshot.pattern.steps];
    steps[step] = { ...steps[step], ...partial };
    this.emit({ pattern: { steps } });
  }

  private dirtyPattern(): void {
    this.emit({
      presets: { ...this.snapshot.presets, activePatternId: null },
    });
  }

  private emit(partial: Partial<BassSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/bass/__tests__/BassEngine.test.ts`
Expected: All PASS.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/bass/BassEngine.ts src/engine/bass/__tests__/BassEngine.test.ts
git commit -m "feat: add BassEngine with sequencer, synthesis, and presets"
```

---

## Phase 3: Bass UI + Keyboard

### Task 11: Bass Hooks

**Files:**
- Create: `src/hooks/useBass.ts`

- [ ] **Step 1: Create bass hooks**

Create `src/hooks/useBass.ts`:

```ts
import { useSyncExternalStore } from 'react';
import { BassEngine } from '../engine/bass/BassEngine';
import type { BassSnapshot, SynthParams, BassPattern } from '../engine/bass/bassTypes';
import { transport } from './useTransport';

export const bassEngine = new BassEngine(transport);

export function useBassSnapshot(): BassSnapshot {
  return useSyncExternalStore(bassEngine.subscribe, bassEngine.getSnapshot);
}

export function useBassPattern(): BassPattern {
  return useSyncExternalStore(
    bassEngine.subscribe,
    () => bassEngine.getSnapshot().pattern,
  );
}

export function useBassSynth(): SynthParams {
  return useSyncExternalStore(
    bassEngine.subscribe,
    () => bassEngine.getSnapshot().synth,
  );
}

export function useBassPresets(): BassSnapshot['presets'] {
  return useSyncExternalStore(
    bassEngine.subscribe,
    () => bassEngine.getSnapshot().presets,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useBass.ts
git commit -m "feat: add useBass hooks"
```

---

### Task 12: Bass UI Components

**Files:**
- Create: `src/components/BassSection.tsx`
- Create: `src/components/BassHeader.tsx`
- Create: `src/components/BassKnobs.tsx`
- Create: `src/components/BassStepGrid.tsx`
- Create: `src/components/BassStepEditor.tsx`

This task creates all 5 bass UI components. Each is self-contained. Due to the size, the implementer should create them following the patterns established by the drum components (same CSS class conventions, same knob interaction pattern).

**BassHeader:** Title "TB-303", two PresetSelector dropdowns (Pattern + Synth), SAW/SQR toggle button.

**BassKnobs:** 6 knobs — Cutoff, Resonance, Env Mod, Decay, Accent, Volume. Same `MasterKnob`-style component with `onMouseDown` drag.

**BassStepGrid:** 16 step buttons in groups of 4. Each shows: note name, gate state (filled=note, empty=rest, striped=tie), accent dot, slide indicator "S". Click sets step as selected. Drag up/down on a step changes its pitch.

**BassStepEditor:** Controls for the selected step: Note display with +/- octave buttons, gate type buttons (N/R/T), accent toggle, slide toggle.

**BassSection:** Container wrapping all 4 above.

The implementer should:
1. Create all 5 components
2. Use existing `PresetSelector` component for the header presets
3. Follow BEM class naming: `bass-section__*`, `bass-header__*`, `bass-knobs__*`, `bass-step-grid__*`, `bass-step-editor__*`
4. Verify TypeScript compiles

- [ ] **Step 1: Create all 5 components**

(Implementer creates the files — too large to inline full code here but the spec above defines exactly what each does)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/Bass*.tsx
git commit -m "feat: add bass section UI components"
```

---

### Task 13: CSS for Bass Section

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add bass section styles**

Append bass section CSS following the same patterns as the drum section. Key classes:

- `.bass-section` — container panel, same style as `.tr909` but with a different accent color or border to distinguish
- `.bass-header` — flex row with title, presets, waveform toggle
- `.bass-header__title` — "TB-303" in accent color
- `.bass-header__waveform-toggle` — SAW/SQR button
- `.bass-knobs` — same layout as `.master__knobs`
- `.bass-step-grid` — same grouping as drum `.step-grid` but steps show note name + indicators
- `.bass-step` — individual step (larger than drum steps to fit note name)
- `.bass-step--note`, `.bass-step--rest`, `.bass-step--tie` — gate state variants
- `.bass-step--selected` — outline like drum selected step
- `.bass-step__note-name` — note text inside step
- `.bass-step__accent` — small accent indicator
- `.bass-step__slide` — slide indicator
- `.bass-step-editor` — row of edit controls below the grid

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add bass section CSS styles"
```

---

### Task 14: Wire Bass into App + Update Keyboard

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Add BassSection to App**

Import `BassSection` and add it below `<MasterSection />`:

```tsx
<MasterSection />
<BassSection selectedStep={bassSelectedStep} />
```

Add `bassSelectedStep` state and `focusPanel` state ('drum' | 'bass') to App.

- [ ] **Step 2: Update useKeyboard for Tab focus and 303 keys**

Add to the keyboard state interface:
```ts
focusPanel: 'drum' | 'bass';
setFocusPanel: (panel: 'drum' | 'bass') => void;
bassSelectedStep: number;
setBassSelectedStep: (step: number) => void;
```

Add Tab handler to switch `focusPanel`. When `focusPanel === 'bass'`, remap keys:
- `←`/`→` — bass step navigation
- `↑`/`↓` — pitch up/down semitone
- `S` — toggle slide
- `A` — toggle accent
- `N` — set gate to note
- `R` — set gate to rest
- `T` — set gate to tie

BPM/shuffle (Up/Down without bass focus), Space (play/stop), and number keys (instrument selection) work regardless of focus panel.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 4: Run TypeScript check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: No errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire bass section into App with keyboard focus switching"
```

---

### Task 15: Final Verification

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
Expected: App loads with 909 drum section, master section, and 303 bass section. Both sequencers play in sync. Tab switches keyboard focus between panels. Bass presets load. Diode ladder filter creates the acid sound when cutoff/resonance/envMod are high.
