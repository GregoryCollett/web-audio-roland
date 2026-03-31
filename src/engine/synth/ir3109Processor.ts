// Inline the filter DSP — can't import in worklet scope
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
    this.g = wc / (1 + wc);
  }

  setResonance(res: number): void {
    this.resonance = Math.max(0, Math.min(4, res));
  }

  process(input: number): number {
    // Bass compensation: boost input by resonance factor, subtract feedback
    const x0 = input * (1 + this.resonance * 0.15) - this.resonance * this.stage[3];
    let x = x0;
    for (let i = 0; i < 4; i++) {
      // Soft clip: x / (1 + |x|)
      const tanh_x = x / (1 + Math.abs(x));
      const tanh_s = this.stage[i] / (1 + Math.abs(this.stage[i]));
      x = this.stage[i] + this.g * (tanh_x - tanh_s);
      this.stage[i] = x;
    }
    return x;
  }

  reset(): void {
    this.stage = [0, 0, 0, 0];
  }
}

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
