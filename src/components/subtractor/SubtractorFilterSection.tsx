import { useSubtractorParams, subtractorEngine } from '../../hooks/useSubtractor';
import type { ADSRParams } from '../../engine/subtractor/subtractorTypes';
import { FILTER1_MODES } from '../../engine/subtractor/subtractorTypes';
import { Knob } from '../shared/Knob';

const ADSR_KEYS: Array<keyof ADSRParams> = ['attack', 'decay', 'sustain', 'release'];
const ADSR_LABELS: Record<keyof ADSRParams, string> = {
  attack: 'A',
  decay: 'D',
  sustain: 'S',
  release: 'R',
};

const FILTER1_MODE_LABELS: Record<string, string> = {
  lp12: 'LP12',
  lp24: 'LP24',
  hp12: 'HP12',
  bp12: 'BP12',
  notch: 'NOTCH',
};

export function SubtractorFilterSection() {
  const params = useSubtractorParams();

  const cycleFilter1Mode = () => {
    const idx = FILTER1_MODES.indexOf(params.filter1Mode);
    const next = FILTER1_MODES[(idx + 1) % FILTER1_MODES.length];
    subtractorEngine.setFilter1Mode(next);
  };

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">FILTER</div>
      <div className="synth-param-section__row">
        <div className="synth-osc-panel">
          <div className="synth-osc-panel__title">FILTER 1</div>
          <div className="synth-osc-panel__controls">
            <button className="synth-osc-panel__waveform" onClick={cycleFilter1Mode}>
              {FILTER1_MODE_LABELS[params.filter1Mode]}
            </button>
            <Knob
              label="Cutoff"
              value={params.filter1.cutoff}
              displayValue={`${Math.round(params.filter1.cutoff * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(1, 'cutoff', v)}
              size="small"
            />
            <Knob
              label="Reso"
              value={params.filter1.resonance}
              displayValue={`${Math.round(params.filter1.resonance * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(1, 'resonance', v)}
              size="small"
            />
            <Knob
              label="Key Trk"
              value={params.filter1.keyTrack}
              displayValue={`${Math.round(params.filter1.keyTrack * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(1, 'keyTrack', v)}
              size="small"
            />
            <Knob
              label="Env Dep"
              value={params.filterEnvDepth}
              min={-1}
              max={1}
              displayValue={`${params.filterEnvDepth >= 0 ? '+' : ''}${Math.round(params.filterEnvDepth * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterEnvDepth(v)}
              size="small"
            />
          </div>
        </div>

        <div className="synth-adsr">
          <div className="synth-osc-panel__title">FILTER ENV</div>
          {ADSR_KEYS.map((key) => (
            <Knob
              key={key}
              label={ADSR_LABELS[key]}
              value={params.filterEnv[key]}
              displayValue={`${Math.round(params.filterEnv[key] * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterEnv(key, v)}
              size="small"
            />
          ))}
        </div>

        <div className="synth-osc-panel">
          <div className="synth-osc-panel__title">FILTER 2</div>
          <div className="synth-osc-panel__controls">
            <Knob
              label="Cutoff"
              value={params.filter2.cutoff}
              displayValue={`${Math.round(params.filter2.cutoff * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(2, 'cutoff', v)}
              size="small"
            />
            <Knob
              label="Reso"
              value={params.filter2.resonance}
              displayValue={`${Math.round(params.filter2.resonance * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(2, 'resonance', v)}
              size="small"
            />
            <Knob
              label="Key Trk"
              value={params.filter2.keyTrack}
              displayValue={`${Math.round(params.filter2.keyTrack * 100)}%`}
              onChange={(v) => subtractorEngine.setFilterParam(2, 'keyTrack', v)}
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
