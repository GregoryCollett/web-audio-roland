import { SubtractorHeader } from './SubtractorHeader';
import { SubtractorOscSection } from './SubtractorOscSection';
import { SubtractorFilterSection } from './SubtractorFilterSection';
import { SubtractorAmpSection } from './SubtractorAmpSection';
import { SubtractorModSection } from './SubtractorModSection';
import { SubtractorModMatrix } from './SubtractorModMatrix';
import { SubtractorStepGrid } from './SubtractorStepGrid';
import { SubtractorStepEditor } from './SubtractorStepEditor';
import { Playhead } from '../shared/Playhead';

interface SubtractorSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  focused?: boolean;
}

export function SubtractorSection({ selectedStep, onSelectStep, focused }: SubtractorSectionProps) {
  return (
    <div className={`subtractor-section${focused ? ' subtractor-section--focused' : ''}`}>
      <SubtractorHeader />
      <SubtractorOscSection />
      <SubtractorFilterSection />
      <SubtractorAmpSection />
      <SubtractorModSection />
      <SubtractorModMatrix />
      <SubtractorStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
      <Playhead />
      <SubtractorStepEditor selectedStep={selectedStep} />
    </div>
  );
}
