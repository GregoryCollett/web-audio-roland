import { useSubtractorParams, subtractorEngine } from '../../hooks/useSubtractor';
import type { SubOscParams } from '../../engine/subtractor/subtractorTypes';
import { WAVEFORM_NAMES } from '../../engine/subtractor/waveforms';
import { Knob } from '../shared/Knob';

interface OscPanelProps {
  oscNum: 1 | 2;
  osc: SubOscParams;
}

function OscPanel({ oscNum, osc }: OscPanelProps) {
  const prevWaveform = () => {
    const next = (osc.waveform - 1 + WAVEFORM_NAMES.length) % WAVEFORM_NAMES.length;
    subtractorEngine.setOscParam(oscNum, 'waveform', next);
  };

  const nextWaveform = () => {
    const next = (osc.waveform + 1) % WAVEFORM_NAMES.length;
    subtractorEngine.setOscParam(oscNum, 'waveform', next);
  };

  return (
    <div className="synth-osc-panel">
      <div className="synth-osc-panel__title">OSC {oscNum}</div>
      <div className="synth-osc-panel__controls">
        <div className="synth-osc-panel__waveform-row">
          <button className="synth-osc-panel__octave-btn" onClick={prevWaveform}>&lt;</button>
          <span className="synth-osc-panel__waveform-name">{WAVEFORM_NAMES[osc.waveform]}</span>
          <button className="synth-osc-panel__octave-btn" onClick={nextWaveform}>&gt;</button>
        </div>
        <div className="synth-osc-panel__octave">
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => subtractorEngine.setOscParam(oscNum, 'octave', Math.max(-2, osc.octave - 1))}
          >
            -
          </button>
          <span className="synth-osc-panel__octave-value">
            {osc.octave >= 0 ? `+${osc.octave}` : osc.octave}
          </span>
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => subtractorEngine.setOscParam(oscNum, 'octave', Math.min(2, osc.octave + 1))}
          >
            +
          </button>
        </div>
        <div className="synth-osc-panel__octave">
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => subtractorEngine.setOscParam(oscNum, 'semitone', Math.max(-12, osc.semitone - 1))}
          >
            -
          </button>
          <span className="synth-osc-panel__octave-value">
            {osc.semitone >= 0 ? `+${osc.semitone}` : osc.semitone}st
          </span>
          <button
            className="synth-osc-panel__octave-btn"
            onClick={() => subtractorEngine.setOscParam(oscNum, 'semitone', Math.min(12, osc.semitone + 1))}
          >
            +
          </button>
        </div>
        <Knob
          label="Fine"
          value={osc.fineTune}
          min={-50}
          max={50}
          displayValue={`${osc.fineTune >= 0 ? '+' : ''}${osc.fineTune.toFixed(0)}c`}
          onChange={(v) => subtractorEngine.setOscParam(oscNum, 'fineTune', v)}
          size="small"
        />
        <Knob
          label="PW"
          value={osc.pulseWidth}
          displayValue={`${Math.round(osc.pulseWidth * 100)}%`}
          onChange={(v) => subtractorEngine.setOscParam(oscNum, 'pulseWidth', v)}
          size="small"
        />
        <Knob
          label="Level"
          value={osc.level}
          displayValue={`${Math.round(osc.level * 100)}%`}
          onChange={(v) => subtractorEngine.setOscParam(oscNum, 'level', v)}
          size="small"
        />
      </div>
    </div>
  );
}

export function SubtractorOscSection() {
  const params = useSubtractorParams();

  return (
    <div className="synth-osc-section">
      <OscPanel oscNum={1} osc={params.osc1} />
      <div className="synth-noise">
        <div className="synth-noise__title">MIX</div>
        <Knob
          label="Osc Mix"
          value={params.oscMix}
          displayValue={`${Math.round(params.oscMix * 100)}%`}
          onChange={(v) => subtractorEngine.setOscMix(v)}
          size="small"
        />
        <Knob
          label="FM Amt"
          value={params.fmAmount}
          displayValue={`${Math.round(params.fmAmount * 100)}%`}
          onChange={(v) => subtractorEngine.setFmAmount(v)}
          size="small"
        />
        <Knob
          label="Ring Mod"
          value={params.ringModLevel}
          displayValue={`${Math.round(params.ringModLevel * 100)}%`}
          onChange={(v) => subtractorEngine.setRingModLevel(v)}
          size="small"
        />
        <Knob
          label="Noise"
          value={params.noiseLevel}
          displayValue={`${Math.round(params.noiseLevel * 100)}%`}
          onChange={(v) => subtractorEngine.setNoiseLevel(v)}
          size="small"
        />
      </div>
      <OscPanel oscNum={2} osc={params.osc2} />
    </div>
  );
}
