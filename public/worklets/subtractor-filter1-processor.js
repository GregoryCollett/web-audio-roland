class SVFFilter {
  constructor(sr) {
    this.sampleRate = sr;
    this.f = 0;
    this.q = 1;
    this.mode = 0;
    this.low1 = 0;
    this.band1 = 0;
    this.low2 = 0;
    this.band2 = 0;
  }
  setCutoff(freq) {
    const clamped = Math.max(20, Math.min(20000, freq));
    this.f = 2 * Math.sin(Math.PI * clamped / this.sampleRate);
  }
  setResonance(res) {
    const clamped = Math.max(0, Math.min(4, res));
    this.q = 1 / (1 + clamped);
  }
  setMode(mode) {
    this.mode = Math.round(Math.max(0, Math.min(4, mode)));
  }
  process(input) {
    const { f, q } = this;

    // Stage 1
    const high1 = input - this.low1 - q * this.band1;
    this.band1 = this.band1 + f * high1;
    this.low1 = this.low1 + f * this.band1;
    const notch1 = high1 + this.low1;

    if (this.mode === 0) return this.low1;   // LP12
    if (this.mode === 2) return high1;        // HP12
    if (this.mode === 3) return this.band1;   // BP12
    if (this.mode === 4) return notch1;       // Notch

    // Mode 1: LP24 — feed stage1.low into stage2
    const stage2Input = this.low1;
    const high2 = stage2Input - this.low2 - q * this.band2;
    this.band2 = this.band2 + f * high2;
    this.low2 = this.low2 + f * this.band2;
    return this.low2;
  }
}

class SVFProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' },
    ];
  }
  constructor() { super(); this.filter = new SVFFilter(sampleRate); }
  process(inputs, outputs, parameters) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;
    const freqParam = parameters.frequency;
    const resParam = parameters.resonance;
    const modeParam = parameters.mode;
    this.filter.setMode(modeParam[0]);
    for (let i = 0; i < output.length; i++) {
      this.filter.setCutoff(freqParam.length > 1 ? freqParam[i] : freqParam[0]);
      this.filter.setResonance(resParam.length > 1 ? resParam[i] : resParam[0]);
      output[i] = this.filter.process(input[i]);
    }
    return true;
  }
}

registerProcessor('subtractor-filter1', SVFProcessor);
