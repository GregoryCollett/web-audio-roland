# TR-909 Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent pattern and kit preset selection, saving, and deletion with 7 built-in pattern presets and 6 built-in kit presets.

**Architecture:** Extend the existing `AudioEngine` with preset management methods. A `PresetStorage` utility handles localStorage persistence. Built-in presets live in a static `defaultPresets.ts` file and are merged with user presets at read time. The engine snapshot expands with a `presets` section that React subscribes to via the existing `useSyncExternalStore` pattern.

**Tech Stack:** TypeScript, React 19, Vitest, localStorage

**Spec:** `docs/superpowers/specs/2026-03-31-presets-design.md`

---

## File Map

```
src/engine/
  types.ts              — add PatternPreset, KitPreset interfaces; expand EngineSnapshot
  defaultPresets.ts     — hardcoded built-in presets (7 patterns, 6 kits)
  presetStorage.ts      — localStorage read/write, merges built-in + user presets
  AudioEngine.ts        — add preset methods, dirty tracking, init with presets
  __tests__/
    presetStorage.test.ts
    AudioEngine.test.ts — expand with preset tests
src/hooks/
  useEngine.ts          — add usePresets() hook
src/components/
  PresetSelector.tsx    — reusable dropdown + save/delete control
  App.tsx               — add PresetSelector components to layout
  __tests__/
    App.test.tsx        — expand with preset rendering tests
src/styles/
  index.css             — add preset selector styles
```

---

### Task 1: Extend Types

**Files:**
- Modify: `src/engine/types.ts`

- [ ] **Step 1: Add preset interfaces and expand EngineSnapshot**

Add the following to the end of `src/engine/types.ts` (before the closing of the file), and update the `EngineSnapshot` interface:

```ts
// Add these new interfaces after the existing types:

export interface PatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  bpm: number;
  steps: Record<InstrumentId, boolean[]>;
  accents: boolean[];
}

export interface KitPreset {
  id: string;
  name: string;
  builtIn: boolean;
  instruments: Record<InstrumentId, InstrumentParams>;
}
```

Update the existing `EngineSnapshot` interface to add the `presets` field:

```ts
export interface EngineSnapshot {
  transport: {
    playing: boolean;
    bpm: number;
    currentStep: number;
  };
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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: Errors in `AudioEngine.ts` because the constructor doesn't populate the `presets` field yet. That's fine — we'll fix it in a later task.

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add preset types and expand EngineSnapshot"
```

---

### Task 2: Default Presets Data

**Files:**
- Create: `src/engine/defaultPresets.ts`

- [ ] **Step 1: Create the default presets file**

Create `src/engine/defaultPresets.ts`:

```ts
import type { PatternPreset, KitPreset, InstrumentId } from './types';
import { INSTRUMENT_IDS, NUM_STEPS, TUNABLE_INSTRUMENTS } from './types';

function emptySteps(): Record<InstrumentId, boolean[]> {
  const steps = {} as Record<InstrumentId, boolean[]>;
  for (const id of INSTRUMENT_IDS) {
    steps[id] = new Array(NUM_STEPS).fill(false);
  }
  return steps;
}

function patternPreset(
  id: string,
  name: string,
  bpm: number,
  active: Partial<Record<InstrumentId, number[]>>,
  accentSteps: number[] = [],
): PatternPreset {
  const steps = emptySteps();
  for (const [instrument, indices] of Object.entries(active)) {
    for (const i of indices as number[]) {
      steps[instrument as InstrumentId][i] = true;
    }
  }
  const accents = new Array(NUM_STEPS).fill(false);
  for (const i of accentSteps) {
    accents[i] = true;
  }
  return { id, name, builtIn: true, bpm, steps, accents };
}

export const DEFAULT_PATTERN_PRESETS: PatternPreset[] = [
  patternPreset('builtin-four-on-the-floor', 'Four on the Floor', 124, {
    kick: [0, 4, 8, 12],
    clap: [4, 12],
    closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
    openHat: [2, 6, 10, 14],
  }, [0, 4, 8, 12]),

  patternPreset('builtin-techno-drive', 'Techno Drive', 130, {
    kick: [0, 2, 4, 6, 8, 10, 12, 14],
    rimshot: [3, 11],
    closedHat: [0, 4, 8, 12],
    crash: [0],
  }, [0, 8]),

  patternPreset('builtin-boom-bap', 'Boom Bap', 90, {
    kick: [0, 5],
    snare: [4, 12],
    closedHat: [0, 2, 4, 6, 8, 10, 14],
    openHat: [12],
  }, [0, 4, 12]),

  patternPreset('builtin-electro-funk', 'Electro Funk', 115, {
    kick: [0, 3, 6, 10],
    clap: [4, 12],
    closedHat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    rimshot: [2, 8, 14],
  }, [0, 2, 4, 8, 12, 14]),

  patternPreset('builtin-breakbeat', 'Breakbeat', 135, {
    kick: [0, 4, 9, 13],
    snare: [4, 12],
    closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
    openHat: [7, 15],
  }, [0, 4, 9, 12]),

  patternPreset('builtin-minimal-pulse', 'Minimal Pulse', 122, {
    kick: [0, 8],
    clap: [12],
    closedHat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  }, [0]),

  patternPreset('builtin-latin-percussion', 'Latin Percussion', 110, {
    rimshot: [0, 3, 6, 10, 12],
    lowTom: [4, 14],
    midTom: [2, 8],
    hiTom: [0, 6, 12],
    closedHat: [0, 2, 4, 6, 8, 10, 12, 14],
  }, [0, 6, 12]),
];

function kitPreset(
  id: string,
  name: string,
  params: Partial<Record<InstrumentId, { level?: number; decay?: number; tune?: number }>>,
): KitPreset {
  const instruments = {} as Record<InstrumentId, { level: number; decay: number; tune?: number }>;
  for (const instId of INSTRUMENT_IDS) {
    const overrides = params[instId] ?? {};
    instruments[instId] = {
      level: overrides.level ?? 0.8,
      decay: overrides.decay ?? 0.5,
      ...(TUNABLE_INSTRUMENTS.has(instId) ? { tune: overrides.tune ?? 0.5 } : {}),
    };
  }
  return { id, name, builtIn: true, instruments };
}

export const DEFAULT_KIT_PRESETS: KitPreset[] = [
  kitPreset('builtin-classic-909', 'Classic 909', {}),

  kitPreset('builtin-punchy', 'Punchy', {
    kick: { level: 1.0, decay: 0.3, tune: 0.5 },
    snare: { level: 1.0, decay: 0.3, tune: 0.5 },
    clap: { level: 0.9, decay: 0.2 },
    rimshot: { level: 0.9, decay: 0.3 },
    closedHat: { level: 0.85, decay: 0.2 },
    openHat: { level: 0.8, decay: 0.3 },
    lowTom: { level: 0.95, decay: 0.3, tune: 0.5 },
    midTom: { level: 0.95, decay: 0.3, tune: 0.5 },
    hiTom: { level: 0.95, decay: 0.3, tune: 0.5 },
    crash: { level: 0.7, decay: 0.4 },
    ride: { level: 0.7, decay: 0.3 },
  }),

  kitPreset('builtin-deep', 'Deep', {
    kick: { level: 0.9, decay: 0.8, tune: 0.3 },
    snare: { level: 0.7, decay: 0.6, tune: 0.4 },
    clap: { level: 0.6, decay: 0.6 },
    rimshot: { level: 0.5, decay: 0.4 },
    closedHat: { level: 0.5, decay: 0.3 },
    openHat: { level: 0.5, decay: 0.7 },
    lowTom: { level: 0.85, decay: 0.7, tune: 0.3 },
    midTom: { level: 0.8, decay: 0.7, tune: 0.35 },
    hiTom: { level: 0.75, decay: 0.7, tune: 0.4 },
    crash: { level: 0.5, decay: 0.8 },
    ride: { level: 0.5, decay: 0.6 },
  }),

  kitPreset('builtin-crispy', 'Crispy', {
    kick: { level: 0.85, decay: 0.2, tune: 0.6 },
    snare: { level: 0.9, decay: 0.2, tune: 0.7 },
    clap: { level: 0.85, decay: 0.15 },
    rimshot: { level: 0.9, decay: 0.2 },
    closedHat: { level: 0.9, decay: 0.15 },
    openHat: { level: 0.85, decay: 0.25 },
    lowTom: { level: 0.8, decay: 0.2, tune: 0.55 },
    midTom: { level: 0.8, decay: 0.2, tune: 0.6 },
    hiTom: { level: 0.8, decay: 0.2, tune: 0.65 },
    crash: { level: 0.8, decay: 0.3 },
    ride: { level: 0.85, decay: 0.2 },
  }),

  kitPreset('builtin-lofi', 'Lo-Fi', {
    kick: { level: 0.55, decay: 0.7, tune: 0.35 },
    snare: { level: 0.5, decay: 0.65, tune: 0.4 },
    clap: { level: 0.45, decay: 0.7 },
    rimshot: { level: 0.4, decay: 0.5 },
    closedHat: { level: 0.45, decay: 0.5 },
    openHat: { level: 0.4, decay: 0.7 },
    lowTom: { level: 0.5, decay: 0.65, tune: 0.35 },
    midTom: { level: 0.5, decay: 0.65, tune: 0.4 },
    hiTom: { level: 0.5, decay: 0.65, tune: 0.4 },
    crash: { level: 0.4, decay: 0.8 },
    ride: { level: 0.4, decay: 0.7 },
  }),

  kitPreset('builtin-percussion-heavy', 'Percussion Heavy', {
    kick: { level: 0.5, decay: 0.4, tune: 0.5 },
    snare: { level: 0.5, decay: 0.4, tune: 0.5 },
    clap: { level: 0.6, decay: 0.4 },
    rimshot: { level: 1.0, decay: 0.5 },
    closedHat: { level: 0.7, decay: 0.4 },
    openHat: { level: 0.65, decay: 0.5 },
    lowTom: { level: 1.0, decay: 0.6, tune: 0.5 },
    midTom: { level: 1.0, decay: 0.6, tune: 0.5 },
    hiTom: { level: 1.0, decay: 0.6, tune: 0.5 },
    crash: { level: 0.85, decay: 0.5 },
    ride: { level: 0.85, decay: 0.5 },
  }),
];
```

- [ ] **Step 2: Verify TypeScript compiles (just this file)**

Run: `npx tsc --noEmit 2>&1 | grep defaultPresets || echo "No errors in defaultPresets"`

Expected: No errors specific to defaultPresets.ts.

- [ ] **Step 3: Commit**

```bash
git add src/engine/defaultPresets.ts
git commit -m "feat: add built-in default presets (7 patterns, 6 kits)"
```

---

### Task 3: PresetStorage Utility

**Files:**
- Create: `src/engine/presetStorage.ts`, `src/engine/__tests__/presetStorage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/presetStorage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PresetStorage } from '../presetStorage';
import { DEFAULT_PATTERN_PRESETS, DEFAULT_KIT_PRESETS } from '../defaultPresets';

describe('PresetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getPatternPresets', () => {
    it('returns built-in presets when localStorage is empty', () => {
      const presets = PresetStorage.getPatternPresets();
      expect(presets.length).toBe(DEFAULT_PATTERN_PRESETS.length);
      expect(presets[0].builtIn).toBe(true);
      expect(presets[0].name).toBe('Four on the Floor');
    });

    it('merges user presets with built-in presets', () => {
      const userPreset = {
        id: 'user-1',
        name: 'My Pattern',
        builtIn: false,
        bpm: 100,
        steps: DEFAULT_PATTERN_PRESETS[0].steps,
        accents: DEFAULT_PATTERN_PRESETS[0].accents,
      };
      localStorage.setItem('tr909-pattern-presets', JSON.stringify([userPreset]));

      const presets = PresetStorage.getPatternPresets();
      expect(presets.length).toBe(DEFAULT_PATTERN_PRESETS.length + 1);
      expect(presets.find((p) => p.id === 'user-1')?.name).toBe('My Pattern');
    });
  });

  describe('getKitPresets', () => {
    it('returns built-in presets when localStorage is empty', () => {
      const presets = PresetStorage.getKitPresets();
      expect(presets.length).toBe(DEFAULT_KIT_PRESETS.length);
      expect(presets[0].builtIn).toBe(true);
      expect(presets[0].name).toBe('Classic 909');
    });

    it('merges user presets with built-in presets', () => {
      const userKit = {
        id: 'user-kit-1',
        name: 'My Kit',
        builtIn: false,
        instruments: DEFAULT_KIT_PRESETS[0].instruments,
      };
      localStorage.setItem('tr909-kit-presets', JSON.stringify([userKit]));

      const presets = PresetStorage.getKitPresets();
      expect(presets.length).toBe(DEFAULT_KIT_PRESETS.length + 1);
      expect(presets.find((p) => p.id === 'user-kit-1')?.name).toBe('My Kit');
    });
  });

  describe('savePatternPreset', () => {
    it('saves a user preset to localStorage', () => {
      const preset = {
        id: 'user-1',
        name: 'Saved Pattern',
        builtIn: false,
        bpm: 140,
        steps: DEFAULT_PATTERN_PRESETS[0].steps,
        accents: DEFAULT_PATTERN_PRESETS[0].accents,
      };

      PresetStorage.savePatternPreset(preset);

      const stored = JSON.parse(localStorage.getItem('tr909-pattern-presets')!);
      expect(stored.length).toBe(1);
      expect(stored[0].name).toBe('Saved Pattern');
    });
  });

  describe('saveKitPreset', () => {
    it('saves a user kit preset to localStorage', () => {
      const preset = {
        id: 'user-kit-1',
        name: 'Saved Kit',
        builtIn: false,
        instruments: DEFAULT_KIT_PRESETS[0].instruments,
      };

      PresetStorage.saveKitPreset(preset);

      const stored = JSON.parse(localStorage.getItem('tr909-kit-presets')!);
      expect(stored.length).toBe(1);
      expect(stored[0].name).toBe('Saved Kit');
    });
  });

  describe('deletePatternPreset', () => {
    it('deletes a user preset from localStorage', () => {
      const preset = {
        id: 'user-1',
        name: 'To Delete',
        builtIn: false,
        bpm: 100,
        steps: DEFAULT_PATTERN_PRESETS[0].steps,
        accents: DEFAULT_PATTERN_PRESETS[0].accents,
      };
      PresetStorage.savePatternPreset(preset);
      expect(PresetStorage.getPatternPresets().find((p) => p.id === 'user-1')).toBeDefined();

      PresetStorage.deletePatternPreset('user-1');
      expect(PresetStorage.getPatternPresets().find((p) => p.id === 'user-1')).toBeUndefined();
    });

    it('refuses to delete a built-in preset', () => {
      const builtInId = DEFAULT_PATTERN_PRESETS[0].id;
      PresetStorage.deletePatternPreset(builtInId);
      expect(PresetStorage.getPatternPresets().find((p) => p.id === builtInId)).toBeDefined();
    });
  });

  describe('deleteKitPreset', () => {
    it('deletes a user kit preset from localStorage', () => {
      const preset = {
        id: 'user-kit-1',
        name: 'To Delete',
        builtIn: false,
        instruments: DEFAULT_KIT_PRESETS[0].instruments,
      };
      PresetStorage.saveKitPreset(preset);

      PresetStorage.deleteKitPreset('user-kit-1');
      expect(PresetStorage.getKitPresets().find((p) => p.id === 'user-kit-1')).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/presetStorage.test.ts`

Expected: FAIL — `PresetStorage` not found.

- [ ] **Step 3: Implement PresetStorage**

Create `src/engine/presetStorage.ts`:

```ts
import type { PatternPreset, KitPreset } from './types';
import { DEFAULT_PATTERN_PRESETS, DEFAULT_KIT_PRESETS } from './defaultPresets';

const PATTERN_KEY = 'tr909-pattern-presets';
const KIT_KEY = 'tr909-kit-presets';

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

export const PresetStorage = {
  getPatternPresets(): PatternPreset[] {
    const userPresets = readJSON<PatternPreset>(PATTERN_KEY);
    return [...DEFAULT_PATTERN_PRESETS, ...userPresets];
  },

  getKitPresets(): KitPreset[] {
    const userPresets = readJSON<KitPreset>(KIT_KEY);
    return [...DEFAULT_KIT_PRESETS, ...userPresets];
  },

  savePatternPreset(preset: PatternPreset): void {
    const existing = readJSON<PatternPreset>(PATTERN_KEY);
    const filtered = existing.filter((p) => p.id !== preset.id);
    writeJSON(PATTERN_KEY, [...filtered, preset]);
  },

  saveKitPreset(preset: KitPreset): void {
    const existing = readJSON<KitPreset>(KIT_KEY);
    const filtered = existing.filter((p) => p.id !== preset.id);
    writeJSON(KIT_KEY, [...filtered, preset]);
  },

  deletePatternPreset(id: string): void {
    if (DEFAULT_PATTERN_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<PatternPreset>(PATTERN_KEY);
    writeJSON(PATTERN_KEY, existing.filter((p) => p.id !== id));
  },

  deleteKitPreset(id: string): void {
    if (DEFAULT_KIT_PRESETS.some((p) => p.id === id)) return;
    const existing = readJSON<KitPreset>(KIT_KEY);
    writeJSON(KIT_KEY, existing.filter((p) => p.id !== id));
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/presetStorage.test.ts`

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/presetStorage.ts src/engine/__tests__/presetStorage.test.ts
git commit -m "feat: add PresetStorage utility with localStorage persistence"
```

---

### Task 4: Extend AudioEngine with Preset Methods

**Files:**
- Modify: `src/engine/AudioEngine.ts`
- Modify: `src/engine/__tests__/AudioEngine.test.ts`

- [ ] **Step 1: Write failing tests for preset functionality**

Add the following tests to the end of the `describe('AudioEngine', ...)` block in `src/engine/__tests__/AudioEngine.test.ts`:

```ts
  // Add these inside the existing describe block, after the last existing test:

  describe('presets', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('initializes with preset lists from storage', () => {
      const engine = new AudioEngine();
      const snap = engine.getSnapshot();
      expect(snap.presets.patterns.length).toBeGreaterThan(0);
      expect(snap.presets.kits.length).toBeGreaterThan(0);
      expect(snap.presets.activePatternId).toBeNull();
      expect(snap.presets.activeKitId).toBeNull();
    });

    it('loadPatternPreset applies steps, accents, and bpm', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      const preset = engine.getSnapshot().presets.patterns[0];

      engine.loadPatternPreset(presetId);
      const snap = engine.getSnapshot();

      expect(snap.pattern.steps).toEqual(preset.steps);
      expect(snap.pattern.accents).toEqual(preset.accents);
      expect(snap.transport.bpm).toBe(preset.bpm);
      expect(snap.presets.activePatternId).toBe(presetId);
    });

    it('loadKitPreset applies instrument params', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.kits[0].id;
      const preset = engine.getSnapshot().presets.kits[0];

      engine.loadKitPreset(presetId);
      const snap = engine.getSnapshot();

      expect(snap.instruments).toEqual(preset.instruments);
      expect(snap.presets.activeKitId).toBe(presetId);
    });

    it('savePatternPreset creates a new preset and sets activePatternId', () => {
      const engine = new AudioEngine();
      engine.toggleStep('kick', 0);
      const beforeCount = engine.getSnapshot().presets.patterns.length;

      engine.savePatternPreset('My Pattern');
      const snap = engine.getSnapshot();

      expect(snap.presets.patterns.length).toBe(beforeCount + 1);
      const saved = snap.presets.patterns.find((p) => p.name === 'My Pattern');
      expect(saved).toBeDefined();
      expect(saved!.builtIn).toBe(false);
      expect(snap.presets.activePatternId).toBe(saved!.id);
    });

    it('saveKitPreset creates a new preset and sets activeKitId', () => {
      const engine = new AudioEngine();
      engine.setParam('kick', 'level', 0.3);
      const beforeCount = engine.getSnapshot().presets.kits.length;

      engine.saveKitPreset('My Kit');
      const snap = engine.getSnapshot();

      expect(snap.presets.kits.length).toBe(beforeCount + 1);
      const saved = snap.presets.kits.find((p) => p.name === 'My Kit');
      expect(saved).toBeDefined();
      expect(saved!.builtIn).toBe(false);
      expect(snap.presets.activeKitId).toBe(saved!.id);
    });

    it('deletePatternPreset removes preset and clears activePatternId if active', () => {
      const engine = new AudioEngine();
      engine.savePatternPreset('To Delete');
      const savedId = engine.getSnapshot().presets.activePatternId!;

      engine.deletePatternPreset(savedId);
      const snap = engine.getSnapshot();

      expect(snap.presets.patterns.find((p) => p.id === savedId)).toBeUndefined();
      expect(snap.presets.activePatternId).toBeNull();
    });

    it('deleteKitPreset removes preset and clears activeKitId if active', () => {
      const engine = new AudioEngine();
      engine.saveKitPreset('To Delete');
      const savedId = engine.getSnapshot().presets.activeKitId!;

      engine.deleteKitPreset(savedId);
      const snap = engine.getSnapshot();

      expect(snap.presets.kits.find((p) => p.id === savedId)).toBeUndefined();
      expect(snap.presets.activeKitId).toBeNull();
    });

    it('dirty tracking: toggleStep nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);
      expect(engine.getSnapshot().presets.activePatternId).toBe(presetId);

      engine.toggleStep('kick', 7);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: toggleAccent nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);

      engine.toggleAccent(0);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: setBpm nullifies activePatternId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.patterns[0].id;
      engine.loadPatternPreset(presetId);

      engine.setBpm(200);
      expect(engine.getSnapshot().presets.activePatternId).toBeNull();
    });

    it('dirty tracking: setParam nullifies activeKitId', () => {
      const engine = new AudioEngine();
      const presetId = engine.getSnapshot().presets.kits[0].id;
      engine.loadKitPreset(presetId);
      expect(engine.getSnapshot().presets.activeKitId).toBe(presetId);

      engine.setParam('kick', 'level', 0.1);
      expect(engine.getSnapshot().presets.activeKitId).toBeNull();
    });
  });
```

Also add `beforeEach` import — update the import line at the top of the test file:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/AudioEngine.test.ts`

Expected: FAIL — `presets` not in snapshot, methods don't exist.

- [ ] **Step 3: Update AudioEngine with preset support**

Replace the full content of `src/engine/AudioEngine.ts`:

```ts
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
      presets: { ...this.snapshot.presets, activePatternId: null },
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
      pattern: {
        steps: structuredClone(preset.steps),
        accents: [...preset.accents],
      },
      transport: { ...this.snapshot.transport, bpm: preset.bpm },
      presets: { ...this.snapshot.presets, activePatternId: id },
    });

    if (this.snapshot.transport.playing) {
      this.clock.setBpm(preset.bpm);
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
      id,
      name,
      builtIn: false,
      bpm: this.snapshot.transport.bpm,
      steps: structuredClone(this.snapshot.pattern.steps),
      accents: [...this.snapshot.pattern.accents],
    };

    PresetStorage.savePatternPreset(preset);

    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: PresetStorage.getPatternPresets(),
        activePatternId: id,
      },
    });
  }

  saveKitPreset(name: string): void {
    const id = crypto.randomUUID();
    const preset: KitPreset = {
      id,
      name,
      builtIn: false,
      instruments: structuredClone(this.snapshot.instruments),
    };

    PresetStorage.saveKitPreset(preset);

    this.emit({
      presets: {
        ...this.snapshot.presets,
        kits: PresetStorage.getKitPresets(),
        activeKitId: id,
      },
    });
  }

  deletePatternPreset(id: string): void {
    PresetStorage.deletePatternPreset(id);

    this.emit({
      presets: {
        ...this.snapshot.presets,
        patterns: PresetStorage.getPatternPresets(),
        activePatternId: this.snapshot.presets.activePatternId === id
          ? null
          : this.snapshot.presets.activePatternId,
      },
    });
  }

  deleteKitPreset(id: string): void {
    PresetStorage.deleteKitPreset(id);

    this.emit({
      presets: {
        ...this.snapshot.presets,
        kits: PresetStorage.getKitPresets(),
        activeKitId: this.snapshot.presets.activeKitId === id
          ? null
          : this.snapshot.presets.activeKitId,
      },
    });
  }

  // --- Clock Callback ---

  private onTick(time: number, step: number): void {
    if (this.ctx) {
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
              this.ctx, this.ctx.destination, time, params, accent,
            );
          } else {
            voices[id](this.ctx, this.ctx.destination, time, params, accent);
          }
        }
      }
    }

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

Run: `npx vitest run src/engine/__tests__/AudioEngine.test.ts`

Expected: All PASS (both existing and new tests).

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/AudioEngine.ts src/engine/__tests__/AudioEngine.test.ts
git commit -m "feat: add preset load/save/delete to AudioEngine with dirty tracking"
```

---

### Task 5: usePresets Hook

**Files:**
- Modify: `src/hooks/useEngine.ts`

- [ ] **Step 1: Add usePresets hook**

Add the following to the end of `src/hooks/useEngine.ts`:

```ts
export function usePresets(): EngineSnapshot['presets'] {
  return useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().presets,
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEngine.ts
git commit -m "feat: add usePresets hook"
```

---

### Task 6: PresetSelector Component

**Files:**
- Create: `src/components/PresetSelector.tsx`

- [ ] **Step 1: Create the PresetSelector component**

Create `src/components/PresetSelector.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';

interface PresetItem {
  id: string;
  name: string;
  builtIn: boolean;
}

interface PresetSelectorProps {
  label: string;
  presets: PresetItem[];
  activeId: string | null;
  onLoad: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

export function PresetSelector({
  label,
  presets,
  activeId,
  onLoad,
  onSave,
  onDelete,
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeName = activeId
    ? presets.find((p) => p.id === activeId)?.name ?? 'Custom'
    : 'Custom';

  const builtIn = presets.filter((p) => p.builtIn);
  const userPresets = presets.filter((p) => !p.builtIn);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSaving(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim());
      setSaveName('');
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="preset-selector" ref={dropdownRef}>
      <div className="preset-selector__label">{label}</div>
      <button
        className="preset-selector__trigger"
        onClick={() => { setOpen(!open); setSaving(false); }}
      >
        <span className="preset-selector__name">{activeName}</span>
        <span className="preset-selector__arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="preset-selector__dropdown">
          {builtIn.map((p) => (
            <button
              key={p.id}
              className={`preset-selector__item${p.id === activeId ? ' preset-selector__item--active' : ''}`}
              onClick={() => { onLoad(p.id); setOpen(false); }}
            >
              {p.name}
            </button>
          ))}

          {userPresets.length > 0 && (
            <>
              <div className="preset-selector__divider" />
              {userPresets.map((p) => (
                <div key={p.id} className="preset-selector__item-row">
                  <button
                    className={`preset-selector__item${p.id === activeId ? ' preset-selector__item--active' : ''}`}
                    onClick={() => { onLoad(p.id); setOpen(false); }}
                  >
                    {p.name}
                  </button>
                  <button
                    className="preset-selector__delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}

          <div className="preset-selector__divider" />

          {saving ? (
            <div className="preset-selector__save-form">
              <input
                className="preset-selector__save-input"
                type="text"
                placeholder="Preset name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                autoFocus
              />
              <button className="preset-selector__save-confirm" onClick={handleSave}>
                OK
              </button>
            </div>
          ) : (
            <button
              className="preset-selector__item preset-selector__save-btn"
              onClick={() => setSaving(true)}
            >
              + Save Current
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PresetSelector.tsx
git commit -m "feat: add PresetSelector component"
```

---

### Task 7: CSS for PresetSelector

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add preset selector styles**

Append the following to the end of `src/styles/index.css`:

```css
/* Preset Selectors */
.preset-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.preset-selector {
  position: relative;
  flex: 1;
}

.preset-selector__label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.preset-selector__trigger {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px 10px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.preset-selector__trigger:hover {
  border-color: var(--text-muted);
}

.preset-selector__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-selector__arrow {
  font-size: 8px;
  color: var(--text-muted);
  margin-left: 8px;
}

.preset-selector__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.preset-selector__item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 6px 10px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.preset-selector__item:hover {
  background: var(--border);
  color: var(--text-primary);
}

.preset-selector__item--active {
  color: var(--accent);
}

.preset-selector__item-row {
  display: flex;
  align-items: center;
}

.preset-selector__item-row .preset-selector__item {
  flex: 1;
}

.preset-selector__delete {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.1s;
}

.preset-selector__delete:hover {
  color: #ff4444;
}

.preset-selector__divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.preset-selector__save-btn {
  color: var(--accent) !important;
}

.preset-selector__save-form {
  display: flex;
  gap: 4px;
  padding: 4px 6px;
}

.preset-selector__save-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.preset-selector__save-input:focus {
  outline: 1px solid var(--accent);
}

.preset-selector__save-confirm {
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add preset selector CSS styles"
```

---

### Task 8: Wire PresetSelector into App

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Update App to include PresetSelector components**

Replace the full content of `src/components/App.tsx`:

```tsx
import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { usePresets, engine } from '../hooks/useEngine';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { PresetSelector } from './PresetSelector';
import { InstrumentSelector } from './InstrumentSelector';
import { ParamKnobs } from './ParamKnobs';
import { StepGrid } from './StepGrid';
import { AccentRow } from './AccentRow';
import { Playhead } from './Playhead';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const presets = usePresets();

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <div className="tr909">
        <Transport />
        <div className="preset-row">
          <PresetSelector
            label="Pattern"
            presets={presets.patterns}
            activeId={presets.activePatternId}
            onLoad={(id) => engine.loadPatternPreset(id)}
            onSave={(name) => engine.savePatternPreset(name)}
            onDelete={(id) => engine.deletePatternPreset(id)}
          />
          <PresetSelector
            label="Kit"
            presets={presets.kits}
            activeId={presets.activeKitId}
            onLoad={(id) => engine.loadKitPreset(id)}
            onSave={(name) => engine.saveKitPreset(name)}
            onDelete={(id) => engine.deleteKitPreset(id)}
          />
        </div>
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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/App.tsx
git commit -m "feat: wire PresetSelector into App layout"
```

---

### Task 9: Update Integration Tests

**Files:**
- Modify: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Add preset rendering tests**

Add the following tests to the end of the `describe('App', ...)` block in `src/components/__tests__/App.test.tsx`:

```tsx
  it('renders pattern and kit preset selectors', () => {
    render(<App />);
    expect(screen.getByText('Pattern')).toBeDefined();
    expect(screen.getByText('Kit')).toBeDefined();
  });

  it('shows Custom as default preset name', () => {
    render(<App />);
    const customLabels = screen.getAllByText('Custom');
    expect(customLabels.length).toBe(2);
  });
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/__tests__/App.test.tsx
git commit -m "feat: add preset integration tests"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
```

If any uncommitted files, add and commit:

```bash
git add .
git commit -m "chore: final cleanup for presets feature"
```
