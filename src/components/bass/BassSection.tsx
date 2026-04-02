import { BassHeader } from './BassHeader';
import { BassKnobs } from './BassKnobs';
import { BassStepGrid } from './BassStepGrid';
import { BassStepEditor } from './BassStepEditor';
import { Playhead } from '../shared/Playhead';

interface BassSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function BassSection({ selectedStep, onSelectStep, expanded, onToggle }: BassSectionProps) {
  return (
    <div className="module-panel module--303">
      <div className="module-panel__header" onClick={onToggle}>
        <span className={`module-panel__arrow${expanded ? ' module-panel__arrow--open' : ''}`}>▶</span>
        <span className="module-panel__title">GC-303</span>
        <span className="module-panel__subtitle">BASS LINE</span>
      </div>
      {expanded && (
        <div className="module-panel__content">
          <BassHeader />
          <BassKnobs />
          <BassStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
          <Playhead />
          <BassStepEditor selectedStep={selectedStep} />
        </div>
      )}
    </div>
  );
}
