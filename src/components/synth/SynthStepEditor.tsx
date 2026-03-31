import { useSynthPattern, synthEngine } from '../../hooks/useSynth';
import { midiToName } from '../../engine/synth/synthTypes';

interface SynthStepEditorProps {
  selectedStep: number;
}

export function SynthStepEditor({ selectedStep }: SynthStepEditorProps) {
  const pattern = useSynthPattern();
  const step = pattern.steps[selectedStep];

  return (
    <div className="synth-step-editor">
      <div className="bass-step-editor__note">
        <button
          className="bass-step-editor__btn"
          onClick={() => synthEngine.setNote(selectedStep, step.note - 12)}
          title="Octave down"
        >
          -8va
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => synthEngine.setNote(selectedStep, step.note - 1)}
          title="Semitone down"
        >
          -
        </button>
        <span className="bass-step-editor__note-name">{midiToName(step.note)}</span>
        <button
          className="bass-step-editor__btn"
          onClick={() => synthEngine.setNote(selectedStep, step.note + 1)}
          title="Semitone up"
        >
          +
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => synthEngine.setNote(selectedStep, step.note + 12)}
          title="Octave up"
        >
          +8va
        </button>
      </div>

      <div className="bass-step-editor__gates">
        <button
          className={`bass-step-editor__btn${step.gate === 'note' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => synthEngine.setGate(selectedStep, 'note')}
        >
          N
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'rest' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => synthEngine.setGate(selectedStep, 'rest')}
        >
          R
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'tie' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => synthEngine.setGate(selectedStep, 'tie')}
        >
          T
        </button>
      </div>

      <div className="bass-step-editor__toggles">
        <button
          className={`bass-step-editor__btn${step.accent ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => synthEngine.toggleAccent(selectedStep)}
        >
          ACC
        </button>
        <button
          className={`bass-step-editor__btn${step.slide ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => synthEngine.toggleSlide(selectedStep)}
        >
          SLD
        </button>
      </div>
    </div>
  );
}
