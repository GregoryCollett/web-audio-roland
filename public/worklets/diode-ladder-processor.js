class DiodeLadderFilter {
  constructor(sr) {
    this.stage = [0, 0, 0, 0];
    this.sampleRate = sr;
    this.g = 0;
    this.resonance = 0;
  }
  setCutoff(freq) {
    const clamped = Math.max(20, Math.min(20000, freq));
    const wc = 2 * Math.PI * clamped / this.sampleRate;
    this.g = Math.tanh(wc / 2);
  }
  setResonance(res) {
    this.resonance = Math.max(0, Math.min(4, res));
  }
  process(input) {
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
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
    ];
  }
  constructor() { super(); this.filter = new DiodeLadderFilter(sampleRate); }
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

registerProcessor('diode-ladder', DiodeLadderProcessor);
