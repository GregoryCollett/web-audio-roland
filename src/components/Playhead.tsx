import { useTransportSnapshot } from '../hooks/useTransport';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

export function Playhead() {
  const transport = useTransportSnapshot();

  return (
    <div className="playhead">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="playhead__group">
          {group.map((step) => (
            <div
              key={step}
              className={`playhead__indicator ${
                transport.playing && transport.currentStep === step
                  ? 'playhead__indicator--active'
                  : 'playhead__indicator--inactive'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
