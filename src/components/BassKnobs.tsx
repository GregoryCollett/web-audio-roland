import { useCallback, useRef } from 'react';
import { useBassSynth, bassEngine } from '../hooks/useBass';
import type { SynthParams } from '../engine/bass/bassTypes';

interface BassKnobProps {
  label: string;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
}

function BassKnob({ label, value, displayValue, onChange }: BassKnobProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 150;
        const newValue = Math.max(0, Math.min(1, startValue.current + delta));
        onChange(newValue);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, onChange],
  );

  const arcDeg = value * 280;
  const background = `conic-gradient(from 220deg, var(--accent) 0deg, var(--accent) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;

  return (
    <div className="master__knob">
      <div
        className="master__knob-dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
        title={`${label}: ${displayValue}`}
      >
        <div className="master__knob-center" />
      </div>
      <span className="master__knob-value">{displayValue}</span>
      <span className="master__knob-label">{label}</span>
    </div>
  );
}

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
          <BassKnob
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
