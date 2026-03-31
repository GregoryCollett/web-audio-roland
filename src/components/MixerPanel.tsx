import { useCallback, useRef } from 'react';
import { useMixer, mixer } from '../hooks/useTransport';
import type { ChannelState } from '../engine/MixerEngine';

// --- Fader: the reusable drag-to-set-value vertical bar ---

interface FaderProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

function Fader({ value, onChange, className }: FaderProps) {
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

  return (
    <div className={`mixer__fader-track${className ? ` ${className}` : ''}`} onMouseDown={handleMouseDown}>
      <div className="mixer__fader-fill" style={{ height: `${value * 100}%` }} />
    </div>
  );
}

// --- Channel: label + fader + pan + mute/solo ---

function Channel({ index, channel }: { index: number; channel: ChannelState }) {
  const panDisplay = channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.round(Math.abs(channel.pan) * 100)}` : `R${Math.round(channel.pan * 100)}`;

  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handlePanDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = channel.pan;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = (startY.current - e.clientY) / 100;
        mixer.setChannelPan(index, Math.max(-1, Math.min(1, startValue.current + delta)));
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

  return (
    <div className={`mixer__channel${channel.connected ? '' : ' mixer__channel--empty'}`}>
      <span className="mixer__channel-label">{channel.label}</span>
      <Fader value={channel.volume} onChange={(v) => mixer.setChannelVolume(index, v)} />
      <span className="mixer__channel-db">{channel.mute ? '-\u221E' : `${Math.round(channel.volume * 100)}%`}</span>
      <div className="mixer__pan-knob" onMouseDown={handlePanDown} title={`Pan: ${panDisplay}`}>
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

// --- MixerPanel ---

export function MixerPanel() {
  const mixerState = useMixer();

  return (
    <div className="mixer">
      <div className="mixer__header">
        <span className="mixer__title">MIXER</span>
      </div>
      <div className="mixer__channels">
        {mixerState.channels.map((ch, i) => (
          <Channel key={i} index={i} channel={ch} />
        ))}
        <div className="mixer__master-channel">
          <span className="mixer__channel-label">MST</span>
          <Fader value={mixerState.masterVolume} onChange={(v) => mixer.setMasterVolume(v)} />
          <span className="mixer__channel-db">{Math.round(mixerState.masterVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
