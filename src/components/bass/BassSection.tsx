import { BassHeader } from './BassHeader';
import { BassKnobs } from './BassKnobs';
import { BassStepGrid } from './BassStepGrid';
import { BassStepEditor } from './BassStepEditor';
import { Playhead } from '../shared/Playhead';

interface BassSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  focused?: boolean;
}

export function BassSection({ selectedStep, onSelectStep, focused = false }: BassSectionProps) {
  return (
    <div className={`bass-section${focused ? ' bass-section--focused' : ''}`}>
      <BassHeader />
      <BassKnobs />
      <BassStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
      <BassStepEditor selectedStep={selectedStep} />
      <Playhead />
    </div>
  );
}
