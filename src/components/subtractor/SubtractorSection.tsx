import { SubtractorHeader } from './SubtractorHeader';
import { SubtractorOscSection } from './SubtractorOscSection';
import { SubtractorFilterSection } from './SubtractorFilterSection';
import { SubtractorAmpSection } from './SubtractorAmpSection';
import { SubtractorModSection } from './SubtractorModSection';
import { SubtractorModMatrix } from './SubtractorModMatrix';
import { SubtractorStepGrid } from './SubtractorStepGrid';
import { SubtractorStepEditor } from './SubtractorStepEditor';
import { Playhead } from '../shared/Playhead';
import { CollapsibleSection } from '../shared/CollapsibleSection';

interface SubtractorSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function SubtractorSection({ selectedStep, onSelectStep, expanded, onToggle }: SubtractorSectionProps) {
  return (
    <div className="module-panel module--sub">
      <div className="module-panel__header" onClick={onToggle}>
        <span className={`module-panel__arrow${expanded ? ' module-panel__arrow--open' : ''}`}>▶</span>
        <span className="module-panel__title">GC-SUB</span>
        <span className="module-panel__subtitle">SUBTRACTOR</span>
      </div>
      {expanded && (
        <div className="module-panel__content">
          <SubtractorHeader />
          <CollapsibleSection title="Oscillators">
            <SubtractorOscSection />
          </CollapsibleSection>
          <CollapsibleSection title="Filters">
            <SubtractorFilterSection />
          </CollapsibleSection>
          <CollapsibleSection title="Amp &amp; Portamento">
            <SubtractorAmpSection />
          </CollapsibleSection>
          <CollapsibleSection title="LFOs &amp; Mod Envelope">
            <SubtractorModSection />
          </CollapsibleSection>
          <CollapsibleSection title="Mod Matrix" defaultOpen={false}>
            <SubtractorModMatrix />
          </CollapsibleSection>
          <SubtractorStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
          <Playhead />
          <SubtractorStepEditor selectedStep={selectedStep} />
        </div>
      )}
    </div>
  );
}
