import { useDrumPresets, drumEngine } from '../../hooks/useDrum';
import { PresetSelector } from '../shared/PresetSelector';

export function DrumHeader() {
  const presets = useDrumPresets();

  return (
    <div className="tr909__header">
      <div className="tr909__title-row">
        <span className="tr909__title">GC-909</span>
        <span className="tr909__subtitle">RHYTHM COMPOSER</span>
      </div>
      <div className="tr909__header-controls">
        <PresetSelector
          label="Pattern"
          presets={presets.patterns}
          activeId={presets.activePatternId}
          onLoad={(id) => drumEngine.loadPatternPreset(id)}
          onSave={(name) => drumEngine.savePatternPreset(name)}
          onDelete={(id) => drumEngine.deletePatternPreset(id)}
        />
        <PresetSelector
          label="Kit"
          presets={presets.kits}
          activeId={presets.activeKitId}
          onLoad={(id) => drumEngine.loadKitPreset(id)}
          onSave={(name) => drumEngine.saveKitPreset(name)}
          onDelete={(id) => drumEngine.deleteKitPreset(id)}
        />
      </div>
    </div>
  );
}
