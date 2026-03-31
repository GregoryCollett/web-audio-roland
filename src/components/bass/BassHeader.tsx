import { useBassPresets, useBassSynth, bassEngine } from '../../hooks/useBass';
import { PresetSelector } from '../shared/PresetSelector';

export function BassHeader() {
  const presets = useBassPresets();
  const synth = useBassSynth();

  return (
    <div className="bass-header">
      <div className="bass-header__title-row">
        <span className="bass-header__title">TB-303</span>
        <span className="bass-header__subtitle">BASS LINE</span>
      </div>
      <div className="bass-header__controls">
        <PresetSelector
          label="Pattern"
          presets={presets.patterns}
          activeId={presets.activePatternId}
          onLoad={(id) => bassEngine.loadPatternPreset(id)}
          onSave={(name) => bassEngine.savePatternPreset(name)}
          onDelete={(id) => bassEngine.deletePatternPreset(id)}
        />
        <PresetSelector
          label="Synth"
          presets={presets.synths}
          activeId={presets.activeSynthId}
          onLoad={(id) => bassEngine.loadSynthPreset(id)}
          onSave={(name) => bassEngine.saveSynthPreset(name)}
          onDelete={(id) => bassEngine.deleteSynthPreset(id)}
        />
        <button
          className="bass-header__waveform"
          onClick={() => bassEngine.setWaveform(synth.waveform === 'sawtooth' ? 'square' : 'sawtooth')}
        >
          {synth.waveform === 'sawtooth' ? 'SAW' : 'SQR'}
        </button>
      </div>
    </div>
  );
}
