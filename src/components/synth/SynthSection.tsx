import { SynthHeader } from './SynthHeader';
import { SynthOscSection } from './SynthOscSection';
import { SynthFilterSection } from './SynthFilterSection';
import { SynthAmpSection } from './SynthAmpSection';
import { SynthLFOSection } from './SynthLFOSection';
import { SynthStepGrid } from './SynthStepGrid';
import { SynthStepEditor } from './SynthStepEditor';

interface SynthSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  focused?: boolean;
}

export function SynthSection({ selectedStep, onSelectStep, focused }: SynthSectionProps) {
  return (
    <div className={`synth-section${focused ? ' synth-section--focused' : ''}`}>
      <SynthHeader />
      <SynthOscSection />
      <SynthFilterSection />
      <SynthAmpSection />
      <SynthLFOSection />
      <SynthStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
      <SynthStepEditor selectedStep={selectedStep} />
    </div>
  );
}
