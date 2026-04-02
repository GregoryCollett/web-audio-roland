import { SynthHeader } from './SynthHeader';
import { SynthOscSection } from './SynthOscSection';
import { SynthFilterSection } from './SynthFilterSection';
import { SynthAmpSection } from './SynthAmpSection';
import { SynthLFOSection } from './SynthLFOSection';
import { SynthStepGrid } from './SynthStepGrid';
import { SynthStepEditor } from './SynthStepEditor';
import { Playhead } from '../shared/Playhead';
import { CollapsibleSection } from '../shared/CollapsibleSection';

interface SynthSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function SynthSection({ selectedStep, onSelectStep, expanded, onToggle }: SynthSectionProps) {
  return (
    <div className="module-panel module--sh2">
      <div className="module-panel__header" onClick={onToggle}>
        <span className={`module-panel__arrow${expanded ? ' module-panel__arrow--open' : ''}`}>▶</span>
        <span className="module-panel__title">GC-SH2</span>
        <span className="module-panel__subtitle">SYNTHESIZER</span>
      </div>
      {expanded && (
        <div className="module-panel__content">
          <SynthHeader />
          <CollapsibleSection title="Oscillators">
            <SynthOscSection />
          </CollapsibleSection>
          <CollapsibleSection title="Filter">
            <SynthFilterSection />
          </CollapsibleSection>
          <CollapsibleSection title="Amp">
            <SynthAmpSection />
          </CollapsibleSection>
          <CollapsibleSection title="LFO">
            <SynthLFOSection />
          </CollapsibleSection>
          <SynthStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
          <Playhead />
          <SynthStepEditor selectedStep={selectedStep} />
        </div>
      )}
    </div>
  );
}
