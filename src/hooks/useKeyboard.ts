import { useEffect, useRef } from 'react';
import type { InstrumentId } from '../engine/types';
import { INSTRUMENT_IDS, NUM_STEPS } from '../engine/types';
import { drumEngine } from './useDrum';
import { bassEngine } from './useBass';
import { synthEngine } from './useSynth';
import { subtractorEngine } from './useSubtractor';
import { transport } from './useTransport';
import { NUM_BASS_STEPS } from '../engine/bass/bassTypes';
import { NUM_SYNTH_STEPS } from '../engine/synth/synthTypes';
import { NUM_SUBTRACTOR_STEPS } from '../engine/subtractor/subtractorTypes';

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
  focusPanel: 'drum' | 'bass' | 'synth' | 'subtractor';
  setFocusPanel: (panel: 'drum' | 'bass' | 'synth' | 'subtractor') => void;
  bassSelectedStep: number;
  setBassSelectedStep: (step: number) => void;
  synthSelectedStep: number;
  setSynthSelectedStep: (step: number) => void;
  subtractorSelectedStep: number;
  setSubtractorSelectedStep: (step: number) => void;
}

export function useKeyboard(state: KeyboardState): void {
  // Use refs so the listener closure always sees current values
  // without needing to re-register on every state change
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track whether V key is held (velocity modifier for subtractor)
  const vHeldRef = useRef(false);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        vHeldRef.current = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const {
        selectedInstrument,
        setSelectedInstrument,
        selectedStep,
        setSelectedStep,
        focusPanel,
        setFocusPanel,
        bassSelectedStep,
        setBassSelectedStep,
        synthSelectedStep,
        setSynthSelectedStep,
        subtractorSelectedStep,
        setSubtractorSelectedStep,
      } = stateRef.current;
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Let browser handle all meta/ctrl shortcuts except our explicit ones (arrows)
      if (metaOrCtrl && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return;
      }

      // --- Tab: cycle focus panel drum → bass → synth → subtractor → drum ---
      if (e.key === 'Tab') {
        e.preventDefault();
        if (focusPanel === 'drum') setFocusPanel('bass');
        else if (focusPanel === 'bass') setFocusPanel('synth');
        else if (focusPanel === 'synth') setFocusPanel('subtractor');
        else setFocusPanel('drum');
        return;
      }

      // --- Play/Stop: Space (always active regardless of panel) ---
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const snap = transport.getSnapshot();
        if (snap.playing) {
          transport.stop();
        } else {
          transport.play();
        }
        return;
      }

      // --- Shuffle: Cmd+Up / Cmd+Down (always active) ---
      if (metaOrCtrl && e.key === 'ArrowUp') {
        e.preventDefault();
        const snap = transport.getSnapshot();
        transport.setShuffle(Math.min(1, snap.shuffle + 0.05));
        return;
      }
      if (metaOrCtrl && e.key === 'ArrowDown') {
        e.preventDefault();
        const snap = transport.getSnapshot();
        transport.setShuffle(Math.max(0, snap.shuffle - 0.05));
        return;
      }

      // ============================================================
      // Bass panel keys
      // ============================================================
      if (focusPanel === 'bass') {
        // Left/Right: bass step navigation
        if (!metaOrCtrl && e.key === 'ArrowLeft') {
          e.preventDefault();
          setBassSelectedStep((bassSelectedStep - 1 + NUM_BASS_STEPS) % NUM_BASS_STEPS);
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowRight') {
          e.preventDefault();
          setBassSelectedStep((bassSelectedStep + 1) % NUM_BASS_STEPS);
          return;
        }

        // Up/Down: pitch semitone on current bass step
        if (!metaOrCtrl && e.key === 'ArrowUp') {
          e.preventDefault();
          const snap = bassEngine.getSnapshot();
          const currentNote = snap.pattern.steps[bassSelectedStep].note;
          bassEngine.setNote(bassSelectedStep, currentNote + 1);
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowDown') {
          e.preventDefault();
          const snap = bassEngine.getSnapshot();
          const currentNote = snap.pattern.steps[bassSelectedStep].note;
          bassEngine.setNote(bassSelectedStep, currentNote - 1);
          return;
        }

        // s/S: toggle slide
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          bassEngine.toggleSlide(bassSelectedStep);
          return;
        }

        // a/A: toggle accent
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          bassEngine.toggleAccent(bassSelectedStep);
          return;
        }

        // n/N: set gate to note
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          bassEngine.setGate(bassSelectedStep, 'note');
          return;
        }

        // r/R: set gate to rest
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          bassEngine.setGate(bassSelectedStep, 'rest');
          return;
        }

        // t/T: set gate to tie
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          bassEngine.setGate(bassSelectedStep, 'tie');
          return;
        }

        return;
      }

      // ============================================================
      // Synth panel keys
      // ============================================================
      if (focusPanel === 'synth') {
        // Left/Right: synth step navigation
        if (!metaOrCtrl && e.key === 'ArrowLeft') {
          e.preventDefault();
          setSynthSelectedStep((synthSelectedStep - 1 + NUM_SYNTH_STEPS) % NUM_SYNTH_STEPS);
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowRight') {
          e.preventDefault();
          setSynthSelectedStep((synthSelectedStep + 1) % NUM_SYNTH_STEPS);
          return;
        }

        // Up/Down: pitch semitone on current synth step
        if (!metaOrCtrl && e.key === 'ArrowUp') {
          e.preventDefault();
          const snap = synthEngine.getSnapshot();
          const currentNote = snap.pattern.steps[synthSelectedStep].note;
          synthEngine.setNote(synthSelectedStep, currentNote + 1);
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowDown') {
          e.preventDefault();
          const snap = synthEngine.getSnapshot();
          const currentNote = snap.pattern.steps[synthSelectedStep].note;
          synthEngine.setNote(synthSelectedStep, currentNote - 1);
          return;
        }

        // s/S: toggle slide
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          synthEngine.toggleSlide(synthSelectedStep);
          return;
        }

        // a/A: toggle accent
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          synthEngine.toggleAccent(synthSelectedStep);
          return;
        }

        // n/N: set gate to note
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          synthEngine.setGate(synthSelectedStep, 'note');
          return;
        }

        // r/R: set gate to rest
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          synthEngine.setGate(synthSelectedStep, 'rest');
          return;
        }

        // t/T: set gate to tie
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          synthEngine.setGate(synthSelectedStep, 'tie');
          return;
        }

        return;
      }

      // ============================================================
      // Subtractor panel keys
      // ============================================================
      if (focusPanel === 'subtractor') {
        // Track V key held state
        if (e.key === 'v' || e.key === 'V') {
          vHeldRef.current = true;
          e.preventDefault();
          return;
        }

        // Left/Right: step navigation
        if (!metaOrCtrl && e.key === 'ArrowLeft') {
          e.preventDefault();
          setSubtractorSelectedStep((subtractorSelectedStep - 1 + NUM_SUBTRACTOR_STEPS) % NUM_SUBTRACTOR_STEPS);
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowRight') {
          e.preventDefault();
          setSubtractorSelectedStep((subtractorSelectedStep + 1) % NUM_SUBTRACTOR_STEPS);
          return;
        }

        // Up/Down: pitch semitone (or velocity if V held)
        if (!metaOrCtrl && e.key === 'ArrowUp') {
          e.preventDefault();
          if (vHeldRef.current) {
            const snap = subtractorEngine.getSnapshot();
            const currentVelocity = snap.pattern.steps[subtractorSelectedStep].velocity;
            subtractorEngine.setVelocity(subtractorSelectedStep, Math.min(127, currentVelocity + 8));
          } else {
            const snap = subtractorEngine.getSnapshot();
            const currentNote = snap.pattern.steps[subtractorSelectedStep].note;
            subtractorEngine.setNote(subtractorSelectedStep, currentNote + 1);
          }
          return;
        }
        if (!metaOrCtrl && e.key === 'ArrowDown') {
          e.preventDefault();
          if (vHeldRef.current) {
            const snap = subtractorEngine.getSnapshot();
            const currentVelocity = snap.pattern.steps[subtractorSelectedStep].velocity;
            subtractorEngine.setVelocity(subtractorSelectedStep, Math.max(0, currentVelocity - 8));
          } else {
            const snap = subtractorEngine.getSnapshot();
            const currentNote = snap.pattern.steps[subtractorSelectedStep].note;
            subtractorEngine.setNote(subtractorSelectedStep, currentNote - 1);
          }
          return;
        }

        // s/S: toggle slide
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          subtractorEngine.toggleSlide(subtractorSelectedStep);
          return;
        }

        // n/N: set gate to note
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          subtractorEngine.setGate(subtractorSelectedStep, 'note');
          return;
        }

        // r/R: set gate to rest
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          subtractorEngine.setGate(subtractorSelectedStep, 'rest');
          return;
        }

        // t/T: set gate to tie
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          subtractorEngine.setGate(subtractorSelectedStep, 'tie');
          return;
        }

        return;
      }

      // ============================================================
      // Drum panel keys
      // ============================================================

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
        const snap = transport.getSnapshot();
        transport.setBpm(snap.bpm + 1);
        return;
      }
      if (!metaOrCtrl && e.key === 'ArrowDown') {
        e.preventDefault();
        const snap = transport.getSnapshot();
        transport.setBpm(snap.bpm - 1);
        return;
      }

      // --- Toggle step: P ---
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        drumEngine.toggleStep(selectedInstrument, selectedStep);
        return;
      }

      // --- Toggle accent: A ---
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        drumEngine.toggleAccent(selectedStep);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Single registration, never re-registers
}
