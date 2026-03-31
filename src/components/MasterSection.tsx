import { useCallback, useRef, useState } from 'react';
import { useMaster, transport } from '../hooks/useTransport';

// --- Compressor presets ---

interface CompPreset {
  name: string;
  threshold: number;
  ratio: number;
  knee: number;
  attack: number;
  release: number;
}

const COMP_PRESETS: CompPreset[] = [
  { name: 'Drum Bus',      threshold: -18, ratio: 4,   knee: 8,  attack: 0.005, release: 0.15 },
  { name: 'Gentle Glue',   threshold: -12, ratio: 2,   knee: 20, attack: 0.01,  release: 0.2  },
  { name: 'Punchy',        threshold: -20, ratio: 6,   knee: 4,  attack: 0.001, release: 0.08 },
  { name: 'Smash',         threshold: -30, ratio: 12,  knee: 2,  attack: 0.001, release: 0.05 },
  { name: 'Limiter',       threshold: -6,  ratio: 20,  knee: 0,  attack: 0.001, release: 0.05 },
  { name: 'Warm',          threshold: -15, ratio: 3,   knee: 15, attack: 0.008, release: 0.25 },
  { name: 'Transient Snap', threshold: -22, ratio: 5,  knee: 6,  attack: 0.02,  release: 0.1  },
  { name: 'Parallel Crush', threshold: -35, ratio: 15, knee: 0,  attack: 0.001, release: 0.03 },
  { name: 'Open',          threshold: -10, ratio: 1.5, knee: 30, attack: 0.015, release: 0.3  },
  { name: 'Flat',          threshold: -24, ratio: 8,   knee: 0,  attack: 0.003, release: 0.12 },
];

// --- Knob component ---

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

// --- Main component ---

function findMatchingPreset(master: { threshold: number; ratio: number; knee: number; attack: number; release: number }): string {
  for (const p of COMP_PRESETS) {
    if (
      Math.abs(p.threshold - master.threshold) < 0.5 &&
      Math.abs(p.ratio - master.ratio) < 0.1 &&
      Math.abs(p.knee - master.knee) < 0.5 &&
      Math.abs(p.attack - master.attack) < 0.001 &&
      Math.abs(p.release - master.release) < 0.01
    ) {
      return p.name;
    }
  }
  return '';
}

export function MasterSection() {
  const master = useMaster();
  const [presetOpen, setPresetOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeName = findMatchingPreset(master) || 'Custom';

  const loadPreset = (preset: CompPreset) => {
    transport.setCompressorParam('threshold', preset.threshold);
    transport.setCompressorParam('ratio', preset.ratio);
    transport.setCompressorParam('knee', preset.knee);
    transport.setCompressorParam('attack', preset.attack);
    transport.setCompressorParam('release', preset.release);
    setPresetOpen(false);
  };

  return (
    <div className="master">
      <div className="master__header">
        <span className="master__title">MASTER</span>
        <div className="master__header-controls">
          <div className="master__preset-select" ref={dropdownRef}>
            <button
              className="master__preset-trigger"
              onClick={() => setPresetOpen(!presetOpen)}
            >
              <span>{activeName}</span>
              <span className="preset-selector__arrow">{presetOpen ? '\u25B2' : '\u25BC'}</span>
            </button>
            {presetOpen && (
              <div className="master__preset-dropdown">
                {COMP_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    className={`preset-selector__item${p.name === activeName ? ' preset-selector__item--active' : ''}`}
                    onClick={() => loadPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className={`master__comp-toggle${master.compressor ? ' master__comp-toggle--active' : ''}`}
            onClick={() => transport.setCompressorEnabled(!master.compressor)}
          >
            {master.compressor ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div className="master__knobs">
        <MasterKnob
          label="Volume"
          value={master.volume}
          min={0}
          max={1}
          displayValue={`${Math.round(master.volume * 100)}%`}
          onChange={(v) => transport.setMasterVolume(v)}
        />
        <MasterKnob
          label="Thresh"
          value={master.threshold}
          min={-60}
          max={0}
          displayValue={`${Math.round(master.threshold)}dB`}
          onChange={(v) => transport.setCompressorParam('threshold', v)}
        />
        <MasterKnob
          label="Ratio"
          value={master.ratio}
          min={1}
          max={20}
          displayValue={`${master.ratio.toFixed(1)}:1`}
          onChange={(v) => transport.setCompressorParam('ratio', v)}
        />
        <MasterKnob
          label="Knee"
          value={master.knee}
          min={0}
          max={40}
          displayValue={`${Math.round(master.knee)}dB`}
          onChange={(v) => transport.setCompressorParam('knee', v)}
        />
        <MasterKnob
          label="Attack"
          value={master.attack}
          min={0}
          max={1}
          displayValue={`${Math.round(master.attack * 1000)}ms`}
          onChange={(v) => transport.setCompressorParam('attack', v)}
        />
        <MasterKnob
          label="Release"
          value={master.release}
          min={0}
          max={1}
          displayValue={`${Math.round(master.release * 1000)}ms`}
          onChange={(v) => transport.setCompressorParam('release', v)}
        />
      </div>
    </div>
  );
}
