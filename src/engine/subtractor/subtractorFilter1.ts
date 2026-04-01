// Inline the filter DSP — can't import in worklet scope
export class SVFFilter {
  private sampleRate: number;
  private f = 0;
  private q = 1;
  private mode = 0;

  // Stage 1 state
  private low1 = 0;
  private band1 = 0;

  // Stage 2 state
  private low2 = 0;
  private band2 = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  setCutoff(freq: number): void {
    const clamped = Math.max(20, Math.min(20000, freq));
    this.f = 2 * Math.sin(Math.PI * clamped / this.sampleRate);
  }

  setResonance(res: number): void {
    const clamped = Math.max(0, Math.min(4, res));
    this.q = 1 / (1 + clamped);
  }

  setMode(mode: number): void {
    this.mode = Math.round(Math.max(0, Math.min(4, mode)));
  }

  process(input: number): number {
    const { f, q } = this;

    // Stage 1
    const high1 = input - this.low1 - q * this.band1;
    this.band1 = this.band1 + f * high1;
    this.low1 = this.low1 + f * this.band1;
    const notch1 = high1 + this.low1;

    // Mode 0: LP12
    if (this.mode === 0) return this.low1;
    // Mode 2: HP12
    if (this.mode === 2) return high1;
    // Mode 3: BP12
    if (this.mode === 3) return this.band1;
    // Mode 4: Notch
    if (this.mode === 4) return notch1;

    // Mode 1: LP24 — feed stage1.low into stage2
    const stage2Input = this.low1;
    const high2 = stage2Input - this.low2 - q * this.band2;
    this.band2 = this.band2 + f * high2;
    this.low2 = this.low2 + f * this.band2;

    return this.low2;
  }
}

class SVFProcessor extends AudioWorkletProcessor {
  private filter: SVFFilter;

  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' as const },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' as const },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' as const },
    ];
  }

  constructor() {
    super();
    this.filter = new SVFFilter(sampleRate);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;

    const freqParam = parameters.frequency;
    const resParam = parameters.resonance;
    const modeParam = parameters.mode;

    this.filter.setMode(modeParam[0]);

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

registerProcessor('subtractor-filter1', SVFProcessor);
