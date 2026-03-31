import { transport } from '../hooks/useTransport';

interface InitOverlayProps {
  onInit: () => void;
}

export function InitOverlay({ onInit }: InitOverlayProps) {
  const handleClick = async () => {
    await transport.init();
    onInit();
  };

  return (
    <div className="init-overlay">
      <button className="init-overlay__btn" onClick={handleClick}>
        Start TR-909
      </button>
    </div>
  );
}
