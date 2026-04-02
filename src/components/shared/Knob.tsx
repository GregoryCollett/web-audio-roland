import { useState, useCallback, useRef } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const range = max - min;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = ((startY.current - e.clientY) / 150) * range;
        const newValue = Math.max(min, Math.min(max, startValue.current + delta));
        onChange(newValue);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, min, max, range, onChange],
  );

  const handleDoubleClick = useCallback(() => {
    onChange((min + max) / 2);
  }, [min, max, onChange]);

  const normalized = (value - min) / range;
  const arcDeg = normalized * 280;
  const background = `conic-gradient(from 220deg, var(--module-accent, var(--accent)) 0deg, var(--module-accent, var(--accent)) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;

  const sizeClass = size === 'small' ? ' knob--small' : '';
  const tooltipText = displayValue ?? `${Math.round(normalized * 100)}%`;

  return (
    <div className={`knob${sizeClass}`}>
      {isDragging && <span className="knob__tooltip">{tooltipText}</span>}
      <div
        className={`knob__dial${isDragging ? ' knob__dial--active' : ''}`}
        style={{ background }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title={`${label}${displayValue ? `: ${displayValue}` : ''}`}
      >
        <div className="knob__center" />
      </div>
      {displayValue && <span className="knob__value">{displayValue}</span>}
      <span className="knob__label">{label}</span>
    </div>
  );
}
