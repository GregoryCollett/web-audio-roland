import { useSubtractorPresets, subtractorEngine } from '../../hooks/useSubtractor';
import { PresetSelector } from '../shared/PresetSelector';

export function SubtractorHeader() {
  const presets = useSubtractorPresets();

  return (
    <div className="synth-header">
      <div className="synth-header__title-row">
        <span className="synth-header__title">GC-SUB</span>
        <span className="synth-header__subtitle">SUBTRACTOR</span>
      </div>
      <div className="synth-header__controls">
        <PresetSelector
          label="Pattern"
          presets={presets.patterns}
          activeId={presets.activePatternId}
          onLoad={(id) => subtractorEngine.loadPatternPreset(id)}
          onSave={(name) => subtractorEngine.savePatternPreset(name)}
          onDelete={(id) => subtractorEngine.deletePatternPreset(id)}
        />
        <PresetSelector
          label="Sound"
          presets={presets.sounds}
          activeId={presets.activeSoundId}
          onLoad={(id) => subtractorEngine.loadSoundPreset(id)}
          onSave={(name) => subtractorEngine.saveSoundPreset(name)}
          onDelete={(id) => subtractorEngine.deleteSoundPreset(id)}
        />
      </div>
    </div>
  );
}
