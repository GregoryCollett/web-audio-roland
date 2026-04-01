import { useSubtractorParams, subtractorEngine } from '../../hooks/useSubtractor';
import type { ModSource } from '../../engine/subtractor/subtractorTypes';
import { MOD_DESTINATIONS } from '../../engine/subtractor/subtractorTypes';
import { Knob } from '../shared/Knob';

const MOD_SOURCES: ModSource[] = ['none', 'lfo1', 'lfo2', 'modEnv', 'velocity'];
const MOD_SOURCE_LABELS: Record<ModSource, string> = {
  none: 'None',
  lfo1: 'LFO 1',
  lfo2: 'LFO 2',
  modEnv: 'Mod Env',
  velocity: 'Velocity',
};

const MOD_DEST_LABELS: Record<string, string> = {
  osc1Pitch: 'OSC1 Pitch',
  osc2Pitch: 'OSC2 Pitch',
  oscMix: 'OSC Mix',
  filterCutoff: 'Filter Cutoff',
  filterResonance: 'Filter Reso',
  ampLevel: 'Amp Level',
  pulseWidth: 'Pulse Width',
  lfo1Rate: 'LFO1 Rate',
  lfo2Rate: 'LFO2 Rate',
  fmAmount: 'FM Amount',
  panPosition: 'Pan',
  portamentoRate: 'Porta Rate',
};

export function SubtractorModMatrix() {
  const params = useSubtractorParams();

  return (
    <div className="synth-param-section">
      <div className="synth-param-section__title">MOD MATRIX</div>
      <div className="subtractor-mod-matrix">
        {params.modMatrix.map((slot, i) => (
          <div key={i} className="subtractor-mod-matrix__row">
            <select
              className="subtractor-mod-matrix__select"
              value={slot.source}
              onChange={(e) =>
                subtractorEngine.setModSlot(i, { ...slot, source: e.target.value as ModSource })
              }
            >
              {MOD_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {MOD_SOURCE_LABELS[src]}
                </option>
              ))}
            </select>
            <select
              className="subtractor-mod-matrix__select"
              value={slot.destination}
              onChange={(e) =>
                subtractorEngine.setModSlot(i, { ...slot, destination: e.target.value })
              }
            >
              {MOD_DESTINATIONS.map((dest) => (
                <option key={dest} value={dest}>
                  {MOD_DEST_LABELS[dest] ?? dest}
                </option>
              ))}
            </select>
            <Knob
              label="Amt"
              value={slot.amount}
              min={-1}
              max={1}
              displayValue={`${slot.amount >= 0 ? '+' : ''}${slot.amount.toFixed(2)}`}
              onChange={(v) => subtractorEngine.setModSlot(i, { ...slot, amount: v })}
              size="small"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
