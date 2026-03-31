import { useSynthPattern, synthEngine } from '../../hooks/useSynth';
import { midiToName, NUM_SYNTH_STEPS } from '../../engine/synth/synthTypes';

interface SynthStepGridProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
}

export function SynthStepGrid({ selectedStep, onSelectStep }: SynthStepGridProps) {
  const pattern = useSynthPattern();
  const groups: number[][] = [];

  for (let g = 0; g < NUM_SYNTH_STEPS / 4; g++) {
    groups.push([g * 4, g * 4 + 1, g * 4 + 2, g * 4 + 3]);
  }

  return (
    <div className="synth-step-grid">
      <div className="synth-step-grid__rows">
        {groups.map((group, gi) => (
          <div key={gi} className="synth-step-grid__group">
            {group.map((stepIndex) => {
              const step = pattern.steps[stepIndex];
              const gateClass =
                step.gate === 'note'
                  ? 'bass-step--note'
                  : step.gate === 'tie'
                  ? 'bass-step--tie'
                  : 'bass-step--rest';
              const selectedClass = stepIndex === selectedStep ? ' bass-step--selected' : '';

              return (
                <button
                  key={stepIndex}
                  className={`bass-step ${gateClass}${selectedClass}`}
                  onClick={() => {
                    onSelectStep(stepIndex);
                    if (step.gate === 'rest') {
                      synthEngine.setGate(stepIndex, 'note');
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onSelectStep(stepIndex);
                  }}
                >
                  <span className="bass-step__note">
                    {step.gate !== 'rest' ? midiToName(step.note) : '-'}
                  </span>
                  <span className="bass-step__indicators">
                    {step.accent && <span className="bass-step__accent">A</span>}
                    {step.slide && <span className="bass-step__slide">S</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
