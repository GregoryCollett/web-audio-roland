import { useCallback, useRef } from 'react';
import { type InstrumentId, TUNABLE_INSTRUMENTS } from '../engine/types';
import { useInstrumentParams, engine } from '../hooks/useEngine';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function Knob({ label, value, onChange }: KnobProps) {
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
    <div className="knob">
      <div
        className="knob__dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
      >
        <div className="knob__center" />
      </div>
      <span className="knob__label">{label}</span>
    </div>
  );
}

interface ParamKnobsProps {
  instrument: InstrumentId;
}

export function ParamKnobs({ instrument }: ParamKnobsProps) {
  const params = useInstrumentParams(instrument);
  const hasTune = TUNABLE_INSTRUMENTS.has(instrument);

  return (
    <div className="param-knobs">
      <Knob
        label="Level"
        value={params.level}
        onChange={(v) => engine.setParam(instrument, 'level', v)}
      />
      {hasTune && (
        <Knob
          label="Tune"
          value={params.tune ?? 0.5}
          onChange={(v) => engine.setParam(instrument, 'tune', v)}
        />
      )}
      <Knob
        label="Decay"
        value={params.decay}
        onChange={(v) => engine.setParam(instrument, 'decay', v)}
      />
    </div>
  );
}
