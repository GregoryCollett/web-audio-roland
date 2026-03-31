import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { useKeyboard } from '../hooks/useKeyboard';
import { InitOverlay } from './shared/InitOverlay';
import { Transport } from './transport/Transport';
import { DrumHeader } from './drum/DrumHeader';
import { InstrumentSelector } from './drum/InstrumentSelector';
import { ParamKnobs } from './drum/ParamKnobs';
import { StepGrid } from './drum/StepGrid';
import { AccentRow } from './drum/AccentRow';
import { Playhead } from './drum/Playhead';
import { MasterSection } from './master/MasterSection';
import { BassSection } from './bass/BassSection';
import { MixerPanel } from './mixer/MixerPanel';

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
      <MixerPanel />
      <MasterSection />
    </>
  );
}
