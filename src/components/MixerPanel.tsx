import { useCallback, useRef } from 'react';
import { useMixer, mixer } from '../hooks/useTransport';
import type { ChannelState } from '../engine/MixerEngine';

function ChannelFader({ index, channel }: { index: number; channel: ChannelState }) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = channel.volume;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 150;
        const newValue = Math.max(0, Math.min(1, startValue.current + delta));
        mixer.setChannelVolume(index, newValue);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [index, channel.volume],
  );

  const handlePanMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = channel.pan;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 100;
        const newValue = Math.max(-1, Math.min(1, startValue.current + delta));
        mixer.setChannelPan(index, newValue);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [index, channel.pan],
  );

  const faderHeight = channel.volume * 100;
  const panDisplay = channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.round(Math.abs(channel.pan) * 100)}` : `R${Math.round(channel.pan * 100)}`;

  return (
    <div className={`mixer__channel${channel.connected ? '' : ' mixer__channel--empty'}`}>
      <span className="mixer__channel-label">{channel.label}</span>

      <div className="mixer__fader-track" onMouseDown={handleMouseDown}>
        <div className="mixer__fader-fill" style={{ height: `${faderHeight}%` }} />
      </div>
      <span className="mixer__channel-db">{channel.mute ? '-∞' : `${Math.round(channel.volume * 100)}%`}</span>

      <div
        className="mixer__pan-knob"
        onMouseDown={handlePanMouseDown}
        title={`Pan: ${panDisplay}`}
      >
        <span className="mixer__pan-label">{panDisplay}</span>
      </div>

      <div className="mixer__channel-btns">
        <button
          className={`mixer__btn mixer__btn--mute${channel.mute ? ' mixer__btn--active' : ''}`}
          onClick={() => mixer.toggleChannelMute(index)}
        >
          M
        </button>
        <button
          className={`mixer__btn mixer__btn--solo${channel.solo ? ' mixer__btn--active' : ''}`}
          onClick={() => mixer.toggleChannelSolo(index)}
        >
          S
        </button>
      </div>
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
          <ChannelFader key={i} index={i} channel={ch} />
        ))}
        <div className="mixer__master-channel">
          <span className="mixer__channel-label">MST</span>
          <div className="mixer__fader-track">
            <div className="mixer__fader-fill" style={{ height: `${mixerState.masterVolume * 100}%` }} />
          </div>
          <span className="mixer__channel-db">{Math.round(mixerState.masterVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
