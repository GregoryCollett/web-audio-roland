import { useSubtractorParams, subtractorEngine } from '../../hooks/useSubtractor';
import type { ADSRParams, LFOWaveform, LFOParams } from '../../engine/subtractor/subtractorTypes';
import { Knob } from '../shared/Knob';

const ADSR_KEYS: Array<keyof ADSRParams> = ['attack', 'decay', 'sustain', 'release'];
const ADSR_LABELS: Record<keyof ADSRParams, string> = {
  attack: 'A',
  decay: 'D',
  sustain: 'S',
  release: 'R',
};

const LFO_WAVEFORMS: LFOWaveform[] = ['triangle', 'sawtooth', 'square', 'random'];
const LFO_WAVE_LABELS: Record<LFOWaveform, string> = {
  triangle: 'TRI',
  sawtooth: 'SAW',
  square: 'SQR',
  random: 'RND',
};

interface LFOPanelProps {
  lfoNum: 1 | 2;
  lfo: LFOParams;
}

function LFOPanel({ lfoNum, lfo }: LFOPanelProps) {
  const cycleWaveform = () => {
    const idx = LFO_WAVEFORMS.indexOf(lfo.waveform);
    const next = LFO_WAVEFORMS[(idx + 1) % LFO_WAVEFORMS.length];
    subtractorEngine.setLFOParam(lfoNum, 'waveform', next);
  };

  return (
    <div className="synth-osc-panel">
      <div className="synth-osc-panel__title">LFO {lfoNum}</div>
      <div className="synth-osc-panel__controls">
        <button className="synth-osc-panel__waveform" onClick={cycleWaveform}>
          {LFO_WAVE_LABELS[lfo.waveform]}
        </button>
        <Knob
          label="Rate"
          value={lfo.rate}
          displayValue={`${Math.round(lfo.rate * 100)}%`}
          onChange={(v) => subtractorEngine.setLFOParam(lfoNum, 'rate', v)}
          size="small"
        />
        <Knob
          label="Delay"
          value={lfo.delay}
          displayValue={`${Math.round(lfo.delay * 100)}%`}
          onChange={(v) => subtractorEngine.setLFOParam(lfoNum, 'delay', v)}
          size="small"
        />
        {lfoNum === 2 && (
          <button
            className={`synth-osc-panel__waveform${lfo.keySync ? ' synth-osc-panel__waveform--active' : ''}`}
            onClick={() => subtractorEngine.setLFOParam(lfoNum, 'keySync', !lfo.keySync)}
          >
            KEY SYNC
          </button>
        )}
      </div>
    </div>
  );
}

export function SubtractorModSection() {
  const params = useSubtractorParams();

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">MOD</div>
      <div className="synth-param-section__row">
        <LFOPanel lfoNum={1} lfo={params.lfo1} />
        <LFOPanel lfoNum={2} lfo={params.lfo2} />
        <div className="synth-adsr">
          <div className="synth-osc-panel__title">MOD ENV</div>
          {ADSR_KEYS.map((key) => (
            <Knob
              key={key}
              label={ADSR_LABELS[key]}
              value={params.modEnv[key]}
              displayValue={`${Math.round(params.modEnv[key] * 100)}%`}
              onChange={(v) => subtractorEngine.setModEnv(key, v)}
              size="small"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
