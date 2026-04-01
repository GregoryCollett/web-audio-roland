import { useSubtractorParams, subtractorEngine } from '../../hooks/useSubtractor';
import type { ADSRParams, PortamentoMode } from '../../engine/subtractor/subtractorTypes';
import { Knob } from '../shared/Knob';

const ADSR_KEYS: Array<keyof ADSRParams> = ['attack', 'decay', 'sustain', 'release'];
const ADSR_LABELS: Record<keyof ADSRParams, string> = {
  attack: 'A',
  decay: 'D',
  sustain: 'S',
  release: 'R',
};

const PORTAMENTO_MODES: PortamentoMode[] = ['off', 'on', 'auto'];
const PORTAMENTO_LABELS: Record<PortamentoMode, string> = {
  off: 'OFF',
  on: 'ON',
  auto: 'AUTO',
};

export function SubtractorAmpSection() {
  const params = useSubtractorParams();

  const cyclePortamentoMode = () => {
    const idx = PORTAMENTO_MODES.indexOf(params.portamentoMode);
    const next = PORTAMENTO_MODES[(idx + 1) % PORTAMENTO_MODES.length];
    subtractorEngine.setPortamento(next);
  };

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
              onChange={(v) => subtractorEngine.setAmpEnv(key, v)}
              size="small"
            />
          ))}
        </div>
        <Knob
          label="Volume"
          value={params.volume}
          displayValue={`${Math.round(params.volume * 100)}%`}
          onChange={(v) => subtractorEngine.setVolume(v)}
          size="small"
        />
        <div className="synth-osc-panel__octave">
          <span className="synth-osc-panel__octave-value" style={{ marginRight: '4px' }}>PORTA</span>
          <button className="synth-osc-panel__waveform" onClick={cyclePortamentoMode}>
            {PORTAMENTO_LABELS[params.portamentoMode]}
          </button>
        </div>
        <Knob
          label="Rate"
          value={params.portamentoRate}
          displayValue={`${Math.round(params.portamentoRate * 100)}%`}
          onChange={(v) => subtractorEngine.setPortamento(params.portamentoMode, v)}
          size="small"
        />
      </div>
    </div>
  );
}
