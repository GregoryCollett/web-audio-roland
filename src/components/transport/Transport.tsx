import { useState, useCallback } from 'react';
import { useTransportSnapshot, transport } from '../../hooks/useTransport';
import { Knob } from '../shared/Knob';

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
        <span className="transport__title">TRANSPORT</span>
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
        <Knob
          label={`SFL ${Math.round(snap.shuffle * 100)}%`}
          value={snap.shuffle}
          onChange={(v) => transport.setShuffle(v)}
          size="small"
        />
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
