import { useState, useRef, useEffect } from 'react';

interface PresetSelectorProps {
  label: string;
  presets: { id: string; name: string; builtIn: boolean }[];
  activeId: string | null;
  onLoad: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

export function PresetSelector({
  label,
  presets,
  activeId,
  onLoad,
  onSave,
  onDelete,
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const activePreset = activeId != null ? presets.find((p) => p.id === activeId) : null;
  const displayName = activePreset ? activePreset.name : 'Custom';

  const builtIns = presets.filter((p) => p.builtIn);
  const userPresets = presets.filter((p) => !p.builtIn);

  useEffect(() => {
    if (showSaveForm && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSaveForm]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSaveForm(false);
        setSaveName('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  function handleToggle() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260);
    }
    setOpen((prev) => !prev);
    if (open) {
      setShowSaveForm(false);
      setSaveName('');
    }
  }

  function handleLoad(id: string) {
    onLoad(id);
    setOpen(false);
    setShowSaveForm(false);
    setSaveName('');
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    onDelete(id);
  }

  function handleSaveClick() {
    setShowSaveForm(true);
  }

  function handleSaveConfirm() {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setShowSaveForm(false);
    setSaveName('');
    setOpen(false);
  }

  function handleSaveKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSaveConfirm();
    } else if (e.key === 'Escape') {
      setShowSaveForm(false);
      setSaveName('');
    }
  }

  return (
    <div className="preset-selector" ref={containerRef}>
      <div className="preset-selector__label">{label}</div>
      <button className="preset-selector__trigger" onClick={handleToggle} type="button">
        <span className="preset-selector__name">{displayName}</span>
        <span className="preset-selector__arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={`preset-selector__dropdown${dropUp ? ' preset-selector__dropdown--up' : ''}`}>
          {builtIns.map((preset) => (
            <button
              key={preset.id}
              className={`preset-selector__item${activeId === preset.id ? ' preset-selector__item--active' : ''}`}
              onClick={() => handleLoad(preset.id)}
              type="button"
            >
              {preset.name}
            </button>
          ))}

          {builtIns.length > 0 && userPresets.length > 0 && (
            <div className="preset-selector__divider" />
          )}

          {userPresets.map((preset) => (
            <div key={preset.id} className="preset-selector__item-row">
              <button
                className={`preset-selector__item${activeId === preset.id ? ' preset-selector__item--active' : ''}`}
                onClick={() => handleLoad(preset.id)}
                type="button"
              >
                {preset.name}
              </button>
              <button
                className="preset-selector__delete"
                onClick={(e) => handleDelete(e, preset.id)}
                type="button"
                aria-label={`Delete ${preset.name}`}
              >
                ×
              </button>
            </div>
          ))}

          {builtIns.length > 0 || userPresets.length > 0 ? (
            <div className="preset-selector__divider" />
          ) : null}

          {showSaveForm ? (
            <div className="preset-selector__save-form">
              <input
                ref={saveInputRef}
                className="preset-selector__save-input"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={handleSaveKeyDown}
                placeholder="Name..."
              />
              <button
                className="preset-selector__save-confirm"
                onClick={handleSaveConfirm}
                type="button"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              className="preset-selector__item preset-selector__save-btn"
              onClick={handleSaveClick}
              type="button"
            >
              Save Current
            </button>
          )}
        </div>
      )}
    </div>
  );
}
