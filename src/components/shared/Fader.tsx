import { useCallback, useRef, useEffect } from 'react';

export interface FaderProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

export const SCROLL_STEP = 0.02;

export function Fader({ value, onChange, className }: FaderProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const elRef = useRef<HTMLDivElement>(null);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 150;
        onChange(Math.max(0, Math.min(1, startValue.current + delta)));
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

  // Native non-passive wheel listener so we can preventDefault
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? SCROLL_STEP : -SCROLL_STEP;
      onChangeRef.current(Math.max(0, Math.min(1, valueRef.current + delta)));
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={elRef}
      className={`mixer__fader-track${className ? ` ${className}` : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="mixer__fader-fill" style={{ height: `${value * 100}%` }} />
    </div>
  );
}
