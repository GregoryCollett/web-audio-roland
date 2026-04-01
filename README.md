# Web Audio Roland

**[Live Demo](https://gregorycollett.github.io/web-audio-roland/)**

A browser-based recreation of classic Roland instruments built with React and the Web Audio API. Features three fully-synthesized instruments sharing a unified transport, 12-channel mixer, and master compressor.

## Instruments

### TR-909 Drum Machine
- All 11 voices synthesized from scratch (kick, snare, clap, rimshot, closed/open hi-hat, 3 toms, crash, ride)
- 16-step pattern sequencer with per-step accent
- Per-instrument level, tune, and decay controls
- Hi-hat choke group
- 20 built-in pattern presets, 12 kit presets

### TB-303 Bass Line
- Monophonic 16-step sequencer with per-step pitch, accent, slide, and gate (note/rest/tie)
- Sawtooth/square oscillator through a custom diode ladder filter (AudioWorklet)
- Filter envelope with decay control, accent modulation
- 6 pattern presets, 6 synth presets

### SH-2 Synthesizer
- Two independent oscillators (saw/square/pulse) with octave, tune, and pulse width
- Noise mixer
- IR3109-style OTA ladder filter (AudioWorklet) with separate ADSR envelope
- Independent VCA ADSR envelope
- LFO with triangle/square waveform routable to pitch, cutoff, or pulse width
- 6 pattern presets, 6 sound presets

## Architecture

- **TransportManager** — shared clock (Web Worker-based for jank-free timing), BPM, shuffle, master compressor chain
- **Engine per instrument** — each instrument is a standalone class with `subscribe`/`getSnapshot` for React via `useSyncExternalStore`
- **MixerEngine** — 12-channel mixer with per-channel volume, pan, mute, solo
- **AudioWorklets** — custom diode ladder (303) and IR3109 OTA ladder (SH-2) filter processors running on the audio thread
- **React** is a pure view layer — it never creates or manipulates Web Audio nodes directly

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click "Start" to initialize the AudioContext.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Stop |
| `Tab` | Switch focus between TR-909, TB-303, SH-2 |
| `1`-`9`, `0`, `-` | Select drum instrument (when 909 focused) |
| `←` / `→` | Navigate steps |
| `↑` / `↓` | BPM ±1 (909) / Pitch ±1 semitone (303/SH-2) |
| `Cmd+↑` / `Cmd+↓` | Shuffle ±5% |
| `P` | Toggle drum step (909) |
| `A` | Toggle accent |
| `S` | Toggle slide (303/SH-2) |
| `N` / `R` / `T` | Set gate: Note / Rest / Tie (303/SH-2) |

## Tech Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- Web Audio API + AudioWorklet
- [Vitest](https://vitest.dev) + React Testing Library

## License

MIT
