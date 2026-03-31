export class DiodeLadderFilter {
  private stage = [0, 0, 0, 0];
  private sampleRate: number;
  private cutoff = 1000;
  private resonance = 0;
  private g = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.updateCoefficients();
  }

  setCutoff(freq: number): void {
    this.cutoff = Math.max(20, Math.min(20000, freq));
    this.updateCoefficients();
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

  reset(): void { this.stage = [0, 0, 0, 0]; }

  private updateCoefficients(): void {
    const wc = 2 * Math.PI * this.cutoff / this.sampleRate;
    this.g = Math.tanh(wc / 2);
  }
}
