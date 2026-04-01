class ButterworthLP {
  constructor(sr) {
    this.sampleRate = sr;
    this.b0 = 0; this.b1 = 0; this.b2 = 0;
    this.a1 = 0; this.a2 = 0;
    this.resonance = 0;
    this.cutoff = 1000;
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    this.computeCoefficients();
  }
  setCutoff(freq) {
    this.cutoff = Math.max(20, Math.min(20000, freq));
    this.computeCoefficients();
  }
  setResonance(res) {
    this.resonance = Math.max(0, Math.min(2, res));
    this.computeCoefficients();
  }
  computeCoefficients() {
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
  process(input) {
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
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'a-rate' },
    ];
  }
  constructor() { super(); this.filter = new ButterworthLP(sampleRate); }
  process(inputs, outputs, parameters) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;
    const freqParam = parameters.frequency;
    const resParam = parameters.resonance;
    for (let i = 0; i < output.length; i++) {
      this.filter.setCutoff(freqParam.length > 1 ? freqParam[i] : freqParam[0]);
      this.filter.setResonance(resParam.length > 1 ? resParam[i] : resParam[0]);
      output[i] = this.filter.process(input[i]);
    }
    return true;
  }
}

registerProcessor('subtractor-filter2', ButterworthProcessor);
