import { useDrumPattern, drumEngine } from '../hooks/useDrum';

const GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

interface AccentRowProps {
  selectedStep?: number;
}

export function AccentRow({ selectedStep }: AccentRowProps) {
  const pattern = useDrumPattern();

  return (
    <div className="accent-row">
      <div className="accent-row__label">Accent</div>
      <div className="accent-row__steps">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="accent-row__group">
            {group.map((step) => (
              <button
                key={step}
                className={`accent-btn ${
                  pattern.accents[step] ? 'accent-btn--active' : 'accent-btn--inactive'
                }${step === selectedStep ? ' accent-btn--selected' : ''}`}
                onClick={() => drumEngine.toggleAccent(step)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
