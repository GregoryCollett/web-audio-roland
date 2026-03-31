import { useState, useCallback } from 'react';
import { useTransport, engine } from '../hooks/useEngine';

export function Transport() {
  const transport = useTransport();
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState('');

  const handleBpmClick = useCallback(() => {
    setEditingBpm(true);
    setBpmInput(String(transport.bpm));
  }, [transport.bpm]);

  const handleBpmBlur = useCallback(() => {
    setEditingBpm(false);
    const value = parseInt(bpmInput, 10);
    if (!isNaN(value)) {
      engine.setBpm(value);
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
            {transport.bpm}
          </div>
        )}
        <span className="transport__bpm-label">BPM</span>
        <button
          className="transport__btn transport__btn--play"
          onClick={() => engine.play()}
        >
          PLAY
        </button>
        <button
          className="transport__btn transport__btn--stop"
          onClick={() => engine.stop()}
        >
          STOP
        </button>
      </div>
    </div>
  );
}
