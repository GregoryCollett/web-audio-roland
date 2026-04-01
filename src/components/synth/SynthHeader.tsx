import { useSynthPresets, synthEngine } from '../../hooks/useSynth';
import { PresetSelector } from '../shared/PresetSelector';

export function SynthHeader() {
  const presets = useSynthPresets();

  return (
    <div className="synth-header">
      <div className="synth-header__title-row">
        <span className="synth-header__title">GC-2</span>
        <span className="synth-header__subtitle">SYNTHESIZER</span>
      </div>
      <div className="synth-header__controls">
        <PresetSelector
          label="Pattern"
          presets={presets.patterns}
          activeId={presets.activePatternId}
          onLoad={(id) => synthEngine.loadPatternPreset(id)}
          onSave={(name) => synthEngine.savePatternPreset(name)}
          onDelete={(id) => synthEngine.deletePatternPreset(id)}
        />
        <PresetSelector
          label="Sound"
          presets={presets.sounds}
          activeId={presets.activeSoundId}
          onLoad={(id) => synthEngine.loadSoundPreset(id)}
          onSave={(name) => synthEngine.saveSoundPreset(name)}
          onDelete={(id) => synthEngine.deleteSoundPreset(id)}
        />
      </div>
    </div>
  );
}
