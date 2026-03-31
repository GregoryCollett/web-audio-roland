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

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const [selectedStep, setSelectedStep] = useState(0);
  const presets = useDrumPresets();

  useKeyboard({
    selectedInstrument,
    setSelectedInstrument,
    selectedStep,
    setSelectedStep,
  });

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <div className="tr909">
        <Transport />
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
      <MasterSection />
    </>
  );
}
