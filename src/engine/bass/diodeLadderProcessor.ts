// Inline the filter DSP — can't import in worklet scope
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
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' as const },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' as const },
    ];
  }

  constructor() {
    super();
    this.filter = new DiodeLadderFilter(sampleRate);
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

registerProcessor('diode-ladder', DiodeLadderProcessor);
