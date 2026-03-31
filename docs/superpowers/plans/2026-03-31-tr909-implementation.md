# TR-909 Web Audio Drum Machine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully-synthesized TR-909 drum machine with a React UI powered by a standalone Web Audio engine, connected via `useSyncExternalStore`.

**Architecture:** A single `AudioEngine` class external to React owns all audio state and processing. React subscribes to an immutable snapshot via `useSyncExternalStore`. Components call engine methods directly for mutations. A lookahead clock schedules notes ahead of time using `AudioContext.currentTime` for drift-free timing.

**Tech Stack:** Vite, React 19, TypeScript (strict), Web Audio API, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-31-tr909-design.md`

---

## File Map

```
(root)
  package.json              — project config, scripts, dependencies
  tsconfig.json             — TypeScript strict config
  tsconfig.app.json         — app-specific TS config
  tsconfig.node.json        — node/vite TS config
  vite.config.ts            — Vite config with React plugin
  index.html                — Vite entry HTML
  src/
    main.tsx                — React root mount
    engine/
      types.ts              — InstrumentId, InstrumentParams, EngineSnapshot, VoiceTrigger
      clock.ts              — Lookahead scheduler class
      AudioEngine.ts        — Main engine: state, subscribe/getSnapshot, mutations, voice triggering
      voices/
        kick.ts             — Bass drum synthesis
        snare.ts            — Snare drum synthesis
        clap.ts             — Clap synthesis
        rimshot.ts          — Rimshot synthesis
        closedHat.ts        — Closed hi-hat synthesis
        openHat.ts          — Open hi-hat synthesis (returns gain node for choke)
        lowTom.ts           — Low tom synthesis
        midTom.ts           — Mid tom synthesis
        hiTom.ts            — Hi tom synthesis
        crash.ts            — Crash cymbal synthesis
        ride.ts             — Ride cymbal synthesis
        index.ts            — Voice registry mapping InstrumentId → VoiceTrigger
    hooks/
      useEngine.ts          — useSyncExternalStore hooks + engine singleton
    components/
      App.tsx               — Root component, selected instrument state, init gate
      InitOverlay.tsx       — "Click to start" overlay for AudioContext
      Transport.tsx         — Play/Stop/BPM controls
      InstrumentSelector.tsx — 11 voice tabs
      ParamKnobs.tsx        — Rotary knobs for selected instrument
      StepGrid.tsx          — 16 step buttons for selected instrument
      AccentRow.tsx         — 16 accent toggles
      Playhead.tsx          — Current step indicator
    styles/
      index.css             — Global styles, CSS custom properties, component styles
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `.gitignore`

- [ ] **Step 1: Initialize Vite project**

Run:
```bash
cd /Users/gregorycollett/projects/personal/web-audio-909
npm create vite@latest . -- --template react-ts
```

Select current directory when prompted. This generates the full scaffold.

- [ ] **Step 2: Remove boilerplate files**

Delete the generated demo files we don't need:
```bash
rm src/App.css src/App.tsx src/index.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

- [ ] **Step 4: Configure Vitest**

Add test config to `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
```

- [ ] **Step 5: Add test script to package.json**

Add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create minimal entry point**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>TR-909</div>
  </StrictMode>,
)
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, page shows "TR-909".

- [ ] **Step 8: Add .superpowers to .gitignore**

Append `.superpowers/` to `.gitignore`.

- [ ] **Step 9: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Engine Types

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: Create the types file**

Create `src/engine/types.ts`:

```ts
export const INSTRUMENT_IDS = [
  'kick', 'snare', 'clap', 'rimshot',
  'closedHat', 'openHat',
  'lowTom', 'midTom', 'hiTom',
  'crash', 'ride',
] as const;

export type InstrumentId = typeof INSTRUMENT_IDS[number];

export interface InstrumentParams {
  level: number;   // 0–1
  decay: number;   // 0–1
  tune?: number;   // 0–1, only for voices that support tuning
}

export interface EngineSnapshot {
  transport: {
    playing: boolean;
    bpm: number;
    currentStep: number; // 0–15
  };
  pattern: {
    steps: Record<InstrumentId, boolean[]>;
    accents: boolean[];
  };
  instruments: Record<InstrumentId, InstrumentParams>;
}

export type VoiceTrigger = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  params: InstrumentParams,
  accent: boolean,
) => void;

/** VoiceTrigger variant that returns a GainNode for choke group support */
export type ChokableVoiceTrigger = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  params: InstrumentParams,
  accent: boolean,
) => GainNode;

export const TUNABLE_INSTRUMENTS: Set<InstrumentId> = new Set([
  'kick', 'snare', 'lowTom', 'midTom', 'hiTom',
]);

export const NUM_STEPS = 16;

export function createDefaultSteps(): Record<InstrumentId, boolean[]> {
  const steps = {} as Record<InstrumentId, boolean[]>;
  for (const id of INSTRUMENT_IDS) {
    steps[id] = new Array(NUM_STEPS).fill(false);
  }
  return steps;
}

export function createDefaultInstruments(): Record<InstrumentId, InstrumentParams> {
  const instruments = {} as Record<InstrumentId, InstrumentParams>;
  for (const id of INSTRUMENT_IDS) {
    instruments[id] = {
      level: 0.8,
      decay: 0.5,
      ...(TUNABLE_INSTRUMENTS.has(id) ? { tune: 0.5 } : {}),
    };
  }
  return instruments;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add engine types and default factories"
```

---

### Task 3: Lookahead Clock

**Files:**
- Create: `src/engine/clock.ts`, `src/engine/__tests__/clock.test.ts`

- [ ] **Step 1: Write failing tests for the clock**

Create `src/engine/__tests__/clock.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Clock } from '../clock';

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTick with scheduled time when started', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);

    // Advance past the scheduler interval (25ms)
    vi.advanceTimersByTime(30);

    expect(onTick).toHaveBeenCalled();
    const [time, step] = onTick.mock.calls[0];
    expect(typeof time).toBe('number');
    expect(step).toBe(0);
  });

  it('does not call onTick when stopped', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);
    clock.stop();

    vi.advanceTimersByTime(100);

    // onTick may have been called before stop, but no calls after
    const callCount = onTick.mock.calls.length;
    vi.advanceTimersByTime(200);
    expect(onTick.mock.calls.length).toBe(callCount);
  });

  it('advances steps 0 through 15 then wraps to 0', () => {
    const onTick = vi.fn();
    // At 120 BPM, 16th note = 0.125s = 125ms
    let currentTime = 0;
    const mockCtx = {
      get currentTime() { return currentTime; },
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);

    const steps: number[] = [];
    // Advance enough to get 17 ticks (0-15 + wrap to 0)
    for (let i = 0; i < 17; i++) {
      vi.advanceTimersByTime(130);
      currentTime += 0.13;
    }

    for (const call of onTick.mock.calls) {
      steps.push(call[1]);
    }

    // Should see 0,1,2,...15,0
    expect(steps.length).toBeGreaterThanOrEqual(17);
    expect(steps[0]).toBe(0);
    expect(steps[15]).toBe(15);
    expect(steps[16]).toBe(0);
  });

  it('respects BPM for timing', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    // 60 BPM = one beat per second = one 16th note every 0.25s
    clock.start(mockCtx, 60);

    expect(clock.getStepDuration()).toBeCloseTo(0.25);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/clock.test.ts
```

Expected: FAIL — `Clock` not found.

- [ ] **Step 3: Implement the clock**

Create `src/engine/clock.ts`:

```ts
import { NUM_STEPS } from './types';

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_S = 0.1;

export class Clock {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private stepDuration = 0;
  private ctx: AudioContext | null = null;
  private onTick: (time: number, step: number) => void;

  constructor(onTick: (time: number, step: number) => void) {
    this.onTick = onTick;
  }

  start(ctx: AudioContext, bpm: number): void {
    this.ctx = ctx;
    this.currentStep = 0;
    this.stepDuration = 60 / bpm / 4; // 16th notes
    this.nextNoteTime = ctx.currentTime;
    this.intervalId = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.ctx = null;
  }

  setBpm(bpm: number): void {
    this.stepDuration = 60 / bpm / 4;
  }

  getStepDuration(): number {
    return this.stepDuration;
  }

  private schedule(): void {
    if (!this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + LOOKAHEAD_S) {
      this.onTick(this.nextNoteTime, this.currentStep);
      this.nextNoteTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % NUM_STEPS;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/clock.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/clock.ts src/engine/__tests__/clock.test.ts
git commit -m "feat: add lookahead sequencer clock"
```

---

### Task 4: Voice Synthesis — Kick

**Files:**
- Create: `src/engine/voices/kick.ts`, `src/engine/voices/__tests__/kick.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/voices/__tests__/kick.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { kick } from '../kick';

describe('kick voice', () => {
  it('is a function', () => {
    expect(typeof kick).toBe('function');
  });

  it('does not throw when triggered with OfflineAudioContext', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      kick(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, false);
    }).not.toThrow();

    // Render to ensure nodes are connected and don't error
    await ctx.startRendering();
  });

  it('respects accent by producing louder output', async () => {
    const ctxNormal = new OfflineAudioContext(1, 44100, 44100);
    kick(ctxNormal, ctxNormal.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, false);
    const bufferNormal = await ctxNormal.startRendering();

    const ctxAccent = new OfflineAudioContext(1, 44100, 44100);
    kick(ctxAccent, ctxAccent.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, true);
    const bufferAccent = await ctxAccent.startRendering();

    const peakNormal = Math.max(...Array.from(bufferNormal.getChannelData(0)).map(Math.abs));
    const peakAccent = Math.max(...Array.from(bufferAccent.getChannelData(0)).map(Math.abs));

    expect(peakAccent).toBeGreaterThan(peakNormal);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/voices/__tests__/kick.test.ts
```

Expected: FAIL — `kick` not found.

- [ ] **Step 3: Implement kick synthesis**

Create `src/engine/voices/kick.ts`:

```ts
import type { VoiceTrigger } from '../types';

export const kick: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);

  // Pitch envelope: sweep from high to low
  const tuneOffset = (params.tune ?? 0.5) - 0.5; // -0.5 to 0.5
  const startFreq = 150 + tuneOffset * 60;
  const endFreq = 50 + tuneOffset * 20;
  const decayTime = 0.1 + params.decay * 0.4; // 0.1s to 0.5s

  // Main sine oscillator
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, time);
  osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.04);

  // Oscillator gain envelope
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(gainLevel, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc.connect(oscGain);
  oscGain.connect(destination);

  osc.start(time);
  osc.stop(time + decayTime);

  // Click/attack noise burst
  const bufferSize = ctx.sampleRate * 0.02;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseBand = ctx.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.value = 100;
  noiseBand.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(gainLevel * 0.4, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

  noise.connect(noiseBand);
  noiseBand.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.02);
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/kick.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voices/kick.ts src/engine/voices/__tests__/kick.test.ts
git commit -m "feat: add kick drum synthesis"
```

---

### Task 5: Voice Synthesis — Snare

**Files:**
- Create: `src/engine/voices/snare.ts`, `src/engine/voices/__tests__/snare.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/voices/__tests__/snare.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { snare } from '../snare';

describe('snare voice', () => {
  it('is a function', () => {
    expect(typeof snare).toBe('function');
  });

  it('does not throw when triggered with OfflineAudioContext', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      snare(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, false);
    }).not.toThrow();
    await ctx.startRendering();
  });

  it('respects accent by producing louder output', async () => {
    const ctxNormal = new OfflineAudioContext(1, 44100, 44100);
    snare(ctxNormal, ctxNormal.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, false);
    const bufferNormal = await ctxNormal.startRendering();

    const ctxAccent = new OfflineAudioContext(1, 44100, 44100);
    snare(ctxAccent, ctxAccent.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, true);
    const bufferAccent = await ctxAccent.startRendering();

    const peakNormal = Math.max(...Array.from(bufferNormal.getChannelData(0)).map(Math.abs));
    const peakAccent = Math.max(...Array.from(bufferAccent.getChannelData(0)).map(Math.abs));

    expect(peakAccent).toBeGreaterThan(peakNormal);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/voices/__tests__/snare.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement snare synthesis**

Create `src/engine/voices/snare.ts`:

```ts
import type { VoiceTrigger } from '../types';

export const snare: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const tuneOffset = (params.tune ?? 0.5) - 0.5;
  const bodyFreq = 180 + tuneOffset * 60;
  const decayTime = 0.1 + params.decay * 0.3;

  // Body: tuned triangle oscillator
  const bodyOsc = ctx.createOscillator();
  bodyOsc.type = 'triangle';
  bodyOsc.frequency.setValueAtTime(bodyFreq, time);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(gainLevel * 0.7, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.6);

  bodyOsc.connect(bodyGain);
  bodyGain.connect(destination);

  bodyOsc.start(time);
  bodyOsc.stop(time + decayTime);

  // Noise: bandpass-filtered white noise for snap
  const bufferSize = Math.ceil(ctx.sampleRate * decayTime);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseBand = ctx.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.value = 3000;
  noiseBand.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(gainLevel * 0.6, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  noise.connect(noiseBand);
  noiseBand.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + decayTime);
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/snare.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voices/snare.ts src/engine/voices/__tests__/snare.test.ts
git commit -m "feat: add snare drum synthesis"
```

---

### Task 6: Voice Synthesis — Clap

**Files:**
- Create: `src/engine/voices/clap.ts`, `src/engine/voices/__tests__/clap.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/voices/__tests__/clap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clap } from '../clap';

describe('clap voice', () => {
  it('is a function', () => {
    expect(typeof clap).toBe('function');
  });

  it('does not throw when triggered with OfflineAudioContext', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      clap(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5 }, false);
    }).not.toThrow();
    await ctx.startRendering();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/voices/__tests__/clap.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement clap synthesis**

Create `src/engine/voices/clap.ts`:

```ts
import type { VoiceTrigger } from '../types';

export const clap: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const decayTime = 0.1 + params.decay * 0.3;

  // Noise buffer for the full duration
  const totalDuration = decayTime + 0.04; // burst phase + decay
  const bufferSize = Math.ceil(ctx.sampleRate * totalDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1200;
  band.Q.value = 1.0;

  const gain = ctx.createGain();

  // Multi-burst envelope: 4 rapid bursts then decay
  gain.gain.setValueAtTime(0, time);
  const burstDuration = 0.01;
  for (let i = 0; i < 4; i++) {
    const burstStart = time + i * burstDuration;
    gain.gain.setValueAtTime(gainLevel, burstStart);
    gain.gain.setValueAtTime(0, burstStart + burstDuration * 0.5);
  }
  // Final decay tail
  const tailStart = time + 4 * burstDuration;
  gain.gain.setValueAtTime(gainLevel * 0.7, tailStart);
  gain.gain.exponentialRampToValueAtTime(0.001, tailStart + decayTime);

  noise.connect(band);
  band.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + totalDuration);
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/clap.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voices/clap.ts src/engine/voices/__tests__/clap.test.ts
git commit -m "feat: add clap synthesis"
```

---

### Task 7: Voice Synthesis — Rimshot

**Files:**
- Create: `src/engine/voices/rimshot.ts`, `src/engine/voices/__tests__/rimshot.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/voices/__tests__/rimshot.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rimshot } from '../rimshot';

describe('rimshot voice', () => {
  it('is a function', () => {
    expect(typeof rimshot).toBe('function');
  });

  it('does not throw when triggered with OfflineAudioContext', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      rimshot(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5 }, false);
    }).not.toThrow();
    await ctx.startRendering();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/voices/__tests__/rimshot.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement rimshot synthesis**

Create `src/engine/voices/rimshot.ts`:

```ts
import type { VoiceTrigger } from '../types';

export const rimshot: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const decayTime = 0.02 + params.decay * 0.06; // very short: 20-80ms

  // Two slightly detuned triangle oscillators
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.value = 490;

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 520;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(destination);

  osc1.start(time);
  osc1.stop(time + decayTime);
  osc2.start(time);
  osc2.stop(time + decayTime);
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/rimshot.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voices/rimshot.ts src/engine/voices/__tests__/rimshot.test.ts
git commit -m "feat: add rimshot synthesis"
```

---

### Task 8: Voice Synthesis — Hi-Hats (Closed + Open + Choke)

**Files:**
- Create: `src/engine/voices/closedHat.ts`, `src/engine/voices/openHat.ts`, `src/engine/voices/__tests__/hihat.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/voices/__tests__/hihat.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { closedHat } from '../closedHat';
import { openHat } from '../openHat';

describe('hi-hat voices', () => {
  it('closedHat does not throw when triggered', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      closedHat(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5 }, false);
    }).not.toThrow();
    await ctx.startRendering();
  });

  it('openHat returns a GainNode for choke support', async () => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const gainNode = openHat(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5 }, false);
    expect(gainNode).toBeInstanceOf(GainNode);
    await ctx.startRendering();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/voices/__tests__/hihat.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement metallic oscillator bank helper**

Both hi-hats share the same oscillator bank. Create `src/engine/voices/closedHat.ts`:

```ts
import type { VoiceTrigger } from '../types';

// Non-harmonic frequencies for metallic hi-hat character
const HAT_FREQS = [800, 1047, 1480, 1768, 2093, 2637];

function createMetallicOscillators(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  duration: number,
): OscillatorNode[] {
  const oscs: OscillatorNode[] = [];
  for (const freq of HAT_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(destination);
    osc.start(time);
    osc.stop(time + duration);
    oscs.push(osc);
  }
  return oscs;
}

export const closedHat: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.3; // scale down metallic bank
  const decayTime = 0.02 + params.decay * 0.08; // 20-100ms

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(gain);
  gain.connect(destination);

  createMetallicOscillators(ctx, highpass, time, decayTime);
};
```

- [ ] **Step 4: Implement open hi-hat**

Create `src/engine/voices/openHat.ts`:

```ts
import type { ChokableVoiceTrigger } from '../types';

const HAT_FREQS = [800, 1047, 1480, 1768, 2093, 2637];

export const openHat: ChokableVoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.3;
  const decayTime = 0.2 + params.decay * 0.8; // 200ms-1s — much longer than closed

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(gain);
  gain.connect(destination);

  for (const freq of HAT_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(highpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }

  // Return gain node so engine can choke it
  return gain;
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/hihat.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/voices/closedHat.ts src/engine/voices/openHat.ts src/engine/voices/__tests__/hihat.test.ts
git commit -m "feat: add hi-hat synthesis with choke support"
```

---

### Task 9: Voice Synthesis — Toms (Low, Mid, Hi)

**Files:**
- Create: `src/engine/voices/lowTom.ts`, `src/engine/voices/midTom.ts`, `src/engine/voices/hiTom.ts`, `src/engine/voices/__tests__/toms.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/voices/__tests__/toms.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lowTom } from '../lowTom';
import { midTom } from '../midTom';
import { hiTom } from '../hiTom';

describe('tom voices', () => {
  const params = { level: 0.8, decay: 0.5, tune: 0.5 };

  it.each([
    ['lowTom', lowTom],
    ['midTom', midTom],
    ['hiTom', hiTom],
  ])('%s does not throw when triggered', async (name, voice) => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      voice(ctx, ctx.destination, 0, params, false);
    }).not.toThrow();
    await ctx.startRendering();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/voices/__tests__/toms.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement tom factory and all three toms**

The three toms share identical structure, just different target frequencies. Create `src/engine/voices/lowTom.ts`:

```ts
import type { VoiceTrigger } from '../types';

function createTom(baseFreq: number): VoiceTrigger {
  return (ctx, destination, time, params, accent) => {
    const gainLevel = params.level * (accent ? 1.3 : 1.0);
    const tuneOffset = (params.tune ?? 0.5) - 0.5;
    const targetFreq = baseFreq + tuneOffset * 40;
    const startFreq = targetFreq * 1.5;
    const decayTime = 0.08 + params.decay * 0.25;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime);
  };
}

export const lowTom = createTom(120);
```

Create `src/engine/voices/midTom.ts`:

```ts
import type { VoiceTrigger } from '../types';

function createTom(baseFreq: number): VoiceTrigger {
  return (ctx, destination, time, params, accent) => {
    const gainLevel = params.level * (accent ? 1.3 : 1.0);
    const tuneOffset = (params.tune ?? 0.5) - 0.5;
    const targetFreq = baseFreq + tuneOffset * 40;
    const startFreq = targetFreq * 1.5;
    const decayTime = 0.08 + params.decay * 0.25;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime);
  };
}

export const midTom = createTom(160);
```

Create `src/engine/voices/hiTom.ts`:

```ts
import type { VoiceTrigger } from '../types';

function createTom(baseFreq: number): VoiceTrigger {
  return (ctx, destination, time, params, accent) => {
    const gainLevel = params.level * (accent ? 1.3 : 1.0);
    const tuneOffset = (params.tune ?? 0.5) - 0.5;
    const targetFreq = baseFreq + tuneOffset * 40;
    const startFreq = targetFreq * 1.5;
    const decayTime = 0.08 + params.decay * 0.25;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime);
  };
}

export const hiTom = createTom(200);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/toms.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voices/lowTom.ts src/engine/voices/midTom.ts src/engine/voices/hiTom.ts src/engine/voices/__tests__/toms.test.ts
git commit -m "feat: add tom synthesis (low, mid, hi)"
```

---

### Task 10: Voice Synthesis — Crash & Ride Cymbals

**Files:**
- Create: `src/engine/voices/crash.ts`, `src/engine/voices/ride.ts`, `src/engine/voices/__tests__/cymbals.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/voices/__tests__/cymbals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crash } from '../crash';
import { ride } from '../ride';

describe('cymbal voices', () => {
  const params = { level: 0.8, decay: 0.5 };

  it.each([
    ['crash', crash],
    ['ride', ride],
  ])('%s does not throw when triggered', async (name, voice) => {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    expect(() => {
      voice(ctx, ctx.destination, 0, params, false);
    }).not.toThrow();
    await ctx.startRendering();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/voices/__tests__/cymbals.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement crash cymbal**

Create `src/engine/voices/crash.ts`:

```ts
import type { VoiceTrigger } from '../types';

// Dense metallic partials — more than hi-hat for washy character
const CRASH_FREQS = [650, 900, 1200, 1560, 1890, 2400, 2800, 3400, 4100];

export const crash: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.25;
  const decayTime = 0.8 + params.decay * 1.5; // 0.8-2.3s, long sustain

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of CRASH_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(bandpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }
};
```

- [ ] **Step 4: Implement ride cymbal**

Create `src/engine/voices/ride.ts`:

```ts
import type { VoiceTrigger } from '../types';

// Tighter partial set than crash — more bell-like
const RIDE_FREQS = [700, 1100, 1650, 2200, 2900, 3600];

export const ride: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.25;
  const decayTime = 0.4 + params.decay * 0.8; // 0.4-1.2s, moderate

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3500;
  bandpass.Q.value = 1.0; // narrower than crash

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of RIDE_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(bandpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/engine/voices/__tests__/cymbals.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/voices/crash.ts src/engine/voices/ride.ts src/engine/voices/__tests__/cymbals.test.ts
git commit -m "feat: add crash and ride cymbal synthesis"
```

---

### Task 11: Voice Registry

**Files:**
- Create: `src/engine/voices/index.ts`

- [ ] **Step 1: Create the voice registry**

Create `src/engine/voices/index.ts`:

```ts
import type { InstrumentId, VoiceTrigger, ChokableVoiceTrigger } from '../types';
import { kick } from './kick';
import { snare } from './snare';
import { clap } from './clap';
import { rimshot } from './rimshot';
import { closedHat } from './closedHat';
import { openHat } from './openHat';
import { lowTom } from './lowTom';
import { midTom } from './midTom';
import { hiTom } from './hiTom';
import { crash } from './crash';
import { ride } from './ride';

export const voices: Record<InstrumentId, VoiceTrigger> = {
  kick,
  snare,
  clap,
  rimshot,
  closedHat,
  openHat: openHat as unknown as VoiceTrigger, // engine handles choke via separate reference
  lowTom,
  midTom,
  hiTom,
  crash,
  ride,
};

export { openHat } from './openHat';
export type { ChokableVoiceTrigger };
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/voices/index.ts
git commit -m "feat: add voice registry"
```

---

### Task 12: AudioEngine — Core State and Snapshot

**Files:**
- Create: `src/engine/AudioEngine.ts`, `src/engine/__tests__/AudioEngine.test.ts`

- [ ] **Step 1: Write failing tests for engine state management**

Create `src/engine/__tests__/AudioEngine.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { AudioEngine } from '../AudioEngine';

describe('AudioEngine', () => {
  it('returns a default snapshot before init', () => {
    const engine = new AudioEngine();
    const snap = engine.getSnapshot();

    expect(snap.transport.playing).toBe(false);
    expect(snap.transport.bpm).toBe(120);
    expect(snap.transport.currentStep).toBe(0);
    expect(snap.pattern.steps.kick.length).toBe(16);
    expect(snap.pattern.steps.kick.every((s) => s === false)).toBe(true);
    expect(snap.pattern.accents.length).toBe(16);
    expect(snap.instruments.kick.level).toBe(0.8);
    expect(snap.instruments.kick.tune).toBe(0.5);
    expect(snap.instruments.clap.tune).toBeUndefined();
  });

  it('toggleStep flips a step and produces a new snapshot', () => {
    const engine = new AudioEngine();
    const snap1 = engine.getSnapshot();

    engine.toggleStep('kick', 0);
    const snap2 = engine.getSnapshot();

    expect(snap2).not.toBe(snap1);
    expect(snap2.pattern.steps.kick[0]).toBe(true);
    expect(snap1.pattern.steps.kick[0]).toBe(false); // immutable
  });

  it('toggleAccent flips an accent', () => {
    const engine = new AudioEngine();

    engine.toggleAccent(3);
    expect(engine.getSnapshot().pattern.accents[3]).toBe(true);

    engine.toggleAccent(3);
    expect(engine.getSnapshot().pattern.accents[3]).toBe(false);
  });

  it('setBpm updates bpm', () => {
    const engine = new AudioEngine();
    engine.setBpm(140);
    expect(engine.getSnapshot().transport.bpm).toBe(140);
  });

  it('setBpm clamps to 40-300', () => {
    const engine = new AudioEngine();
    engine.setBpm(10);
    expect(engine.getSnapshot().transport.bpm).toBe(40);

    engine.setBpm(500);
    expect(engine.getSnapshot().transport.bpm).toBe(300);
  });

  it('setParam updates instrument params', () => {
    const engine = new AudioEngine();
    engine.setParam('kick', 'level', 0.3);
    expect(engine.getSnapshot().instruments.kick.level).toBe(0.3);
  });

  it('subscribe notifies on state change', () => {
    const engine = new AudioEngine();
    const callback = vi.fn();

    const unsub = engine.subscribe(callback);
    engine.toggleStep('snare', 5);

    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    engine.toggleStep('snare', 6);
    expect(callback).toHaveBeenCalledTimes(1); // no more calls after unsub
  });

  it('getSnapshot returns same reference when no change', () => {
    const engine = new AudioEngine();
    const snap1 = engine.getSnapshot();
    const snap2 = engine.getSnapshot();
    expect(snap1).toBe(snap2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/AudioEngine.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement AudioEngine**

Create `src/engine/AudioEngine.ts`:

```ts
import {
  type InstrumentId,
  type InstrumentParams,
  type EngineSnapshot,
  INSTRUMENT_IDS,
  NUM_STEPS,
  createDefaultSteps,
  createDefaultInstruments,
} from './types';
import { Clock } from './clock';
import { voices, openHat as openHatVoice } from './voices';

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
        currentStep: 0,
      },
      pattern: {
        steps: createDefaultSteps(),
        accents: new Array(NUM_STEPS).fill(false),
      },
      instruments: createDefaultInstruments(),
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
  }

  // --- Transport ---

  play(): void {
    if (!this.ctx || this.snapshot.transport.playing) return;
    this.emit({
      transport: { ...this.snapshot.transport, playing: true, currentStep: 0 },
    });
    this.clock.start(this.ctx, this.snapshot.transport.bpm);
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
    });
    if (this.snapshot.transport.playing) {
      this.clock.setBpm(clamped);
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
    });
  }

  toggleAccent(step: number): void {
    const newAccents = [...this.snapshot.pattern.accents];
    newAccents[step] = !newAccents[step];
    this.emit({
      pattern: { ...this.snapshot.pattern, accents: newAccents },
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
    });
  }

  // --- Clock Callback ---

  private onTick(time: number, step: number): void {
    // Trigger voices for active steps
    if (this.ctx) {
      const accent = this.snapshot.pattern.accents[step];
      for (const id of INSTRUMENT_IDS) {
        if (this.snapshot.pattern.steps[id][step]) {
          const params = this.snapshot.instruments[id];

          if (id === 'closedHat' && this.openHatGain) {
            // Choke open hat
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

    // Update step in snapshot — this drives the playhead in the UI
    this.emit({
      transport: { ...this.snapshot.transport, currentStep: step },
    });
  }

  // --- Internal ---

  private emit(partial: Partial<EngineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/AudioEngine.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass across all files.

- [ ] **Step 6: Commit**

```bash
git add src/engine/AudioEngine.ts src/engine/__tests__/AudioEngine.test.ts
git commit -m "feat: add AudioEngine with state management, clock, and voice triggering"
```

---

### Task 13: React Hooks — useSyncExternalStore Integration

**Files:**
- Create: `src/hooks/useEngine.ts`, `src/hooks/__tests__/useEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useEngine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransport, usePattern, useInstrumentParams, engine } from '../useEngine';

describe('useEngine hooks', () => {
  it('useTransport returns transport state', () => {
    const { result } = renderHook(() => useTransport());
    expect(result.current.playing).toBe(false);
    expect(result.current.bpm).toBe(120);
    expect(result.current.currentStep).toBe(0);
  });

  it('usePattern returns pattern state', () => {
    const { result } = renderHook(() => usePattern());
    expect(result.current.steps.kick.length).toBe(16);
    expect(result.current.accents.length).toBe(16);
  });

  it('useInstrumentParams returns params for given instrument', () => {
    const { result } = renderHook(() => useInstrumentParams('kick'));
    expect(result.current.level).toBe(0.8);
    expect(result.current.tune).toBe(0.5);
  });

  it('useTransport updates when transport changes', () => {
    const { result } = renderHook(() => useTransport());

    act(() => {
      engine.setBpm(140);
    });

    expect(result.current.bpm).toBe(140);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/__tests__/useEngine.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement hooks**

Create `src/hooks/useEngine.ts`:

```ts
import { useSyncExternalStore, useRef } from 'react';
import { AudioEngine } from '../engine/AudioEngine';
import type { InstrumentId, InstrumentParams, EngineSnapshot } from '../engine/types';

export const engine = new AudioEngine();

export function useEngine(): EngineSnapshot {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}

export function useTransport(): EngineSnapshot['transport'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().transport,
  );
}

export function usePattern(): EngineSnapshot['pattern'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().pattern,
  );
}

export function useInstrumentParams(id: InstrumentId): InstrumentParams {
  const prevRef = useRef<InstrumentParams>(engine.getSnapshot().instruments[id]);

  return useSyncExternalStore(engine.subscribe, () => {
    const next = engine.getSnapshot().instruments[id];
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/__tests__/useEngine.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useEngine.ts src/hooks/__tests__/useEngine.test.ts
git commit -m "feat: add useSyncExternalStore hooks for engine"
```

---

### Task 14: CSS Styles and Theme

**Files:**
- Create: `src/styles/index.css`

- [ ] **Step 1: Create the global stylesheet**

Create `src/styles/index.css`:

```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #0d0d1a;
  --bg-surface: #2a2a3e;
  --accent: #ff6b35;
  --text-primary: #e0e0e0;
  --text-secondary: #999;
  --text-muted: #666;
  --text-dim: #555;
  --border: #333;
  --step-active: var(--accent);
  --step-inactive: var(--bg-surface);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
}

body {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tr909 {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 24px;
  max-width: 900px;
  width: 100%;
}

/* Transport */
.transport {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.transport__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 2px;
}

.transport__subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 8px;
}

.transport__controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.transport__bpm {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px 14px;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-mono);
  width: 80px;
  text-align: center;
}

.transport__bpm:focus {
  outline: 1px solid var(--accent);
}

.transport__bpm-label {
  font-size: 10px;
  color: var(--text-muted);
}

.transport__btn {
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 20px;
  font-weight: 700;
  font-size: 13px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: opacity 0.15s;
}

.transport__btn:hover {
  opacity: 0.85;
}

.transport__btn--play {
  background: var(--accent);
  color: var(--bg-primary);
}

.transport__btn--stop {
  background: var(--bg-surface);
  color: var(--text-secondary);
}

/* Instrument Selector */
.instrument-selector {
  margin-bottom: 16px;
}

.instrument-selector__label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.instrument-selector__tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.instrument-selector__tab {
  background: var(--bg-surface);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-mono);
  cursor: pointer;
  border: none;
  transition: background 0.15s, color 0.15s;
}

.instrument-selector__tab:hover {
  background: var(--border);
}

.instrument-selector__tab--active {
  background: var(--accent);
  color: var(--bg-primary);
  font-weight: 600;
}

/* Param Knobs */
.param-knobs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.knob {
  text-align: center;
  user-select: none;
}

.knob__dial {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0 auto 6px;
  position: relative;
  cursor: grab;
}

.knob__dial:active {
  cursor: grabbing;
}

.knob__center {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-primary);
  position: absolute;
  top: 14px;
  left: 14px;
}

.knob__label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Step Grid */
.step-grid {
  margin-bottom: 12px;
}

.step-grid__label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.step-grid__rows {
  display: flex;
  gap: 4px;
}

.step-grid__group {
  display: flex;
  gap: 3px;
}

.step-grid__group + .step-grid__group {
  margin-left: 2px;
}

.step-btn {
  width: 48px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: background 0.1s;
}

.step-btn--active {
  background: var(--step-active);
  color: var(--bg-primary);
  font-weight: 700;
}

.step-btn--inactive {
  background: var(--step-inactive);
  color: var(--text-dim);
}

.step-btn--inactive:hover {
  background: var(--border);
}

/* Accent Row */
.accent-row {
  margin-bottom: 8px;
}

.accent-row__label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.accent-row__steps {
  display: flex;
  gap: 4px;
}

.accent-row__group {
  display: flex;
  gap: 3px;
}

.accent-row__group + .accent-row__group {
  margin-left: 2px;
}

.accent-btn {
  width: 48px;
  height: 12px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
  transition: background 0.1s;
}

.accent-btn--active {
  background: var(--accent);
  opacity: 0.8;
}

.accent-btn--inactive {
  background: var(--bg-surface);
}

.accent-btn--inactive:hover {
  background: var(--border);
}

/* Playhead */
.playhead {
  display: flex;
  gap: 4px;
}

.playhead__group {
  display: flex;
  gap: 3px;
}

.playhead__group + .playhead__group {
  margin-left: 2px;
}

.playhead__indicator {
  width: 48px;
  height: 3px;
  border-radius: 2px;
  transition: background 0.05s;
}

.playhead__indicator--active {
  background: var(--accent);
}

.playhead__indicator--inactive {
  background: transparent;
}

/* Init Overlay */
.init-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.init-overlay__btn {
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-lg);
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: opacity 0.15s;
}

.init-overlay__btn:hover {
  opacity: 0.85;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add CSS theme and component styles"
```

---

### Task 15: React Components — InitOverlay and App Shell

**Files:**
- Create: `src/components/InitOverlay.tsx`, `src/components/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create InitOverlay**

Create `src/components/InitOverlay.tsx`:

```tsx
import { engine } from '../hooks/useEngine';

interface InitOverlayProps {
  onInit: () => void;
}

export function InitOverlay({ onInit }: InitOverlayProps) {
  const handleClick = async () => {
    await engine.init();
    onInit();
  };

  return (
    <div className="init-overlay">
      <button className="init-overlay__btn" onClick={handleClick}>
        Start TR-909
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create App component**

Create `src/components/App.tsx`:

```tsx
import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { InstrumentSelector } from './InstrumentSelector';
import { ParamKnobs } from './ParamKnobs';
import { StepGrid } from './StepGrid';
import { AccentRow } from './AccentRow';
import { Playhead } from './Playhead';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <div className="tr909">
        <Transport />
        <InstrumentSelector
          selected={selectedInstrument}
          onSelect={setSelectedInstrument}
        />
        <ParamKnobs instrument={selectedInstrument} />
        <StepGrid instrument={selectedInstrument} />
        <AccentRow />
        <Playhead />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Update main.tsx**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Verify TypeScript compiles (will fail — components not yet created)**

This is expected — we'll create the remaining components in the next tasks. Just verify no syntax errors in what we've written:

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: Errors about missing component modules (Transport, InstrumentSelector, etc.) — not syntax errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/InitOverlay.tsx src/components/App.tsx src/main.tsx
git commit -m "feat: add App shell with InitOverlay"
```

---

### Task 16: React Components — Transport

**Files:**
- Create: `src/components/Transport.tsx`

- [ ] **Step 1: Create Transport component**

Create `src/components/Transport.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { useTransport, engine } from '../hooks/useEngine';

export function Transport() {
  const transport = useTransport();
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState('');

  const handleBpmClick = useCallback(() => {
    setEditingBpm(true);
    setBpmInput(String(transport.bpm));
  }, [transport.bpm]);

  const handleBpmBlur = useCallback(() => {
    setEditingBpm(false);
    const value = parseInt(bpmInput, 10);
    if (!isNaN(value)) {
      engine.setBpm(value);
    }
  }, [bpmInput]);

  const handleBpmKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  return (
    <div className="transport">
      <div>
        <span className="transport__title">TR-909</span>
        <span className="transport__subtitle">RHYTHM COMPOSER</span>
      </div>
      <div className="transport__controls">
        {editingBpm ? (
          <input
            className="transport__bpm"
            type="number"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            onBlur={handleBpmBlur}
            onKeyDown={handleBpmKeyDown}
            autoFocus
            min={40}
            max={300}
          />
        ) : (
          <div className="transport__bpm" onClick={handleBpmClick}>
            {transport.bpm}
          </div>
        )}
        <span className="transport__bpm-label">BPM</span>
        <button
          className="transport__btn transport__btn--play"
          onClick={() => engine.play()}
        >
          PLAY
        </button>
        <button
          className="transport__btn transport__btn--stop"
          onClick={() => engine.stop()}
        >
          STOP
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Transport.tsx
git commit -m "feat: add Transport component"
```

---

### Task 17: React Components — InstrumentSelector

**Files:**
- Create: `src/components/InstrumentSelector.tsx`

- [ ] **Step 1: Create InstrumentSelector component**

Create `src/components/InstrumentSelector.tsx`:

```tsx
import { INSTRUMENT_IDS, type InstrumentId } from '../engine/types';

const DISPLAY_NAMES: Record<InstrumentId, string> = {
  kick: 'BD',
  snare: 'SD',
  clap: 'CP',
  rimshot: 'RS',
  closedHat: 'CH',
  openHat: 'OH',
  lowTom: 'LT',
  midTom: 'MT',
  hiTom: 'HT',
  crash: 'CC',
  ride: 'RC',
};

interface InstrumentSelectorProps {
  selected: InstrumentId;
  onSelect: (id: InstrumentId) => void;
}

export function InstrumentSelector({ selected, onSelect }: InstrumentSelectorProps) {
  return (
    <div className="instrument-selector">
      <div className="instrument-selector__label">Instrument</div>
      <div className="instrument-selector__tabs">
        {INSTRUMENT_IDS.map((id) => (
          <button
            key={id}
            className={`instrument-selector__tab${
              id === selected ? ' instrument-selector__tab--active' : ''
            }`}
            onClick={() => onSelect(id)}
          >
            {DISPLAY_NAMES[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/InstrumentSelector.tsx
git commit -m "feat: add InstrumentSelector component"
```

---

### Task 18: React Components — ParamKnobs

**Files:**
- Create: `src/components/ParamKnobs.tsx`

- [ ] **Step 1: Create ParamKnobs component**

Create `src/components/ParamKnobs.tsx`:

```tsx
import { useCallback, useRef } from 'react';
import { type InstrumentId, TUNABLE_INSTRUMENTS } from '../engine/types';
import { useInstrumentParams, engine } from '../hooks/useEngine';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function Knob({ label, value, onChange }: KnobProps) {
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
        const delta = (startY.current - e.clientY) / 150;
        const newValue = Math.max(0, Math.min(1, startValue.current + delta));
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
    [value, onChange],
  );

  // Arc: 220deg start, value maps to 0-280deg of arc
  const arcDeg = value * 280;
  const background = `conic-gradient(from 220deg, var(--accent) 0deg, var(--accent) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;

  return (
    <div className="knob">
      <div
        className="knob__dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
      >
        <div className="knob__center" />
      </div>
      <span className="knob__label">{label}</span>
    </div>
  );
}

interface ParamKnobsProps {
  instrument: InstrumentId;
}

export function ParamKnobs({ instrument }: ParamKnobsProps) {
  const params = useInstrumentParams(instrument);
  const hasTune = TUNABLE_INSTRUMENTS.has(instrument);

  return (
    <div className="param-knobs">
      <Knob
        label="Level"
        value={params.level}
        onChange={(v) => engine.setParam(instrument, 'level', v)}
      />
      {hasTune && (
        <Knob
          label="Tune"
          value={params.tune ?? 0.5}
          onChange={(v) => engine.setParam(instrument, 'tune', v)}
        />
      )}
      <Knob
        label="Decay"
        value={params.decay}
        onChange={(v) => engine.setParam(instrument, 'decay', v)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ParamKnobs.tsx
git commit -m "feat: add ParamKnobs component with drag interaction"
```

---

### Task 19: React Components — StepGrid, AccentRow, Playhead

**Files:**
- Create: `src/components/StepGrid.tsx`, `src/components/AccentRow.tsx`, `src/components/Playhead.tsx`

- [ ] **Step 1: Create StepGrid component**

Create `src/components/StepGrid.tsx`:

```tsx
import type { InstrumentId } from '../engine/types';
import { usePattern, engine } from '../hooks/useEngine';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

const DISPLAY_NAMES: Record<InstrumentId, string> = {
  kick: 'Bass Drum',
  snare: 'Snare',
  clap: 'Clap',
  rimshot: 'Rimshot',
  closedHat: 'Closed Hat',
  openHat: 'Open Hat',
  lowTom: 'Low Tom',
  midTom: 'Mid Tom',
  hiTom: 'Hi Tom',
  crash: 'Crash',
  ride: 'Ride',
};

interface StepGridProps {
  instrument: InstrumentId;
}

export function StepGrid({ instrument }: StepGridProps) {
  const pattern = usePattern();
  const steps = pattern.steps[instrument];

  return (
    <div className="step-grid">
      <div className="step-grid__label">Pattern — {DISPLAY_NAMES[instrument]}</div>
      <div className="step-grid__rows">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="step-grid__group">
            {group.map((step) => (
              <button
                key={step}
                className={`step-btn ${
                  steps[step] ? 'step-btn--active' : 'step-btn--inactive'
                }`}
                onClick={() => engine.toggleStep(instrument, step)}
              >
                {step + 1}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AccentRow component**

Create `src/components/AccentRow.tsx`:

```tsx
import { usePattern, engine } from '../hooks/useEngine';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

export function AccentRow() {
  const pattern = usePattern();

  return (
    <div className="accent-row">
      <div className="accent-row__label">Accent</div>
      <div className="accent-row__steps">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="accent-row__group">
            {group.map((step) => (
              <button
                key={step}
                className={`accent-btn ${
                  pattern.accents[step] ? 'accent-btn--active' : 'accent-btn--inactive'
                }`}
                onClick={() => engine.toggleAccent(step)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Playhead component**

Create `src/components/Playhead.tsx`:

```tsx
import { useTransport } from '../hooks/useEngine';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

export function Playhead() {
  const transport = useTransport();

  return (
    <div className="playhead">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="playhead__group">
          {group.map((step) => (
            <div
              key={step}
              className={`playhead__indicator ${
                transport.playing && transport.currentStep === step
                  ? 'playhead__indicator--active'
                  : 'playhead__indicator--inactive'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors — all components are now in place.

- [ ] **Step 5: Commit**

```bash
git add src/components/StepGrid.tsx src/components/AccentRow.tsx src/components/Playhead.tsx
git commit -m "feat: add StepGrid, AccentRow, and Playhead components"
```

---

### Task 20: Integration — Full App Smoke Test

**Files:**
- Create: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write integration tests**

Create `src/components/__tests__/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

describe('App', () => {
  it('renders init overlay on first load', () => {
    render(<App />);
    expect(screen.getByText('Start TR-909')).toBeDefined();
  });

  it('renders transport controls', () => {
    render(<App />);
    expect(screen.getByText('TR-909')).toBeDefined();
    expect(screen.getByText('PLAY')).toBeDefined();
    expect(screen.getByText('STOP')).toBeDefined();
  });

  it('renders all instrument tabs', () => {
    render(<App />);
    for (const name of ['BD', 'SD', 'CP', 'RS', 'CH', 'OH', 'LT', 'MT', 'HT', 'CC', 'RC']) {
      expect(screen.getByText(name)).toBeDefined();
    }
  });

  it('renders 16 step buttons', () => {
    render(<App />);
    for (let i = 1; i <= 16; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it('toggles step on click', async () => {
    const user = userEvent.setup();
    render(<App />);

    const step1 = screen.getByText('1');
    expect(step1.className).toContain('inactive');

    await user.click(step1);
    expect(step1.className).toContain('active');

    await user.click(step1);
    expect(step1.className).toContain('inactive');
  });

  it('switches instrument on tab click', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Pattern — Bass Drum')).toBeDefined();

    await user.click(screen.getByText('SD'));
    expect(screen.getByText('Pattern — Snare')).toBeDefined();
  });
});
```

- [ ] **Step 2: Add testing-library setup file**

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
```

Update `vite.config.ts` to include the setup file in the `test.setupFiles` array:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass — engine tests, hook tests, and component tests.

- [ ] **Step 4: Start dev server and verify visually**

```bash
npm run dev
```

Expected: App loads in browser. Init overlay appears. Clicking it dismisses overlay. All 11 instrument tabs, 16 step buttons, knobs, accent row, and playhead are visible. Clicking steps toggles them. Clicking PLAY starts the sequencer — playhead advances and active steps produce sound.

- [ ] **Step 5: Commit**

```bash
git add src/components/__tests__/App.test.tsx src/test-setup.ts vite.config.ts
git commit -m "feat: add integration tests and test setup"
```

---

### Task 21: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
```

If any uncommitted files, add and commit:

```bash
git add .
git commit -m "chore: final cleanup"
```
