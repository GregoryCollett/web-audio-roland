import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <button
        className="collapsible__header"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="collapsible__arrow">{open ? '▼' : '▶'}</span>
        <span className="collapsible__title">{title}</span>
      </button>
      {open && <div className="collapsible__content">{children}</div>}
    </div>
  );
}
