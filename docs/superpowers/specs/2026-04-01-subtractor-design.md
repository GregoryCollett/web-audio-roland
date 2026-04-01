# GC-SUB Subtractor Synthesizer — Design Spec

## Overview

Add a Reason Subtractor-inspired synthesizer module. The Subtractor is a fully-featured subtractive synth with two oscillators (32 waveforms each), FM and ring modulation, two filters in series (multimode SVF + Butterworth LP, both custom AudioWorklets), three ADSR envelopes, two LFOs, a full 8-slot modulation matrix, and portamento. It has a monophonic 16-step sequencer with per-step velocity.

## Architecture

Follows the established engine pattern: `SubtractorEngine` class with `subscribe`/`getSnapshot`, registers tick callback with `TransportManager`, routes audio through `MixerEngine` channel 4. Two new AudioWorklet processors for the filters.

## Signal Chain

```
Osc1 ──┐
       ├──▸ Osc Mixer ──▸ Filter 1 (multimode SVF) ──▸ Filter 2 (Butterworth LP) ──▸ VCA ──▸ Mixer Ch 4
Osc2 ──┤        ▲
       │    Ring Mod (osc1 × osc2)
Noise ─┘    FM (osc2 → osc1 freq)

Mod sources:                    Mod destinations:
├── LFO1 (free-running)         ├── osc1Pitch (cents)
├── LFO2 (key-sync option)      ├── osc2Pitch (cents)
├── Mod Envelope (ADSR)         ├── osc1PW
├── Velocity (per-note)         ├── osc2PW
                                ├── oscMix
                                ├── fmAmount
                                ├── filter1Cutoff
                                ├── filter1Resonance
                                ├── filter2Cutoff
                                ├── ampLevel
                                ├── lfo1Rate
                                └── lfo2Rate
```

### Oscillators

Two persistent `OscillatorNode`s. Each has 32 waveform selections (see Waveforms section). Controls: waveform (0-31), octave (-2 to +2), semitone (-12 to +12), fine tune (-50 to +50 cents), pulse width (0-1 for pulse-type waveforms), level (0-1).

Osc2 can FM-modulate osc1 — osc2's output is routed to osc1's `frequency` AudioParam via a gain node controlled by `fmAmount`.

Ring modulation: osc1 × osc2 via a `GainNode` where osc1 is the input and osc2 modulates the gain. Ring mod output has its own level control and is summed into the osc mixer.

### Oscillator Mixer

Sums: osc1 (scaled by `1 - oscMix`), osc2 (scaled by `oscMix`), noise (scaled by `noiseLevel`), ring mod (scaled by `ringModLevel`). Feeds into Filter 1.

### Filters

**Filter 1 — Multimode SVF** (`public/worklets/subtractor-filter1-processor.js`)

State-variable filter topology providing LP12, LP24 (two cascaded SVF stages), HP12, BP12, and Notch from the same structure. Different modes read different outputs from the SVF.

AudioParams: `frequency` (20-20000, a-rate), `resonance` (0-4, a-rate), `mode` (0-4, k-rate: 0=LP12, 1=LP24, 2=HP12, 3=BP12, 4=Notch).

DSP class: `SVFFilter` — two stages of state-variable filter maintaining `low`, `high`, `band`, `notch` state. Exported and testable. Source `.ts` in `src/engine/subtractor/` for tests.

**Filter 2 — Butterworth LP** (`public/worklets/subtractor-filter2-processor.js`)

Clean 2-pole Butterworth lowpass. Transparent character — designed to tame Filter 1's output.

AudioParams: `frequency` (20-20000, a-rate), `resonance` (0-2, a-rate).

DSP class: `ButterworthLP` — exported and testable.

Both filters have keyboard tracking: `cutoff = baseCutoff + keyTrack * noteOffset` where `noteOffset` is the distance from middle C in semitones.

### Envelopes

Three ADSR envelopes using the shared `ADSRParams` type from `synthTypes.ts` and `adsrTimeMap()` for logarithmic time scaling (0.001s–2s).

- **Amp envelope** → VCA gain
- **Filter envelope** → Filter 1 cutoff (depth controlled by `filterEnvDepth`)
- **Mod envelope** → routed via mod matrix to any destination

All triggered on note-on (gate = 'note'), sustained on tie, released on rest or end of non-tied step.

### LFOs

Two LFOs. Each has: waveform (triangle, sawtooth, square, random S&H), rate (0-1 → 0.1–20Hz log), delay (0-1 → fade-in time after note trigger, 0–2s).

LFO1: free-running (never resets phase).
LFO2: optionally key-synced (resets phase on each note trigger when `keySync` is true).

Inverted modulation achieved via negative amount in the mod matrix — no separate inverted waveforms needed.

S&H (sample-and-hold): generates a new random value at the LFO rate. Implemented as a custom oscillator that changes value on each cycle.

### Mod Matrix

8 slots. Each slot:
```ts
interface ModSlot {
  source: 'lfo1' | 'lfo2' | 'modEnv' | 'velocity' | 'none';
  destination: string;   // one of the 12 destination keys
  amount: number;        // -1 to +1 bipolar
}
```

**Sources (4):** LFO1 (-1 to +1), LFO2 (-1 to +1), Mod Envelope (0 to +1), Velocity (0 to +1, normalized from 0-127).

**Destinations (12):** osc1Pitch, osc2Pitch, osc1PW, osc2PW, oscMix, fmAmount, filter1Cutoff, filter1Resonance, filter2Cutoff, ampLevel, lfo1Rate, lfo2Rate.

**Implementation:** LFO and mod envelope modulations use AudioParam automation — the LFO OscillatorNode connects through a gain node (scaled by amount) to the destination AudioParam. Velocity is a per-note static value applied as a one-time offset at note trigger time.

### Portamento

Three modes:
- **Off** — pitch changes instantly
- **On** — always glides between notes at `portamentoRate` speed
- **Auto** — only glides on legato (tied/slid) notes, jumps on new attacks

Rate maps 0-1 to 1ms–500ms glide time logarithmically.

### Noise Generator

Looping white noise `AudioBufferSourceNode` through a gain node (`noiseLevel`), summed into the osc mixer before Filter 1.

## Data Model

### Reused Types

From `src/engine/synth/synthTypes.ts`:
- `ADSRParams` — { attack, decay, sustain, release } all 0-1
- `midiToFreq(note)` — MIDI to Hz
- `midiToName(note)` — MIDI to display name
- `adsrTimeMap(value)` — 0-1 to 0.001s–2s logarithmic

### New Types

```ts
interface SubOscParams {
  waveform: number;      // 0-31
  octave: number;        // -2 to +2
  semitone: number;      // -12 to +12
  fineTune: number;      // -50 to +50 cents
  pulseWidth: number;    // 0-1
  level: number;         // 0-1
}

interface LFOParams {
  waveform: 'triangle' | 'sawtooth' | 'square' | 'random';
  rate: number;          // 0-1
  delay: number;         // 0-1
  keySync: boolean;
}

interface ModSlot {
  source: 'lfo1' | 'lfo2' | 'modEnv' | 'velocity' | 'none';
  destination: string;
  amount: number;        // -1 to +1
}

interface FilterParams {
  cutoff: number;        // 0-1
  resonance: number;     // 0-1
  keyTrack: number;      // 0-1
}

interface SubtractorParams {
  osc1: SubOscParams;
  osc2: SubOscParams;
  noiseLevel: number;
  ringModLevel: number;
  fmAmount: number;
  oscMix: number;        // 0=all osc1, 1=all osc2

  filter1: FilterParams;
  filter1Mode: 'lp12' | 'lp24' | 'hp12' | 'bp12' | 'notch';
  filter2: FilterParams;
  filterEnv: ADSRParams;
  filterEnvDepth: number;

  ampEnv: ADSRParams;

  modEnv: ADSRParams;
  modMatrix: ModSlot[];  // 8 slots

  lfo1: LFOParams;
  lfo2: LFOParams;

  portamentoMode: 'off' | 'on' | 'auto';
  portamentoRate: number;

  volume: number;
}
```

### Sequencer Step

```ts
interface SubtractorStep {
  note: number;       // MIDI 0-127
  velocity: number;   // 0-127
  slide: boolean;
  gate: 'note' | 'rest' | 'tie';
}
```

No accent boolean — velocity replaces it. Velocity feeds into the mod matrix.

### Snapshot

```ts
interface SubtractorSnapshot {
  pattern: SubtractorPattern;
  params: SubtractorParams;
  presets: {
    patterns: SubtractorPatternPreset[];
    sounds: SubtractorSoundPreset[];
    activePatternId: string | null;
    activeSoundId: string | null;
  };
}
```

### Preset Types

```ts
interface SubtractorPatternPreset {
  id: string;
  name: string;
  builtIn: boolean;
  steps: SubtractorStep[];
}

interface SubtractorSoundPreset {
  id: string;
  name: string;
  builtIn: boolean;
  params: SubtractorParams;
}
```

## Waveforms

32 waveforms in `src/engine/subtractor/waveforms.ts`. Exports `createWaveform(ctx: AudioContext, index: number): PeriodicWave | null` (returns null for indices 0-3 which use native OscillatorNode types) and `WAVEFORM_NAMES: string[]`.

| # | Name | Implementation |
|---|------|---------------|
| 0 | Sine | Native OscillatorNode |
| 1 | Triangle | Native |
| 2 | Sawtooth | Native |
| 3 | Square | Native |
| 4 | Pulse 25% | PeriodicWave — 25% duty cycle |
| 5 | Pulse 10% | PeriodicWave — 10% duty cycle |
| 6 | Half-saw | PeriodicWave — saw that resets halfway |
| 7 | Ramp | PeriodicWave — asymmetric triangle |
| 8 | Supersaw | Multiple detuned saw partials |
| 9 | Sync Saw | PeriodicWave — hard-sync-like harmonics |
| 10 | Sync Square | PeriodicWave — sync square harmonics |
| 11 | FM Bell | PeriodicWave — FM-derived bell partials |
| 12 | FM Metallic | PeriodicWave — inharmonic FM partials |
| 13 | Organ 1 | PeriodicWave — drawbar 8'+4' |
| 14 | Organ 2 | PeriodicWave — drawbar 16'+8'+4'+2' |
| 15 | Organ 3 | PeriodicWave — full drawbar set |
| 16 | Formant A | PeriodicWave — vowel "ah" |
| 17 | Formant E | PeriodicWave — vowel "ee" |
| 18 | Formant O | PeriodicWave — vowel "oh" |
| 19 | Choir | PeriodicWave — mixed vowel formants |
| 20 | Brass | PeriodicWave — bright brass harmonics |
| 21 | String | PeriodicWave — bowed string harmonics |
| 22 | Pluck | PeriodicWave — decaying harmonic series |
| 23 | Reed | PeriodicWave — clarinet-like odd harmonics |
| 24 | Noise Bright | PeriodicWave — dense random harmonics |
| 25 | Noise Dark | PeriodicWave — low-passed random harmonics |
| 26 | Digital 1 | PeriodicWave — quantized staircase |
| 27 | Digital 2 | PeriodicWave — bit-crushed saw |
| 28 | Digital 3 | PeriodicWave — aliased square |
| 29 | Harmonic 1 | PeriodicWave — odd harmonics equal amplitude |
| 30 | Harmonic 2 | PeriodicWave — even harmonics only |
| 31 | Sub | PeriodicWave — fundamental + sub-octave |

## Default Presets

### Pattern Presets (12)

| Name | Character |
|------|-----------|
| Classic Sequence | Rising minor scale, velocity accents on downbeats, slides ascending |
| Velocity Sweep | Same note, velocity ramps up then down |
| Chord Stabs | Short gated notes on 1, &2, 4 with high velocity |
| Legato Line | Long tied phrases with slides, expressive velocity |
| Rhythmic Pulse | Syncopated 16ths, velocity creates groove |
| Ambient Drift | Sparse notes with ties, low velocity, occasional peaks |
| Octave Bounce | Alternating low/high octave, velocity emphasizing lows |
| Trance Gate | Every step C3, velocity creates rhythmic gate |
| Arp Up-Down | Ascending 4 notes descending, slides on changes |
| Glide Melody | Slow melody, slides every step, velocity crescendos |
| Stutter | Rapid repeated notes with rests, velocity stutter |
| Sparse Hits | 4-5 notes across 16 steps, high velocity, dramatic rests |

### Sound Presets (16)

| Name | Character |
|------|-----------|
| Init Patch | Single saw, open filter, no modulation |
| Classic Sub Bass | Saw + square octave down, low cutoff |
| Acid Lead | Saw, LP24 high resonance, fast filter env |
| Pad Wash | Two detuned saws, slow filter attack, LFO on cutoff |
| FM Bell | High FM, fast decay, zero sustain |
| Sync Lead | Sync saw, BP filter, mod env on pitch |
| Noise Sweep | High noise, LP24, filter env sweep |
| Ring Mod Perc | Ring mod, short amp, notch filter, velocity→amp |
| Supersaw Pad | Supersaw both oscs, detuned, slow LFO on cutoff |
| Pluck Bass | Saw + sub waveform, fast filter decay |
| Brass Stab | Brass waveform, fast filter attack, velocity→cutoff |
| String Ensemble | String waveform detuned, slow attack, HP12, LFO pitch |
| Digital Chime | Digital 1, fast decay, high resonance, FM |
| Wobble Bass | Saw, LFO1 on cutoff medium rate, LP24 |
| Formant Voice | Formant A + E, osc mix modulated by LFO2 |
| Distorted Lead | Both saws, LP24 max resonance, velocity→filter |

### localStorage

- `tr909-subtractor-pattern-presets`
- `tr909-subtractor-sound-presets`

## UI

### Component Tree

```
SubtractorSection
├── SubtractorHeader          — "GC-SUB" + "SUBTRACTOR", pattern/sound preset selectors
├── SubtractorOscSection      — osc1 + osc2 panels, osc mix, FM, ring mod, noise knobs
├── SubtractorFilterSection   — Filter 1 (mode, cutoff, res, key track, env depth) + Filter 2 + Filter ADSR
├── SubtractorAmpSection      — Amp ADSR, volume, portamento mode + rate
├── SubtractorModSection      — LFO1 + LFO2 panels, Mod Envelope ADSR
├── SubtractorModMatrix       — 8-row table: source dropdown, destination dropdown, amount knob
├── SubtractorStepGrid        — 16 steps showing note name, velocity bar, gate state, slide
├── SubtractorStepEditor      — note/octave +/-, velocity knob, gate buttons, slide toggle
└── Playhead (shared)
```

All knobs use shared `Knob`. Waveform selection uses prev/next buttons with the waveform name displayed.

### Keyboard Integration

Tab cycles: drum → bass → synth → subtractor → drum. When subtractor focused:
- `←`/`→` — step navigation
- `↑`/`↓` — pitch ±1 semitone
- `S` — toggle slide
- `N`/`R`/`T` — gate: note/rest/tie
- `V` + `↑`/`↓` — velocity ±8 (while V held, arrows adjust velocity instead of pitch)

### Mixer

Channel 4, labeled "GC-SUB".

## File Structure

### New files

```
src/engine/subtractor/
  subtractorTypes.ts
  waveforms.ts
  SubtractorEngine.ts
  defaultSubtractorPresets.ts
  subtractorPresetStorage.ts
  __tests__/
    subtractorFilter1.test.ts
    subtractorFilter2.test.ts
    SubtractorEngine.test.ts
    subtractorPresetStorage.test.ts

public/worklets/
  subtractor-filter1-processor.js
  subtractor-filter2-processor.js

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

### Modified files

```
src/engine/TransportManager.ts    — register two new worklets
src/hooks/useKeyboard.ts          — add 'subtractor' to focus cycling, V+arrow for velocity
src/components/App.tsx             — add SubtractorSection, wire focus
src/styles/index.css               — subtractor section styles
```

### Reused

- `ADSRParams`, `midiToFreq`, `midiToName`, `adsrTimeMap` from `synthTypes.ts`
- `Knob`, `Fader`, `PresetSelector`, `Playhead` from shared components

## Testing

### Filter DSP Tests (subtractorFilter1.test.ts, subtractorFilter2.test.ts)
- Mock worklet globals, test DSP classes directly
- Filter 1: LP12 attenuates highs, LP24 attenuates more steeply, HP passes highs, BP passes band, Notch rejects band
- Filter 1: resonance creates peak, mode switching doesn't glitch
- Filter 2: attenuates highs, output bounded
- Both: signal passes at max cutoff, stays bounded at high resonance

### SubtractorEngine Tests
- Default snapshot
- Pattern editing: setNote, setVelocity, toggleSlide, setGate
- Param editing: setOscParam, setFilterParam, setFilter1Mode, setAmpEnv, setFilterEnv, setModEnv, setLFOParam, setModSlot, setPortamento, setFmAmount, setRingModLevel, setNoiseLevel, setOscMix, setVolume
- Mod matrix: setModSlot updates slot, clearing source to 'none'
- Subscribe notifies
- Dirty tracking: pattern edits → activePatternId null, param edits → activeSoundId null
- Preset CRUD: load/save/delete for both types

### PresetStorage Tests
- Returns built-ins when empty, merges, saves, deletes user not built-in
