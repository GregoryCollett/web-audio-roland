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

export function SynthAmpSection() {
  const params = useSynthParams();

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">AMP</div>
      <div className="synth-param-section__row">
        <div className="synth-adsr" style={{ borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }}>
          {ADSR_KEYS.map((key) => (
            <Knob
              key={key}
              label={ADSR_LABELS[key]}
              value={params.ampEnv[key]}
              displayValue={`${Math.round(params.ampEnv[key] * 100)}%`}
              onChange={(v) => synthEngine.setAmpEnv(key, v)}
              size="small"
            />
          ))}
        </div>
        <Knob
          label="Volume"
          value={params.volume}
          displayValue={`${Math.round(params.volume * 100)}%`}
          onChange={(v) => synthEngine.setVolume(v)}
          size="small"
        />
      </div>
    </div>
  );
}
