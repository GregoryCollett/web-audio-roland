// Minimal Web Worker that provides a reliable setInterval timer.
// Runs on a separate thread so main-thread activity (React renders,
// DOM event handlers) cannot delay it.

let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, intervalMs } = e.data;

  if (type === 'start') {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, intervalMs);
  } else if (type === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
