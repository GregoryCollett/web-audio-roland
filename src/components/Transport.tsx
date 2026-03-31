import { useState, useCallback, useRef } from 'react';
import { useTransportSnapshot, transport } from '../hooks/useTransport';

function ShuffleKnob({ value }: { value: number }) {
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
        transport.setShuffle(newValue);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value],
  );

  const arcDeg = value * 280;
  const background = `conic-gradient(from 220deg, var(--accent) 0deg, var(--accent) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;
  const pct = Math.round(value * 100);

  return (
    <div className="transport__shuffle">
      <div
        className="transport__shuffle-dial"
        style={{ background }}
        onMouseDown={handleMouseDown}
        title={`Shuffle: ${pct}%`}
      >
        <div className="transport__shuffle-center" />
      </div>
      <span className="transport__shuffle-label">SFL {pct}%</span>
    </div>
  );
}

export function Transport() {
  const snap = useTransportSnapshot();
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState('');

  const handleBpmClick = useCallback(() => {
    setEditingBpm(true);
    setBpmInput(String(snap.bpm));
  }, [snap.bpm]);

  const handleBpmBlur = useCallback(() => {
    setEditingBpm(false);
    const value = parseInt(bpmInput, 10);
    if (!isNaN(value)) {
      transport.setBpm(value);
    }
  }, [bpmInput]);

  const handleBpmKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  return (
    <div className="transport">
      <div>
        <span className="transport__title">TR-909</span>
        <span className="transport__subtitle">RHYTHM COMPOSER</span>
      </div>
      <div className="transport__controls">
        {editingBpm ? (
          <input
            className="transport__bpm"
            type="number"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            onBlur={handleBpmBlur}
            onKeyDown={handleBpmKeyDown}
            autoFocus
            min={40}
            max={300}
          />
        ) : (
          <div className="transport__bpm" onClick={handleBpmClick}>
            {snap.bpm}
          </div>
        )}
        <span className="transport__bpm-label">BPM</span>
        <ShuffleKnob value={snap.shuffle} />
        <button
          className="transport__btn transport__btn--play"
          onClick={() => transport.play()}
        >
          PLAY
        </button>
        <button
          className="transport__btn transport__btn--stop"
          onClick={() => transport.stop()}
        >
          STOP
        </button>
      </div>
    </div>
  );
}
