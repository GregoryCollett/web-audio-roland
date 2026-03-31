import { useBassPattern, bassEngine } from '../../hooks/useBass';
import { midiToName } from '../../engine/bass/bassTypes';

interface BassStepEditorProps {
  selectedStep: number;
}

export function BassStepEditor({ selectedStep }: BassStepEditorProps) {
  const pattern = useBassPattern();
  const step = pattern.steps[selectedStep];

  return (
    <div className="bass-step-editor">
      <div className="bass-step-editor__note">
        <button
          className="bass-step-editor__btn"
          onClick={() => bassEngine.setNote(selectedStep, step.note - 12)}
          title="Octave down"
        >
          -8va
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => bassEngine.setNote(selectedStep, step.note - 1)}
          title="Semitone down"
        >
          -
        </button>
        <span className="bass-step-editor__note-name">{midiToName(step.note)}</span>
        <button
          className="bass-step-editor__btn"
          onClick={() => bassEngine.setNote(selectedStep, step.note + 1)}
          title="Semitone up"
        >
          +
        </button>
        <button
          className="bass-step-editor__btn"
          onClick={() => bassEngine.setNote(selectedStep, step.note + 12)}
          title="Octave up"
        >
          +8va
        </button>
      </div>

      <div className="bass-step-editor__gates">
        <button
          className={`bass-step-editor__btn${step.gate === 'note' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => bassEngine.setGate(selectedStep, 'note')}
        >
          N
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'rest' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => bassEngine.setGate(selectedStep, 'rest')}
        >
          R
        </button>
        <button
          className={`bass-step-editor__btn${step.gate === 'tie' ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => bassEngine.setGate(selectedStep, 'tie')}
        >
          T
        </button>
      </div>

      <div className="bass-step-editor__toggles">
        <button
          className={`bass-step-editor__btn${step.accent ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => bassEngine.toggleAccent(selectedStep)}
        >
          ACC
        </button>
        <button
          className={`bass-step-editor__btn${step.slide ? ' bass-step-editor__btn--active' : ''}`}
          onClick={() => bassEngine.toggleSlide(selectedStep)}
        >
          SLD
        </button>
      </div>
    </div>
  );
}
