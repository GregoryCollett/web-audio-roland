import { useCallback, useRef } from 'react';
import { useMaster, engine } from '../hooks/useEngine';

interface MasterKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  displayValue: string;
  onChange: (value: number) => void;
}

function MasterKnob({ label, value, min, max, displayValue, onChange }: MasterKnobProps) {
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
        const range = max - min;
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
    [value, min, max, onChange],
  );

  const normalized = (value - min) / (max - min);
  const arcDeg = normalized * 280;
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

export function MasterSection() {
  const master = useMaster();

  return (
    <div className="master">
      <div className="master__header">
        <span className="master__title">MASTER</span>
        <button
          className={`master__comp-toggle${master.compressor ? ' master__comp-toggle--active' : ''}`}
          onClick={() => engine.setCompressorEnabled(!master.compressor)}
        >
          COMP {master.compressor ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="master__knobs">
        <MasterKnob
          label="Volume"
          value={master.volume}
          min={0}
          max={1}
          displayValue={`${Math.round(master.volume * 100)}%`}
          onChange={(v) => engine.setMasterVolume(v)}
        />
        <MasterKnob
          label="Thresh"
          value={master.threshold}
          min={-60}
          max={0}
          displayValue={`${Math.round(master.threshold)}dB`}
          onChange={(v) => engine.setCompressorParam('threshold', v)}
        />
        <MasterKnob
          label="Ratio"
          value={master.ratio}
          min={1}
          max={20}
          displayValue={`${master.ratio.toFixed(1)}:1`}
          onChange={(v) => engine.setCompressorParam('ratio', v)}
        />
        <MasterKnob
          label="Knee"
          value={master.knee}
          min={0}
          max={40}
          displayValue={`${Math.round(master.knee)}dB`}
          onChange={(v) => engine.setCompressorParam('knee', v)}
        />
        <MasterKnob
          label="Attack"
          value={master.attack}
          min={0}
          max={1}
          displayValue={`${Math.round(master.attack * 1000)}ms`}
          onChange={(v) => engine.setCompressorParam('attack', v)}
        />
        <MasterKnob
          label="Release"
          value={master.release}
          min={0}
          max={1}
          displayValue={`${Math.round(master.release * 1000)}ms`}
          onChange={(v) => engine.setCompressorParam('release', v)}
        />
      </div>
    </div>
  );
}
