import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { useKeyboard } from '../hooks/useKeyboard';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { DrumHeader } from './DrumHeader';
import { InstrumentSelector } from './InstrumentSelector';
import { ParamKnobs } from './ParamKnobs';
import { StepGrid } from './StepGrid';
import { AccentRow } from './AccentRow';
import { Playhead } from './Playhead';
import { MasterSection } from './MasterSection';
import { BassSection } from './BassSection';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const [selectedStep, setSelectedStep] = useState(0);
  const [bassSelectedStep, setBassSelectedStep] = useState(0);
  const [focusPanel, setFocusPanel] = useState<'drum' | 'bass'>('drum');

  useKeyboard({
    selectedInstrument,
    setSelectedInstrument,
    selectedStep,
    setSelectedStep,
    focusPanel,
    setFocusPanel,
    bassSelectedStep,
    setBassSelectedStep,
  });

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <Transport />
      <div
        className={`tr909${focusPanel === 'drum' ? ' tr909--focused' : ''}`}
        onClick={() => setFocusPanel('drum')}
      >
        <DrumHeader />
        <InstrumentSelector
          selected={selectedInstrument}
          onSelect={setSelectedInstrument}
        />
        <ParamKnobs instrument={selectedInstrument} />
        <StepGrid instrument={selectedInstrument} selectedStep={selectedStep} />
        <AccentRow selectedStep={selectedStep} />
        <Playhead />
      </div>
      <div onClick={() => setFocusPanel('bass')}>
        <BassSection
          selectedStep={bassSelectedStep}
          onSelectStep={setBassSelectedStep}
          focused={focusPanel === 'bass'}
        />
      </div>
      <MasterSection />
    </>
  );
}
