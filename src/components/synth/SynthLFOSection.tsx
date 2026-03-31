import { useSynthParams, synthEngine } from '../../hooks/useSynth';
import type { SH2Params } from '../../engine/synth/synthTypes';
import { Knob } from '../shared/Knob';

const LFO_DESTINATIONS: SH2Params['lfoDestination'][] = ['pitch', 'cutoff', 'pulseWidth'];
const LFO_DEST_LABELS: Record<SH2Params['lfoDestination'], string> = {
  pitch: 'PITCH',
  cutoff: 'CUTOFF',
  pulseWidth: 'PW',
};

export function SynthLFOSection() {
  const params = useSynthParams();

  const cycleWaveform = () => {
    synthEngine.setLFOParam(
      'lfoWaveform',
      params.lfoWaveform === 'triangle' ? 'square' : 'triangle',
    );
  };

  const cycleDestination = () => {
    const idx = LFO_DESTINATIONS.indexOf(params.lfoDestination);
    const next = LFO_DESTINATIONS[(idx + 1) % LFO_DESTINATIONS.length];
    synthEngine.setLFOParam('lfoDestination', next);
  };

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">LFO</div>
      <div className="synth-param-section__row">
        <button className="synth-osc-panel__waveform" onClick={cycleWaveform}>
          {params.lfoWaveform === 'triangle' ? 'TRI' : 'SQR'}
        </button>
        <Knob
          label="Rate"
          value={params.lfoRate}
          displayValue={`${Math.round(params.lfoRate * 100)}%`}
          onChange={(v) => synthEngine.setLFOParam('lfoRate', v)}
          size="small"
        />
        <Knob
          label="Depth"
          value={params.lfoDepth}
          displayValue={`${Math.round(params.lfoDepth * 100)}%`}
          onChange={(v) => synthEngine.setLFOParam('lfoDepth', v)}
          size="small"
        />
        <button className="synth-lfo-destination" onClick={cycleDestination}>
          {LFO_DEST_LABELS[params.lfoDestination]}
        </button>
      </div>
    </div>
  );
}
