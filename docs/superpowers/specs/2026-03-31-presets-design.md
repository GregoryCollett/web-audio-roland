# TR-909 Presets — Design Spec

## Overview

Add preset selection, saving, and built-in defaults to the TR-909 drum machine. Presets are split into two independent types — pattern presets and kit presets — allowing users to mix and match rhythms with different sound configurations.

## Preset Types

### Pattern Presets

A pattern preset captures the rhythmic programming:

```ts
interface PatternPreset {
  id: string;
  name: string;
  builtIn: boolean;       // true = shipped default, can't be deleted/overwritten
  bpm: number;
  steps: Record<InstrumentId, boolean[]>;
  accents: boolean[];
}
```

### Kit Presets

A kit preset captures the sound character across all instruments:

```ts
interface KitPreset {
  id: string;
  name: string;
  builtIn: boolean;
  instruments: Record<InstrumentId, InstrumentParams>;
}
```

### Independence

Pattern and kit presets are fully independent. Loading a pattern preset does not affect instrument params. Loading a kit preset does not affect the step grid, accents, or BPM. Users can combine any pattern with any kit.

## Engine Snapshot Extension

The `EngineSnapshot` expands with a `presets` section:

```ts
interface EngineSnapshot {
  transport: { playing: boolean; bpm: number; currentStep: number };
  pattern: { steps: Record<InstrumentId, boolean[]>; accents: boolean[] };
  instruments: Record<InstrumentId, InstrumentParams>;
  presets: {
    patterns: PatternPreset[];
    kits: KitPreset[];
    activePatternId: string | null;
    activeKitId: string | null;
  };
}
```

`activePatternId` and `activeKitId` track which preset is currently loaded. They go to `null` when the user edits the state after loading a preset (dirty tracking).

## Dirty Tracking

- Any call to `toggleStep`, `toggleAccent`, or `setBpm` sets `activePatternId` to `null`
- Any call to `setParam` sets `activeKitId` to `null`
- This happens automatically in the existing mutation methods

The UI shows the active preset name, or "Custom" when the active ID is null.

## PresetStorage Utility

`src/engine/presetStorage.ts` — a thin module handling localStorage with no engine or React dependencies.

**localStorage keys:**
- `tr909-pattern-presets` — JSON array of user-created `PatternPreset[]`
- `tr909-kit-presets` — JSON array of user-created `KitPreset[]`

**API:**
- `getPatternPresets(): PatternPreset[]` — merges built-in defaults with user presets from localStorage
- `getKitPresets(): KitPreset[]` — same for kits
- `savePatternPreset(preset: PatternPreset): void` — writes to localStorage
- `saveKitPreset(preset: KitPreset): void` — writes to localStorage
- `deletePatternPreset(id: string): void` — removes from localStorage, refuses if `builtIn`
- `deleteKitPreset(id: string): void` — same

Built-in presets are imported from `defaultPresets.ts` and merged at read time. They are never written to localStorage. New defaults can be shipped in future versions without conflicting with user data.

User preset IDs are generated with `crypto.randomUUID()`.

## Engine Methods

**Loading:**
- `loadPatternPreset(id: string)` — sets `pattern.steps`, `pattern.accents`, `transport.bpm`, and `presets.activePatternId`
- `loadKitPreset(id: string)` — sets `instruments` and `presets.activeKitId`

**Saving:**
- `savePatternPreset(name: string)` — snapshots current `pattern` + `bpm`, writes via `PresetStorage`, sets `activePatternId`
- `saveKitPreset(name: string)` — snapshots current `instruments`, writes via `PresetStorage`, sets `activeKitId`

**Deleting:**
- `deletePatternPreset(id: string)` — removes via `PresetStorage`, clears `activePatternId` if it was active
- `deleteKitPreset(id: string)` — same for kits

**Initialization:** The constructor calls `PresetStorage.getPatternPresets()` and `PresetStorage.getKitPresets()` to populate the presets section of the initial snapshot.

## Default Presets

### Pattern Presets (7)

| Name | Style | BPM | Character |
|------|-------|-----|-----------|
| Four on the Floor | House | 124 | Kick every beat, hats on 8ths, clap on 2 & 4, open hat offbeats |
| Techno Drive | Techno | 130 | Driving kick, rimshot on the & of 2, sparse hi-hats, crash on 1 |
| Boom Bap | Hip-hop | 90 | Kick on 1 and the & of 2, snare on 3, lazy hat pattern |
| Electro Funk | Electro | 115 | Syncopated kick, clap on 2 & 4, busy hat pattern, rimshot accents |
| Breakbeat | Breaks | 135 | Broken kick pattern, snare on 2 & 4 with ghost notes via accents, open hat fills |
| Minimal Pulse | Minimal | 122 | Very sparse — kick on 1 & 3, closed hat on every 16th, single clap on 4 |
| Latin Percussion | Latin | 110 | Toms and rimshot heavy, clave-inspired rhythm, no kick |

### Kit Presets (6)

| Name | Character |
|------|-----------|
| Classic 909 | Balanced defaults — middle-of-the-road levels and decays |
| Punchy | Short decays, high levels, kick and snare boosted |
| Deep | Long kick decay, low tune, subtle hats, boomy toms |
| Crispy | Short everything, high-tuned snare, bright hats |
| Lo-Fi | Low levels across the board, long decays, detuned |
| Percussion Heavy | Toms and rimshot boosted, kick and snare pulled back, cymbals bright |

All defaults are hardcoded in `src/engine/defaultPresets.ts` as plain data arrays.

## UI

### PresetSelector Component

A compact dropdown-style control, rendered twice in the UI (once for patterns, once for kits). Each instance shows:

- The active preset name, or "Custom" if `activeId` is `null`
- A dropdown list of available presets, grouped: built-in first, then user-saved (separated by a divider)
- A "Save" button that shows an inline text input for naming and saving the current state
- A delete button ("x") next to user presets only (not shown for built-in)

### Layout Position

The two preset selectors sit between the Transport bar and the Instrument Selector — a new row with "Pattern" and "Kit" side by side.

### Save Flow

Clicking "Save" reveals an inline text input below the dropdown. The user types a name and hits Enter or clicks a confirm button. The component calls `engine.savePatternPreset(name)` or `engine.saveKitPreset(name)`. The input disappears and the newly saved preset becomes the active preset.

### Delete Flow

Clicking the "x" next to a user preset calls `engine.deletePatternPreset(id)` or `engine.deleteKitPreset(id)` immediately. No confirmation dialog.

### New Hook

`usePresets()` — returns the `presets` slice from the engine snapshot via `useSyncExternalStore`.

## File Structure

**New files:**
```
src/engine/defaultPresets.ts                    — built-in PatternPreset[] and KitPreset[]
src/engine/presetStorage.ts                     — localStorage read/write utility
src/engine/__tests__/presetStorage.test.ts      — localStorage and merge tests
src/components/PresetSelector.tsx               — dropdown + save/delete UI
```

**Modified files:**
```
src/engine/types.ts             — add PatternPreset, KitPreset, expand EngineSnapshot
src/engine/AudioEngine.ts       — add preset methods, dirty tracking, init with presets
src/engine/__tests__/AudioEngine.test.ts — expand with preset tests
src/hooks/useEngine.ts          — add usePresets() hook
src/components/App.tsx           — add PresetSelector components
src/styles/index.css             — add preset selector styles
src/components/__tests__/App.test.tsx — expand with preset rendering tests
```

## Testing

### PresetStorage Tests
- Returns built-in presets when localStorage is empty
- Merges user presets with built-in presets
- Saves a user preset to localStorage
- Deletes a user preset from localStorage
- Refuses to delete a built-in preset

### Engine Preset Tests
- `loadPatternPreset` applies steps, accents, and BPM
- `loadKitPreset` applies instrument params
- `savePatternPreset` creates a new preset and sets activePatternId
- `saveKitPreset` creates a new preset and sets activeKitId
- `deletePatternPreset` removes preset and clears activePatternId if active
- Dirty tracking: editing steps nullifies activePatternId
- Dirty tracking: editing params nullifies activeKitId

### Component Tests
- PresetSelector renders with preset list
- Selecting a preset calls the appropriate engine method
- Save flow creates a new preset
