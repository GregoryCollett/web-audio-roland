import { transport, mixer } from '../../hooks/useTransport';

interface InitOverlayProps {
  onInit: () => void;
}

export function InitOverlay({ onInit }: InitOverlayProps) {
  const handleClick = async () => {
    await transport.init();
    const ctx = transport.getAudioContext();
    const compressorInput = transport.getCompressorInput();
    if (ctx && compressorInput) {
      mixer.initAudio(ctx, compressorInput);
    }
    onInit();
  };

  return (
    <div className="init-overlay">
      <button className="init-overlay__btn" onClick={handleClick}>
        Start
      </button>
    </div>
  );
}
