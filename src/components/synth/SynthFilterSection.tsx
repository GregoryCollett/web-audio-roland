import { useSynthParams, synthEngine } from '../../hooks/useSynth';
import type { ADSRParams } from '../../engine/synth/synthTypes';
import { Knob } from '../shared/Knob';

const ADSR_KEYS: Array<keyof ADSRParams> = ['attack', 'decay', 'sustain', 'release'];
const ADSR_LABELS: Record<keyof ADSRParams, string> = {
  attack: 'A',
  decay: 'D',
  sustain: 'S',
  release: 'R',
};

export function SynthFilterSection() {
  const params = useSynthParams();

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">FILTER</div>
      <div className="synth-param-section__row">
        <Knob
          label="Cutoff"
          value={params.cutoff}
          displayValue={`${Math.round(params.cutoff * 100)}%`}
          onChange={(v) => synthEngine.setFilterParam('cutoff', v)}
          size="small"
        />
        <Knob
          label="Reso"
          value={params.resonance}
          displayValue={`${Math.round(params.resonance * 100)}%`}
          onChange={(v) => synthEngine.setFilterParam('resonance', v)}
          size="small"
        />
        <Knob
          label="Env"
          value={params.filterEnvDepth}
          displayValue={`${Math.round(params.filterEnvDepth * 100)}%`}
          onChange={(v) => synthEngine.setFilterParam('filterEnvDepth', v)}
          size="small"
        />
        <div className="synth-adsr">
          {ADSR_KEYS.map((key) => (
            <Knob
              key={key}
              label={ADSR_LABELS[key]}
              value={params.filterEnv[key]}
              displayValue={`${Math.round(params.filterEnv[key] * 100)}%`}
              onChange={(v) => synthEngine.setFilterEnv(key, v)}
              size="small"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
