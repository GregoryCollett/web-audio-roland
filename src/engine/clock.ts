import { NUM_STEPS } from './types';

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_S = 0.1;

function createWorker(): Worker | null {
  try {
    return new Worker(
      new URL('./clockWorker.ts', import.meta.url),
      { type: 'module' },
    );
  } catch {
    // Worker not available (SSR, test env, etc.) — will fall back to setInterval
    return null;
  }
}

export class Clock {
  private worker: Worker | null = null;
  private fallbackIntervalId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private stepDuration = 0;
  private shuffle = 0;
  private ctx: AudioContext | null = null;
  private onTick: (time: number, step: number) => void;

  constructor(onTick: (time: number, step: number) => void) {
    this.onTick = onTick;
    this.worker = createWorker();
    if (this.worker) {
      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'tick') {
          this.schedule();
        }
      };
    }
  }

  start(ctx: AudioContext, bpm: number, shuffle = 0): void {
    this.ctx = ctx;
    this.currentStep = 0;
    this.stepDuration = 60 / bpm / 4;
    this.shuffle = shuffle;
    this.nextNoteTime = ctx.currentTime;

    if (this.worker) {
      this.worker.postMessage({ type: 'start', intervalMs: SCHEDULER_INTERVAL_MS });
    } else {
      // Fallback for environments without Worker support
      this.fallbackIntervalId = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    }
  }

  stop(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
    if (this.fallbackIntervalId !== null) {
      clearInterval(this.fallbackIntervalId);
      this.fallbackIntervalId = null;
    }
    this.ctx = null;
  }

  setBpm(bpm: number): void {
    this.stepDuration = 60 / bpm / 4;
  }

  setShuffle(shuffle: number): void {
    this.shuffle = shuffle;
  }

  getStepDuration(): number {
    return this.stepDuration;
  }

  private schedule(): void {
    if (!this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + LOOKAHEAD_S) {
      const shuffleOffset = (this.currentStep % 2 === 1)
        ? this.stepDuration * this.shuffle * (2 / 3)
        : 0;

      this.onTick(this.nextNoteTime + shuffleOffset, this.currentStep);
      this.nextNoteTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % NUM_STEPS;
    }
  }
}
