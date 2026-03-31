import { useCallback, useRef } from 'react';

export interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  displayValue?: string;
  onChange: (value: number) => void;
  size?: 'small' | 'medium';
}

export function Knob({ label, value, min = 0, max = 1, displayValue, onChange, size = 'medium' }: KnobProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const range = max - min;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ((startY.current - e.clientY) / 150) * range;
        const newValue = Math.max(min, Math.min(max, startValue.current + delta));
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
    [value, min, max, range, onChange],
  );

  const normalized = (value - min) / range;
  const arcDeg = normalized * 280;
  const background = `conic-gradient(from 220deg, var(--accent) 0deg, var(--accent) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;

  const sizeClass = size === 'small' ? ' knob--small' : '';

  return (
    <div className={`knob${sizeClass}`}>
      <div
        className="knob__dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
        title={`${label}${displayValue ? `: ${displayValue}` : ''}`}
      >
        <div className="knob__center" />
      </div>
      {displayValue && <span className="knob__value">{displayValue}</span>}
      <span className="knob__label">{label}</span>
    </div>
  );
}
