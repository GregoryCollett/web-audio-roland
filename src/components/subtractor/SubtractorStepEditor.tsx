import { useSubtractorPattern, subtractorEngine } from '../../hooks/useSubtractor';
import { midiToName } from '../../engine/subtractor/subtractorTypes';
import { Knob } from '../shared/Knob';

interface SubtractorStepEditorProps {
  selectedStep: number;
}

export function SubtractorStepEditor({ selectedStep }: SubtractorStepEditorProps) {
  const pattern = useSubtractorPattern();
  const step = pattern.steps[selectedStep];

  return (
    <div className="synth-step-editor">
      <div className="bass-step-editor__note">
        <button
          className="bass-step-editor__btn"
          onClick={() => subtractorEngine.setNote(selectedStep, step.note - 12)}
          title="Octave down"
        >
          -8va
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => subtractorEngine.setNote(selectedStep, step.note - 1)}
          title="Semitone down"
        >
          -
        </button>
        <span className="bass-step-editor__note-name">{midiToName(step.note)}</span>
        <button
          className="bass-step-editor__btn"
          onClick={() => subtractorEngine.setNote(selectedStep, step.note + 1)}
          title="Semitone up"
        >
          +
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => subtractorEngine.setNote(selectedStep, step.note + 12)}
          title="Octave up"
        >
          +8va
        </button>
      </div>

      <Knob
        label="Velocity"
        value={step.velocity}
        min={0}
        max={127}
        displayValue={`${step.velocity}`}
        onChange={(v) => subtractorEngine.setVelocity(selectedStep, Math.round(v))}
        size="small"
      />

      <div className="bass-step-editor__gates">
        <button
          className={`bass-step-editor__btn${step.gate === 'note' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => subtractorEngine.setGate(selectedStep, 'note')}
        >
          N
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'rest' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => subtractorEngine.setGate(selectedStep, 'rest')}
        >
          R
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'tie' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => subtractorEngine.setGate(selectedStep, 'tie')}
        >
          T
        </button>
      </div>

      <div className="bass-step-editor__toggles">
        <button
          className={`bass-step-editor__btn${step.slide ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => subtractorEngine.toggleSlide(selectedStep)}
        >
          SLD
        </button>
      </div>
    </div>
  );
}
