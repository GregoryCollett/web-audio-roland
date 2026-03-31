import { useEffect, useRef } from 'react';
import type { InstrumentId } from '../engine/types';
import { INSTRUMENT_IDS, NUM_STEPS } from '../engine/types';
import { engine } from './useEngine';

// Key → instrument index mapping
// 1-9 = first 9 instruments, 0 = 10th, - = 11th
const KEY_TO_INSTRUMENT_INDEX: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
  '6': 5, '7': 6, '8': 7, '9': 8, '0': 9, '-': 10,
};

interface KeyboardState {
  selectedInstrument: InstrumentId;
  setSelectedInstrument: (id: InstrumentId) => void;
  selectedStep: number;
  setSelectedStep: (step: number) => void;
}

export function useKeyboard(state: KeyboardState): void {
  // Use refs so the listener closure always sees current values
  // without needing to re-register on every state change
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const { selectedInstrument, setSelectedInstrument, selectedStep, setSelectedStep } = stateRef.current;
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // --- Instrument selection: 1-9, 0, - ---
      if (!metaOrCtrl && e.key in KEY_TO_INSTRUMENT_INDEX) {
        e.preventDefault();
        const index = KEY_TO_INSTRUMENT_INDEX[e.key];
        if (index < INSTRUMENT_IDS.length) {
          setSelectedInstrument(INSTRUMENT_IDS[index]);
        }
        return;
      }

      // --- Step navigation: Left/Right ---
      if (!metaOrCtrl && e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedStep((selectedStep - 1 + NUM_STEPS) % NUM_STEPS);
        return;
      }
      if (!metaOrCtrl && e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedStep((selectedStep + 1) % NUM_STEPS);
        return;
      }

      // --- BPM: Up/Down ---
      if (!metaOrCtrl && e.key === 'ArrowUp') {
        e.preventDefault();
        const snap = engine.getSnapshot();
        engine.setBpm(snap.transport.bpm + 1);
        return;
      }
      if (!metaOrCtrl && e.key === 'ArrowDown') {
        e.preventDefault();
        const snap = engine.getSnapshot();
        engine.setBpm(snap.transport.bpm - 1);
        return;
      }

      // --- Shuffle: Cmd+Up / Cmd+Down ---
      if (metaOrCtrl && e.key === 'ArrowUp') {
        e.preventDefault();
        const snap = engine.getSnapshot();
        engine.setShuffle(Math.min(1, snap.transport.shuffle + 0.05));
        return;
      }
      if (metaOrCtrl && e.key === 'ArrowDown') {
        e.preventDefault();
        const snap = engine.getSnapshot();
        engine.setShuffle(Math.max(0, snap.transport.shuffle - 0.05));
        return;
      }

      // --- Play/Stop: Space ---
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const snap = engine.getSnapshot();
        if (snap.transport.playing) {
          engine.stop();
        } else {
          engine.play();
        }
        return;
      }

      // --- Toggle step: P ---
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        engine.toggleStep(selectedInstrument, selectedStep);
        return;
      }

      // --- Toggle accent: A ---
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        engine.toggleAccent(selectedStep);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Single registration, never re-registers
}
