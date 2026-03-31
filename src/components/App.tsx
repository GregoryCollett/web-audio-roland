import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { InitOverlay } from './InitOverlay';
import { Transport } from './Transport';
import { InstrumentSelector } from './InstrumentSelector';
import { ParamKnobs } from './ParamKnobs';
import { StepGrid } from './StepGrid';
import { AccentRow } from './AccentRow';
import { Playhead } from './Playhead';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <div className="tr909">
        <Transport />
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
