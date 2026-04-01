class IR3109Filter {
  constructor(sr) {
    this.stage = [0, 0, 0, 0];
    this.sampleRate = sr;
    this.g = 0;
    this.resonance = 0;
  }
  setCutoff(freq) {
    const clamped = Math.max(20, Math.min(20000, freq));
    const wc = 2 * Math.PI * clamped / this.sampleRate;
    this.g = wc / (1 + wc);
  }
  setResonance(res) {
    this.resonance = Math.max(0, Math.min(4, res));
  }
  process(input) {
    const x0 = input * (1 + this.resonance * 0.15) - this.resonance * this.stage[3];
    let x = x0;
    for (let i = 0; i < 4; i++) {
      const sc = x / (1 + Math.abs(x));
      const scStage = this.stage[i] / (1 + Math.abs(this.stage[i]));
      x = this.stage[i] + this.g * (sc - scStage);
      this.stage[i] = x;
    }
    return x;
  }
}

class IR3109Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
    ];
  }
  constructor() { super(); this.filter = new IR3109Filter(sampleRate); }
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

registerProcessor('ir3109', IR3109Processor);
