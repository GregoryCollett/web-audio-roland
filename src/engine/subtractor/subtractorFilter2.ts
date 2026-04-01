// Inline the filter DSP — can't import in worklet scope
export class ButterworthLP {
  private sampleRate: number;
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private resonance = 0;
  private cutoff = 1000;

  // Delay state
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.setCutoff(1000);
  }

  setCutoff(freq: number): void {
    const clamped = Math.max(20, Math.min(20000, freq));
    this.cutoff = clamped;
    this.computeCoefficients();
  }

  setResonance(res: number): void {
    this.resonance = Math.max(0, Math.min(2, res));
    this.computeCoefficients();
  }

  private computeCoefficients(): void {
    const Q = 0.707 + this.resonance * 5;
    const wc = 2 * Math.PI * this.cutoff / this.sampleRate;
    const cosw = Math.cos(wc);
    const sinw = Math.sin(wc);
    const alpha = sinw / (2 * Q);
    const a0 = 1 + alpha;
    this.b0 = (1 - cosw) / 2 / a0;
    this.b1 = (1 - cosw) / a0;
    this.b2 = this.b0;
    this.a1 = -2 * cosw / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(input: number): number {
    const y = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2
            - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

class ButterworthProcessor extends AudioWorkletProcessor {
  private filter: ButterworthLP;

  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' as const },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'a-rate' as const },
    ];
  }

  constructor() {
    super();
    this.filter = new ButterworthLP(sampleRate);
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

registerProcessor('subtractor-filter2', ButterworthProcessor);
