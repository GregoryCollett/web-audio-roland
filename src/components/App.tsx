import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { useDrumPresets, drumEngine } from '../hooks/useDrum';
import { useKeyboard } from '../hooks/useKeyboard';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { PresetSelector } from './PresetSelector';
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
  const presets = useDrumPresets();

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
        <div className="tr909__header">
          <span className="tr909__title">TR-909</span>
          <span className="tr909__subtitle">RHYTHM COMPOSER</span>
        </div>
        <div className="preset-row">
          <PresetSelector
            label="Pattern"
            presets={presets.patterns}
            activeId={presets.activePatternId}
            onLoad={(id) => drumEngine.loadPatternPreset(id)}
            onSave={(name) => drumEngine.savePatternPreset(name)}
            onDelete={(id) => drumEngine.deletePatternPreset(id)}
          />
          <PresetSelector
            label="Kit"
            presets={presets.kits}
            activeId={presets.activeKitId}
            onLoad={(id) => drumEngine.loadKitPreset(id)}
            onSave={(name) => drumEngine.saveKitPreset(name)}
            onDelete={(id) => drumEngine.deleteKitPreset(id)}
          />
        </div>
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
