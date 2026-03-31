import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { usePresets, engine } from '../hooks/useEngine';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { PresetSelector } from './PresetSelector';
import { InstrumentSelector } from './InstrumentSelector';
import { ParamKnobs } from './ParamKnobs';
import { StepGrid } from './StepGrid';
import { AccentRow } from './AccentRow';
import { Playhead } from './Playhead';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const presets = usePresets();

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
            onLoad={(id) => engine.loadPatternPreset(id)}
            onSave={(name) => engine.savePatternPreset(name)}
            onDelete={(id) => engine.deletePatternPreset(id)}
          />
          <PresetSelector
            label="Kit"
            presets={presets.kits}
            activeId={presets.activeKitId}
            onLoad={(id) => engine.loadKitPreset(id)}
            onSave={(name) => engine.saveKitPreset(name)}
            onDelete={(id) => engine.deleteKitPreset(id)}
          />
        </div>
        <InstrumentSelector
          selected={selectedInstrument}
          onSelect={setSelectedInstrument}
        />
        <ParamKnobs instrument={selectedInstrument} />
        <StepGrid instrument={selectedInstrument} />
        <AccentRow />
        <Playhead />
      </div>
    </>
  );
}
