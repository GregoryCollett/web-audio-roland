import { useState } from 'react';
import { transport, mixer } from '../../hooks/useTransport';

interface InitOverlayProps {
  onInit: () => void;
}

export function InitOverlay({ onInit }: InitOverlayProps) {
  const [fading, setFading] = useState(false);

  const handleClick = async () => {
    await transport.init();
    const ctx = transport.getAudioContext();
    const compressorInput = transport.getCompressorInput();
    if (ctx && compressorInput) {
      mixer.initAudio(ctx, compressorInput);
    }
    setFading(true);
    setTimeout(onInit, 300);
  };

  return (
    <div
      className={`init-overlay${fading ? ' init-overlay--fading' : ''}`}
      onClick={handleClick}
    >
      <svg className="init-overlay__wave" viewBox="0 0 300 60">
        <path
          className="init-overlay__wave-path"
          d="M0 30 Q25 5 50 30 Q75 55 100 30 Q125 5 150 30 Q175 55 200 30 Q225 5 250 30 Q275 55 300 30"
        />
      </svg>
      <span className="init-overlay__title">WEB AUDIO ROLAND</span>
      <div className="init-overlay__modules">
        <span className="init-overlay__module-name" style={{ color: '#ff6b35' }}>GC-909</span>
        <span className="init-overlay__module-name" style={{ color: '#22d3ee' }}>GC-303</span>
        <span className="init-overlay__module-name" style={{ color: '#a78bfa' }}>GC-2</span>
        <span className="init-overlay__module-name" style={{ color: '#fb923c' }}>GC-SUB</span>
      </div>
      <span className="init-overlay__cta">Click anywhere to start</span>
    </div>
  );
}
