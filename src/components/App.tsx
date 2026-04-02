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
import { Playhead } from './shared/Playhead';
import { MasterSection } from './master/MasterSection';
import { BassSection } from './bass/BassSection';
import { MixerPanel } from './mixer/MixerPanel';
import { SynthSection } from './synth/SynthSection';
import { SubtractorSection } from './subtractor/SubtractorSection';

type ModuleId = 'drum' | 'bass' | 'synth' | 'subtractor' | 'mixer' | 'master';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const [selectedStep, setSelectedStep] = useState(0);
  const [bassSelectedStep, setBassSelectedStep] = useState(0);
  const [synthSelectedStep, setSynthSelectedStep] = useState(0);
  const [subtractorSelectedStep, setSubtractorSelectedStep] = useState(0);
  const [expandedModule, setExpandedModule] = useState<ModuleId>('drum');

  const toggleModule = (id: ModuleId) => {
    setExpandedModule(prev => prev === id ? prev : id);
  };

  useKeyboard({
    selectedInstrument,
    setSelectedInstrument,
    selectedStep,
    setSelectedStep,
    expandedModule,
    setExpandedModule,
    bassSelectedStep,
    setBassSelectedStep,
    synthSelectedStep,
    setSynthSelectedStep,
    subtractorSelectedStep,
    setSubtractorSelectedStep,
  });

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <Transport />
      <div className="module-panel module--909">
        <div className="module-panel__header" onClick={() => toggleModule('drum')}>
          <span className={`module-panel__arrow${expandedModule === 'drum' ? ' module-panel__arrow--open' : ''}`}>▶</span>
          <span className="module-panel__title">GC-909</span>
          <span className="module-panel__subtitle">RHYTHM COMPOSER</span>
        </div>
        {expandedModule === 'drum' && (
          <div className="module-panel__content">
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
        )}
      </div>
      <BassSection
        selectedStep={bassSelectedStep}
        onSelectStep={setBassSelectedStep}
        expanded={expandedModule === 'bass'}
        onToggle={() => toggleModule('bass')}
      />
      <SynthSection
        selectedStep={synthSelectedStep}
        onSelectStep={setSynthSelectedStep}
        expanded={expandedModule === 'synth'}
        onToggle={() => toggleModule('synth')}
      />
      <SubtractorSection
        selectedStep={subtractorSelectedStep}
        onSelectStep={setSubtractorSelectedStep}
        expanded={expandedModule === 'subtractor'}
        onToggle={() => toggleModule('subtractor')}
      />
      <MixerPanel expanded={expandedModule === 'mixer'} onToggle={() => toggleModule('mixer')} />
      <MasterSection expanded={expandedModule === 'master'} onToggle={() => toggleModule('master')} />
    </>
  );
}
