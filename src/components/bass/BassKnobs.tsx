import { useBassSynth, bassEngine } from '../../hooks/useBass';
import type { SynthParams } from '../../engine/bass/bassTypes';
import { Knob } from '../shared/Knob';

const KNOB_DEFS: Array<{ label: string; param: keyof SynthParams }> = [
  { label: 'Cutoff', param: 'cutoff' },
  { label: 'Reso', param: 'resonance' },
  { label: 'Env Mod', param: 'envMod' },
  { label: 'Decay', param: 'decay' },
  { label: 'Accent', param: 'accent' },
  { label: 'Volume', param: 'volume' },
];

export function BassKnobs() {
  const synth = useBassSynth();

  return (
    <div className="bass-knobs">
      {KNOB_DEFS.map(({ label, param }) => {
        const value = synth[param] as number;
        return (
          <Knob
            key={param}
            label={label}
            value={value}
            displayValue={`${Math.round(value * 100)}%`}
            onChange={(v) => bassEngine.setSynthParam(param, v)}
          />
        );
      })}
    </div>
  );
}
