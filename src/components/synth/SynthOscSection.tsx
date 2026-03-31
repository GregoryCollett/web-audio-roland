import { useSynthParams, synthEngine } from '../../hooks/useSynth';
import type { OscParams } from '../../engine/synth/synthTypes';
import { Knob } from '../shared/Knob';

const WAVEFORMS: OscParams['waveform'][] = ['sawtooth', 'square', 'pulse'];
const WAVEFORM_LABELS: Record<OscParams['waveform'], string> = {
  sawtooth: 'SAW',
  square: 'SQR',
  pulse: 'PLS',
};

interface OscPanelProps {
  oscNum: 1 | 2;
  osc: OscParams;
}

function OscPanel({ oscNum, osc }: OscPanelProps) {
  const nextWaveform = () => {
    const idx = WAVEFORMS.indexOf(osc.waveform);
    const next = WAVEFORMS[(idx + 1) % WAVEFORMS.length];
    synthEngine.setOscParam(oscNum, 'waveform', next);
  };

  return (
    <div className="synth-osc-panel">
      <div className="synth-osc-panel__title">OSC {oscNum}</div>
      <div className="synth-osc-panel__controls">
        <button className="synth-osc-panel__waveform" onClick={nextWaveform}>
          {WAVEFORM_LABELS[osc.waveform]}
        </button>
        <div className="synth-osc-panel__octave">
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => synthEngine.setOscParam(oscNum, 'octave', Math.max(-2, osc.octave - 1))}
          >
            -
          </button>
          <span className="synth-osc-panel__octave-value">
            {osc.octave >= 0 ? `+${osc.octave}` : osc.octave}
          </span>
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => synthEngine.setOscParam(oscNum, 'octave', Math.min(2, osc.octave + 1))}
          >
            +
          </button>
        </div>
        <Knob
          label="Tune"
          value={osc.tune}
          min={-1}
          max={1}
          displayValue={`${osc.tune >= 0 ? '+' : ''}${osc.tune.toFixed(2)}`}
          onChange={(v) => synthEngine.setOscParam(oscNum, 'tune', v)}
          size="small"
        />
        <Knob
          label="PW"
          value={osc.pulseWidth}
          displayValue={`${Math.round(osc.pulseWidth * 100)}%`}
          onChange={(v) => synthEngine.setOscParam(oscNum, 'pulseWidth', v)}
          size="small"
        />
        <Knob
          label="Level"
          value={osc.level}
          displayValue={`${Math.round(osc.level * 100)}%`}
          onChange={(v) => synthEngine.setOscParam(oscNum, 'level', v)}
          size="small"
        />
      </div>
    </div>
  );
}

export function SynthOscSection() {
  const params = useSynthParams();

  return (
    <div className="synth-osc-section">
      <OscPanel oscNum={1} osc={params.osc1} />
      <div className="synth-noise">
        <div className="synth-noise__title">NOISE</div>
        <Knob
          label="Level"
          value={params.noiseLevel}
          displayValue={`${Math.round(params.noiseLevel * 100)}%`}
          onChange={(v) => synthEngine.setNoiseLevel(v)}
          size="small"
        />
      </div>
      <OscPanel oscNum={2} osc={params.osc2} />
    </div>
  );
}
