import { type InstrumentId, TUNABLE_INSTRUMENTS } from '../../engine/types';
import { useInstrumentParams, drumEngine } from '../../hooks/useDrum';
import { Knob } from '../shared/Knob';

interface ParamKnobsProps {
  instrument: InstrumentId;
}

export function ParamKnobs({ instrument }: ParamKnobsProps) {
  const params = useInstrumentParams(instrument);
  const hasTune = TUNABLE_INSTRUMENTS.has(instrument);

  return (
    <div className="param-knobs">
      <Knob
        label="Level"
        value={params.level}
        onChange={(v) => drumEngine.setParam(instrument, 'level', v)}
      />
      {hasTune && (
        <Knob
          label="Tune"
          value={params.tune ?? 0.5}
          onChange={(v) => drumEngine.setParam(instrument, 'tune', v)}
        />
      )}
      <Knob
        label="Decay"
        value={params.decay}
        onChange={(v) => drumEngine.setParam(instrument, 'decay', v)}
      />
    </div>
  );
}
