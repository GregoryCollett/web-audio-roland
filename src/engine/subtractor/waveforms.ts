const TWO_PI = Math.PI * 2;

// ---------------------------------------------------------------------------
// Waveform name table (indices 0-31)
// ---------------------------------------------------------------------------

export const WAVEFORM_NAMES: string[] = [
  'Sine',          // 0
  'Triangle',      // 1
  'Sawtooth',      // 2
  'Square',        // 3
  'Pulse 25%',     // 4
  'Pulse 10%',     // 5
  'Half-Saw',      // 6
  'Ramp',          // 7
  'Supersaw',      // 8
  'Sync Saw',      // 9
  'Sync Square',   // 10
  'FM Bell',       // 11
  'FM Metallic',   // 12
  'Organ 1',       // 13
  'Organ 2',       // 14
  'Organ 3',       // 15
  'Formant A',     // 16
  'Formant E',     // 17
  'Formant O',     // 18
  'Choir',         // 19
  'Brass',         // 20
  'String',        // 21
  'Pluck',         // 22
  'Reed',          // 23
  'Noise Bright',  // 24
  'Noise Dark',    // 25
  'Digital 1',     // 26
  'Digital 2',     // 27
  'Digital 3',     // 28
  'Harmonic 1',    // 29
  'Harmonic 2',    // 30
  'Sub',           // 31
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Allocate zeroed real/imag arrays for N harmonics (index 0 = DC, 1..N-1 = harmonics). */
function makeArrays(size: number): [Float32Array, Float32Array] {
  return [new Float32Array(size), new Float32Array(size)];
}

/** Normalise so peak absolute value = 1 across both arrays. */
function normalise(real: Float32Array, imag: Float32Array): void {
  let peak = 0;
  for (let i = 0; i < real.length; i++) {
    if (Math.abs(real[i]) > peak) peak = Math.abs(real[i]);
    if (Math.abs(imag[i]) > peak) peak = Math.abs(imag[i]);
  }
  if (peak > 0) {
    for (let i = 0; i < real.length; i++) {
      real[i] /= peak;
      imag[i] /= peak;
    }
  }
}

// ---------------------------------------------------------------------------
// Per-waveform builders (indices 4-31, returning PeriodicWave)
// ---------------------------------------------------------------------------

const HARMONICS = 64;

function buildPulse(ctx: AudioContext, duty: number): PeriodicWave {
  const [real, imag] = makeArrays(HARMONICS);
  // DC offset from duty cycle
  real[0] = 2 * duty - 1;
  for (let n = 1; n < HARMONICS; n++) {
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function buildHalfSaw(ctx: AudioContext): PeriodicWave {
  // Only even harmonics — creates half-wave rectified saw character
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n += 2) {
    imag[n] = 1 / n;
  }
  // Even harmonics at lower amplitude
  for (let n = 2; n < HARMONICS; n += 2) {
    imag[n] = 0.5 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildRamp(ctx: AudioContext): PeriodicWave {
  // Ramp = reverse sawtooth (phase-flipped)
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    imag[n] = -1 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildSupersaw(ctx: AudioContext): PeriodicWave {
  // Approximate supersaw: sum 7 detuned saws in harmonic domain
  // Detune offsets in cents: -12, -8, -4, 0, +4, +8, +12
  const [real, imag] = makeArrays(HARMONICS);
  const detunesCents = [-12, -8, -4, 0, 4, 8, 12];
  for (const detuneCents of detunesCents) {
    const ratio = Math.pow(2, detuneCents / 1200);
    for (let n = 1; n < HARMONICS; n++) {
      // Sawtooth harmonic at slightly shifted phase
      const phase = TWO_PI * n * (detuneCents / 1200);
      imag[n] += (1 / n) * Math.cos(phase) * ratio;
      real[n] += (1 / n) * Math.sin(phase) * ratio;
    }
  }
  real[0] = 0;
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildSyncSaw(ctx: AudioContext): PeriodicWave {
  // Hard sync approximation: saw harmonics with additional sync aliasing
  // Achieved by summing two saws at different octave relationships
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    imag[n] = 1 / n;
  }
  // Add octave-doubled component (sync-like brightness)
  for (let n = 1; n < HARMONICS; n += 2) {
    imag[n] += 0.4 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildSyncSquare(ctx: AudioContext): PeriodicWave {
  // Square with sync-like overtones: odd harmonics + extra even harmonics for brightness
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n += 2) {
    imag[n] = 1 / n;
  }
  for (let n = 2; n < HARMONICS; n += 4) {
    imag[n] = 0.3 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildFMBell(ctx: AudioContext): PeriodicWave {
  // Bell tones: inharmonic partials characteristic of FM bells
  // Partials at 1, 2.756, 5.404, 7 (approximate metallic bell)
  const [real, imag] = makeArrays(HARMONICS);
  const partials: Array<[number, number]> = [
    [1, 1.0],
    [3, 0.6],
    [5, 0.35],
    [8, 0.2],
    [11, 0.12],
    [14, 0.07],
    [18, 0.04],
    [22, 0.02],
  ];
  for (const [h, amp] of partials) {
    if (h < HARMONICS) imag[h] = amp;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildFMMetallic(ctx: AudioContext): PeriodicWave {
  // Metallic timbre: dense inharmonic partials
  const [real, imag] = makeArrays(HARMONICS);
  const partials: Array<[number, number]> = [
    [1, 0.4],
    [2, 0.7],
    [4, 0.9],
    [5, 0.6],
    [7, 0.8],
    [9, 0.5],
    [11, 0.6],
    [13, 0.4],
    [15, 0.3],
    [17, 0.2],
    [19, 0.1],
    [23, 0.05],
  ];
  for (const [h, amp] of partials) {
    if (h < HARMONICS) imag[h] = amp;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildOrgan1(ctx: AudioContext): PeriodicWave {
  // Hammond 8' 4' drawbar: harmonics 1 and 2 equal
  const [real, imag] = makeArrays(HARMONICS);
  imag[1] = 1.0; // 8'
  imag[2] = 1.0; // 4'
  imag[3] = 0.4; // 2-2/3'
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildOrgan2(ctx: AudioContext): PeriodicWave {
  // Hammond full drawbars: 16' 8' 4' 2-2/3' 2' 1-3/5' 1-1/3' 1'
  const [real, imag] = makeArrays(HARMONICS);
  // Drawbar harmonics: 0.5, 1, 2, 3, 4, 5, 6, 8
  const drawbars: Array<[number, number]> = [
    [1, 0.8],  // 8' (fundamental)
    [2, 0.7],  // 4'
    [3, 0.5],  // 2-2/3'
    [4, 0.6],  // 2'
    [5, 0.4],  // 1-3/5'
    [6, 0.3],  // 1-1/3'
    [8, 0.5],  // 1'
  ];
  for (const [h, amp] of drawbars) {
    if (h < HARMONICS) imag[h] = amp;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildOrgan3(ctx: AudioContext): PeriodicWave {
  // Pipe organ flute: fundamental dominant, slight 3rd harmonic
  const [real, imag] = makeArrays(HARMONICS);
  imag[1] = 1.0;
  imag[2] = 0.2;
  imag[3] = 0.6;
  imag[4] = 0.1;
  imag[6] = 0.3;
  imag[8] = 0.2;
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

/**
 * Build a formant-boosted waveform.
 * Starts from a sawtooth then amplifies harmonics near the given formant
 * frequency ranges (expressed as harmonic-number ranges relative to 110 Hz
 * fundamental — kept general so the result is pitch-independent in character).
 */
function buildFormant(ctx: AudioContext, formants: number[][]): PeriodicWave {
  // formants: array of [centerHz, bandwidthHz, gain] triples
  // We treat fundamental = 110 Hz
  const fundamental = 110;
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    const freq = n * fundamental;
    const saw = 1 / n; // base sawtooth
    let boost = 1.0;
    for (const [center, bw, gain] of formants) {
      const dist = Math.abs(freq - center);
      if (dist < bw) {
        const shape = Math.cos((dist / bw) * (Math.PI / 2));
        boost += gain * shape;
      }
    }
    imag[n] = saw * boost;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildChoir(ctx: AudioContext): PeriodicWave {
  // Choir: multiple formant peaks across mid-range
  // A, E, and O vowels blended together
  const [real, imag] = makeArrays(HARMONICS);
  const fundamental = 110;
  const formants = [
    [730, 200, 2.5],    // A vowel F1
    [1090, 150, 1.8],   // A vowel F2
    [270, 200, 2.0],    // E vowel F1
    [2290, 300, 1.5],   // E vowel F2
    [570, 180, 2.0],    // O vowel F1
    [840, 200, 1.5],    // O vowel F2
  ];
  for (let n = 1; n < HARMONICS; n++) {
    const freq = n * fundamental;
    const saw = 1 / n;
    let boost = 1.0;
    for (const [center, bw, gain] of formants) {
      const dist = Math.abs(freq - center);
      if (dist < bw) {
        const shape = Math.cos((dist / bw) * (Math.PI / 2));
        boost += gain * shape;
      }
    }
    imag[n] = saw * boost;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildBrass(ctx: AudioContext): PeriodicWave {
  // Strong first 8 harmonics with gradual rolloff, slight boost on 2nd
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    // Bright rolloff — slower than 1/n
    imag[n] = Math.pow(0.88, n - 1);
  }
  // Boost 2nd harmonic (characteristic brass brightness)
  imag[2] *= 1.4;
  imag[3] *= 1.2;
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildString(ctx: AudioContext): PeriodicWave {
  // All harmonics with 1/n amplitude (ideal plucked string)
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    imag[n] = 1 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildPluck(ctx: AudioContext): PeriodicWave {
  // Plucked string: 1/n with faster rolloff for brighter, shorter decay character
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    imag[n] = Math.pow(1 / n, 0.7);
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildReed(ctx: AudioContext): PeriodicWave {
  // Reed / clarinet: odd harmonics only (closed cylinder acoustics)
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n += 2) {
    imag[n] = 1 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildNoiseBright(ctx: AudioContext): PeriodicWave {
  // Pseudo-noise: random phases, flat amplitude spectrum
  const [real, imag] = makeArrays(HARMONICS);
  // Use a deterministic PRNG (LCG) for reproducibility
  let seed = 0x12345678;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }
  for (let n = 1; n < HARMONICS; n++) {
    const phase = rand() * TWO_PI;
    imag[n] = Math.sin(phase) / n;
    real[n] = Math.cos(phase) / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildNoiseDark(ctx: AudioContext): PeriodicWave {
  // Dark pseudo-noise: random phases, amplitude falls off with frequency
  const [real, imag] = makeArrays(HARMONICS);
  let seed = 0xdeadbeef;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }
  for (let n = 1; n < HARMONICS; n++) {
    const phase = rand() * TWO_PI;
    const amp = 1 / (n * n); // 1/n^2 steep rolloff
    imag[n] = Math.sin(phase) * amp;
    real[n] = Math.cos(phase) * amp;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildDigital1(ctx: AudioContext): PeriodicWave {
  // Digital: quantized staircase waveform — harmonics at multiples of 4
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    // Quantized to 4 bits: round harmonic amplitudes to nearest 1/8 step
    const raw = 1 / n;
    imag[n] = Math.round(raw * 8) / 8;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildDigital2(ctx: AudioContext): PeriodicWave {
  // Digital 2: bit-crushed square — odd harmonics with quantization steps
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n += 2) {
    const raw = 1 / n;
    imag[n] = Math.round(raw * 4) / 4;
  }
  // Add aliasing artifacts (every 16th harmonic)
  for (let n = 16; n < HARMONICS; n += 16) {
    imag[n] = 0.3;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildDigital3(ctx: AudioContext): PeriodicWave {
  // Digital 3: wavetable-style with flat high-frequency shelf
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n++) {
    if (n <= 8) {
      imag[n] = 1 / n;
    } else {
      // Flat shelf — digital aliasing character
      imag[n] = 0.08 + (n % 3 === 0 ? 0.05 : 0);
    }
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildHarmonic1(ctx: AudioContext): PeriodicWave {
  // Harmonic series 1: all odd harmonics at equal amplitude
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 1; n < HARMONICS; n += 2) {
    imag[n] = 1.0;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildHarmonic2(ctx: AudioContext): PeriodicWave {
  // Harmonic series 2: even harmonics only (hollow, octave-displaced)
  const [real, imag] = makeArrays(HARMONICS);
  for (let n = 2; n < HARMONICS; n += 2) {
    imag[n] = 1 / (n / 2);
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function buildSub(ctx: AudioContext): PeriodicWave {
  // Sub: very strong fundamental, rapid rolloff, slight 2nd harmonic
  const [real, imag] = makeArrays(HARMONICS);
  imag[1] = 1.0;
  imag[2] = 0.25;
  imag[3] = 0.08;
  // All other harmonics very quiet
  for (let n = 4; n < HARMONICS; n++) {
    imag[n] = 0.02 / n;
  }
  normalise(real, imag);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a PeriodicWave for waveform `index`.
 *
 * Returns `null` for indices 0-3, which map to native OscillatorNode types
 * (sine, triangle, sawtooth, square) and need no PeriodicWave.
 */
export function createWaveform(ctx: AudioContext, index: number): PeriodicWave | null {
  switch (index) {
    // 0-3: native types — caller sets oscillator.type directly
    case 0:  return null; // sine
    case 1:  return null; // triangle
    case 2:  return null; // sawtooth
    case 3:  return null; // square

    case 4:  return buildPulse(ctx, 0.25);
    case 5:  return buildPulse(ctx, 0.10);
    case 6:  return buildHalfSaw(ctx);
    case 7:  return buildRamp(ctx);
    case 8:  return buildSupersaw(ctx);
    case 9:  return buildSyncSaw(ctx);
    case 10: return buildSyncSquare(ctx);
    case 11: return buildFMBell(ctx);
    case 12: return buildFMMetallic(ctx);
    case 13: return buildOrgan1(ctx);
    case 14: return buildOrgan2(ctx);
    case 15: return buildOrgan3(ctx);
    case 16: return buildFormant(ctx, [[730, 200, 2.5], [1090, 150, 1.8], [2440, 300, 1.2]]);   // A
    case 17: return buildFormant(ctx, [[270, 200, 2.0], [2290, 300, 1.5], [3010, 300, 1.0]]);   // E
    case 18: return buildFormant(ctx, [[570, 180, 2.0], [840, 200, 1.5], [2410, 300, 1.0]]);    // O
    case 19: return buildChoir(ctx);
    case 20: return buildBrass(ctx);
    case 21: return buildString(ctx);
    case 22: return buildPluck(ctx);
    case 23: return buildReed(ctx);
    case 24: return buildNoiseBright(ctx);
    case 25: return buildNoiseDark(ctx);
    case 26: return buildDigital1(ctx);
    case 27: return buildDigital2(ctx);
    case 28: return buildDigital3(ctx);
    case 29: return buildHarmonic1(ctx);
    case 30: return buildHarmonic2(ctx);
    case 31: return buildSub(ctx);

    default:
      return null;
  }
}
