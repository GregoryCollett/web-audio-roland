import type { InstrumentId } from '../engine/types';
import { useDrumPattern, drumEngine } from '../hooks/useDrum';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

const DISPLAY_NAMES: Record<InstrumentId, string> = {
  kick: 'Bass Drum',
  snare: 'Snare',
  clap: 'Clap',
  rimshot: 'Rimshot',
  closedHat: 'Closed Hat',
  openHat: 'Open Hat',
  lowTom: 'Low Tom',
  midTom: 'Mid Tom',
  hiTom: 'Hi Tom',
  crash: 'Crash',
  ride: 'Ride',
};

interface StepGridProps {
  instrument: InstrumentId;
  selectedStep?: number;
}

export function StepGrid({ instrument, selectedStep }: StepGridProps) {
  const pattern = useDrumPattern();
  const steps = pattern.steps[instrument];

  return (
    <div className="step-grid">
      <div className="step-grid__label">Pattern — {DISPLAY_NAMES[instrument]}</div>
      <div className="step-grid__rows">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="step-grid__group">
            {group.map((step) => (
              <button
                key={step}
                className={`step-btn ${
                  steps[step] ? 'step-btn--active' : 'step-btn--inactive'
                }${step === selectedStep ? ' step-btn--selected' : ''}`}
                onClick={() => drumEngine.toggleStep(instrument, step)}
              >
                {step + 1}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
