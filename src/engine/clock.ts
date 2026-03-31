import { NUM_STEPS } from './types';

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_S = 0.1;

export class Clock {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private stepDuration = 0;
  private ctx: AudioContext | null = null;
  private onTick: (time: number, step: number) => void;

  constructor(onTick: (time: number, step: number) => void) {
    this.onTick = onTick;
  }

  start(ctx: AudioContext, bpm: number): void {
    this.ctx = ctx;
    this.currentStep = 0;
    this.stepDuration = 60 / bpm / 4;
    this.nextNoteTime = ctx.currentTime;
    this.intervalId = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.ctx = null;
  }

  setBpm(bpm: number): void {
    this.stepDuration = 60 / bpm / 4;
  }

  getStepDuration(): number {
    return this.stepDuration;
  }

  private schedule(): void {
    if (!this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + LOOKAHEAD_S) {
      this.onTick(this.nextNoteTime, this.currentStep);
      this.nextNoteTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % NUM_STEPS;
    }
  }
}
