import { INSTRUMENT_IDS, type InstrumentId } from '../engine/types';

const DISPLAY_NAMES: Record<InstrumentId, string> = {
  kick: 'BD',
  snare: 'SD',
  clap: 'CP',
  rimshot: 'RS',
  closedHat: 'CH',
  openHat: 'OH',
  lowTom: 'LT',
  midTom: 'MT',
  hiTom: 'HT',
  crash: 'CC',
  ride: 'RC',
};

interface InstrumentSelectorProps {
  selected: InstrumentId;
  onSelect: (id: InstrumentId) => void;
}

export function InstrumentSelector({ selected, onSelect }: InstrumentSelectorProps) {
  return (
    <div className="instrument-selector">
      <div className="instrument-selector__label">Instrument</div>
      <div className="instrument-selector__tabs">
        {INSTRUMENT_IDS.map((id) => (
          <button
            key={id}
            className={`instrument-selector__tab${
              id === selected ? ' instrument-selector__tab--active' : ''
            }`}
            onClick={() => onSelect(id)}
          >
            {DISPLAY_NAMES[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
