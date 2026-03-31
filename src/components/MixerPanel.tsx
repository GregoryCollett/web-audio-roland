import { useCallback, useRef } from 'react';
import { useMixer, mixer } from '../hooks/useTransport';

interface ChannelFaderProps {
  label: string;
  volume: number;
  pan?: number;
  mute?: boolean;
  solo?: boolean;
  dimmed?: boolean;
  isMaster?: boolean;
  onVolume: (v: number) => void;
  onPan?: (v: number) => void;
  onMute?: () => void;
  onSolo?: () => void;
}

function ChannelFader({
  label, volume, pan, mute, solo, dimmed, isMaster,
  onVolume, onPan, onMute, onSolo,
}: ChannelFaderProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleVolumeDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = volume;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 150;
        onVolume(Math.max(0, Math.min(1, startValue.current + delta)));
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [volume, onVolume],
  );

  const handlePanDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onPan || pan === undefined) return;
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = pan;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 100;
        onPan(Math.max(-1, Math.min(1, startValue.current + delta)));
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pan, onPan],
  );

  const panDisplay = pan === undefined ? '' : pan === 0 ? 'C' : pan < 0 ? `L${Math.round(Math.abs(pan) * 100)}` : `R${Math.round(pan * 100)}`;

  return (
    <div className={`mixer__channel${dimmed ? ' mixer__channel--empty' : ''}${isMaster ? ' mixer__master-channel' : ''}`}>
      <span className="mixer__channel-label">{label}</span>

      <div className="mixer__fader-track" onMouseDown={handleVolumeDown}>
        <div className="mixer__fader-fill" style={{ height: `${volume * 100}%` }} />
      </div>
      <span className="mixer__channel-db">{mute ? '-\u221E' : `${Math.round(volume * 100)}%`}</span>

      {onPan && (
        <div className="mixer__pan-knob" onMouseDown={handlePanDown} title={`Pan: ${panDisplay}`}>
          <span className="mixer__pan-label">{panDisplay}</span>
        </div>
      )}

      {(onMute || onSolo) && (
        <div className="mixer__channel-btns">
          {onMute && (
            <button
              className={`mixer__btn mixer__btn--mute${mute ? ' mixer__btn--active' : ''}`}
              onClick={onMute}
            >
              M
            </button>
          )}
          {onSolo && (
            <button
              className={`mixer__btn mixer__btn--solo${solo ? ' mixer__btn--active' : ''}`}
              onClick={onSolo}
            >
              S
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MixerPanel() {
  const mixerState = useMixer();

  return (
    <div className="mixer">
      <div className="mixer__header">
        <span className="mixer__title">MIXER</span>
      </div>
      <div className="mixer__channels">
        {mixerState.channels.map((ch, i) => (
          <ChannelFader
            key={i}
            label={ch.label}
            volume={ch.volume}
            pan={ch.pan}
            mute={ch.mute}
            solo={ch.solo}
            dimmed={!ch.connected}
            onVolume={(v) => mixer.setChannelVolume(i, v)}
            onPan={(v) => mixer.setChannelPan(i, v)}
            onMute={() => mixer.toggleChannelMute(i)}
            onSolo={() => mixer.toggleChannelSolo(i)}
          />
        ))}
        <ChannelFader
          label="MST"
          volume={mixerState.masterVolume}
          isMaster
          onVolume={(v) => mixer.setMasterVolume(v)}
        />
      </div>
    </div>
  );
}
