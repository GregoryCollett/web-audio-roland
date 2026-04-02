# UI Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the UI with accordion layout, per-module accent colors, sticky transport, collapsible sub-sections, improved knobs, branded init overlay, and responsive sizing.

**Architecture:** Primarily CSS and component prop changes. New `CollapsibleSection` shared component. App.tsx replaces `focusPanel` state with `expandedModule` for accordion behavior. Each module section component gains `expanded`/`onToggle` props. Knob gets drag tooltip, active state, and double-click reset. No engine changes.

**Tech Stack:** React 19, CSS custom properties, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-02-ui-improvements-design.md`

---

## File Map

```
src/components/
  shared/
    CollapsibleSection.tsx   — NEW: reusable collapsible wrapper
    Knob.tsx                 — MODIFIED: tooltip, active state, double-click reset
    InitOverlay.tsx          — MODIFIED: branded splash with animation
  App.tsx                    — MODIFIED: accordion state, module color classes
  drum/
    DrumHeader.tsx           — becomes part of accordion header
  bass/
    BassSection.tsx          — MODIFIED: expanded/onToggle, accordion header
  synth/
    SynthSection.tsx         — MODIFIED: expanded/onToggle, accordion header, collapsible sub-sections
  subtractor/
    SubtractorSection.tsx    — MODIFIED: expanded/onToggle, accordion header, collapsible sub-sections
  mixer/
    MixerPanel.tsx           — MODIFIED: expanded/onToggle, accordion header
  master/
    MasterSection.tsx        — MODIFIED: expanded/onToggle, accordion header
  transport/
    Transport.tsx            — MODIFIED: sticky positioning
src/hooks/
  useKeyboard.ts             — MODIFIED: Tab cycles expandedModule
src/styles/
  index.css                  — MODIFIED: accordion, module colors, sticky, responsive, knob improvements, init overlay, collapsible sections
src/components/__tests__/
  App.test.tsx               — MODIFIED: update for accordion behavior
```

---

### Task 1: CSS Foundation — Module Colors, Responsive Layout, Sticky Transport

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Add module color custom properties and responsive root layout**

Add module color variables to `:root`:
```css
--accent-909: #ff6b35;
--accent-303: #22d3ee;
--accent-sh2: #a78bfa;
--accent-sub: #fb923c;
--accent-utility: #999;
```

Add module color classes:
```css
.module--909 { --module-accent: var(--accent-909); }
.module--303 { --module-accent: var(--accent-303); }
.module--sh2 { --module-accent: var(--accent-sh2); }
.module--sub { --module-accent: var(--accent-sub); }
.module--mixer { --module-accent: var(--accent-utility); }
.module--master { --module-accent: var(--accent-utility); }
```

Update body and #root for responsive layout:
```css
body {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  /* Remove: display: flex; justify-content: center; align-items: center; */
}

#root {
  max-width: min(900px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 16px 0;
}
```

Make transport sticky:
```css
.transport {
  position: sticky;
  top: 0;
  z-index: 40;
  /* keep existing styles */
}
```

- [ ] **Step 2: Add accordion panel styles**

```css
/* Accordion panel */
.module-panel {
  margin-top: 8px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border-left: 3px solid var(--module-accent, var(--accent));
}

.module-panel__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.module-panel__header:hover {
  background: var(--bg-surface);
}

.module-panel__arrow {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s;
  min-width: 12px;
}

.module-panel__arrow--open {
  transform: rotate(90deg);
}

.module-panel__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--module-accent, var(--accent));
  letter-spacing: 2px;
}

.module-panel__subtitle {
  font-size: 10px;
  color: var(--text-muted);
}

.module-panel__presets {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.module-panel__content {
  padding: 16px 20px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border);
}
```

- [ ] **Step 3: Replace all `var(--accent)` with `var(--module-accent, var(--accent))` in step, knob, and playhead classes**

Update these CSS rules to use module accent:
- `.step-btn--active` background
- `.knob__dial` conic-gradient (this is inline style, handled in Knob.tsx — Task 4)
- `.playhead__indicator--active` background
- `.accent-btn--active` background
- `.bass-step--note` background
- `.bass-step__accent` color

For each, replace `var(--accent)` with `var(--module-accent, var(--accent))`.

- [ ] **Step 4: Add collapsible section styles**

```css
.collapsible__header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
}

.collapsible__arrow {
  font-size: 8px;
  color: var(--text-muted);
  min-width: 10px;
}

.collapsible__title {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.collapsible__content {
  padding-top: 4px;
}
```

- [ ] **Step 5: Add knob improvement styles**

```css
.knob__dial--active {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
}

.knob__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface);
  color: var(--module-accent, var(--accent));
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  margin-bottom: 4px;
  border: 1px solid var(--border);
}

.knob {
  position: relative; /* needed for tooltip positioning */
}
```

- [ ] **Step 6: Add init overlay styles**

```css
.init-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.3s ease-out;
  gap: 24px;
}

.init-overlay--fading {
  opacity: 0;
  pointer-events: none;
}

.init-overlay__title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 6px;
}

.init-overlay__modules {
  display: flex;
  gap: 16px;
}

.init-overlay__module-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
}

.init-overlay__cta {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Waveform animation */
.init-overlay__wave {
  width: 300px;
  height: 60px;
}

.init-overlay__wave-path {
  stroke: var(--accent);
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 800;
  stroke-dashoffset: 800;
  animation: draw-wave 2s ease-in-out infinite alternate;
}

@keyframes draw-wave {
  to { stroke-dashoffset: 0; }
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add CSS foundation for accordion layout, module colors, sticky transport, responsive sizing"
```

---

### Task 2: Shared CollapsibleSection Component

**Files:**
- Create: `src/components/shared/CollapsibleSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/CollapsibleSection.tsx
git commit -m "feat: add CollapsibleSection shared component"
```

---

### Task 3: Knob Improvements — Tooltip, Active State, Double-Click Reset

**Files:**
- Modify: `src/components/shared/Knob.tsx`

- [ ] **Step 1: Rewrite Knob with improvements**

Update the Knob component to add:
- `isDragging` state (useState) — true during drag, false on mouseup
- While dragging: show tooltip above knob with current `displayValue` or percentage
- While dragging: add `knob__dial--active` class
- `onDoubleClick` handler: resets value to midpoint `(min + max) / 2`
- Use `var(--module-accent, var(--accent))` for the conic gradient (read from CSS variable via a ref, or just use the CSS variable in the inline style)

```tsx
import { useState, useCallback, useRef } from 'react';

export interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  displayValue?: string;
  onChange: (value: number) => void;
  size?: 'small' | 'medium';
}

export function Knob({ label, value, min = 0, max = 1, displayValue, onChange, size = 'medium' }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const range = max - min;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      startY.current = e.clientY;
      startValue.current = value;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = ((startY.current - e.clientY) / 150) * range;
        const newValue = Math.max(min, Math.min(max, startValue.current + delta));
        onChange(newValue);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [value, min, max, range, onChange],
  );

  const handleDoubleClick = useCallback(() => {
    onChange((min + max) / 2);
  }, [min, max, onChange]);

  const normalized = (value - min) / range;
  const arcDeg = normalized * 280;
  const background = `conic-gradient(from 220deg, var(--module-accent, var(--accent)) 0deg, var(--module-accent, var(--accent)) ${arcDeg}deg, var(--border) ${arcDeg}deg)`;

  const sizeClass = size === 'small' ? ' knob--small' : '';
  const tooltipText = displayValue ?? `${Math.round(normalized * 100)}%`;

  return (
    <div className={`knob${sizeClass}`}>
      {isDragging && (
        <span className="knob__tooltip">{tooltipText}</span>
      )}
      <div
        className={`knob__dial${isDragging ? ' knob__dial--active' : ''}`}
        style={{ background }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title={`${label}${displayValue ? `: ${displayValue}` : ''}`}
      >
        <div className="knob__center" />
      </div>
      {displayValue && <span className="knob__value">{displayValue}</span>}
      <span className="knob__label">{label}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Knob.tsx
git commit -m "feat: add knob tooltip, active state, and double-click reset"
```

---

### Task 4: Init Overlay Refresh

**Files:**
- Modify: `src/components/shared/InitOverlay.tsx`

- [ ] **Step 1: Rewrite with branded splash**

```tsx
import { useState } from 'react';
import { transport, mixer } from '../../hooks/useTransport';

interface InitOverlayProps {
  onInit: () => void;
}

export function InitOverlay({ onInit }: InitOverlayProps) {
  const [fading, setFading] = useState(false);

  const handleClick = async () => {
    await transport.init();
    const ctx = transport.getAudioContext();
    const compressorInput = transport.getCompressorInput();
    if (ctx && compressorInput) {
      mixer.initAudio(ctx, compressorInput);
    }
    setFading(true);
    setTimeout(onInit, 300);
  };

  return (
    <div
      className={`init-overlay${fading ? ' init-overlay--fading' : ''}`}
      onClick={handleClick}
    >
      <svg className="init-overlay__wave" viewBox="0 0 300 60">
        <path
          className="init-overlay__wave-path"
          d="M0 30 Q25 5 50 30 Q75 55 100 30 Q125 5 150 30 Q175 55 200 30 Q225 5 250 30 Q275 55 300 30"
        />
      </svg>
      <span className="init-overlay__title">WEB AUDIO ROLAND</span>
      <div className="init-overlay__modules">
        <span className="init-overlay__module-name" style={{ color: '#ff6b35' }}>GC-909</span>
        <span className="init-overlay__module-name" style={{ color: '#22d3ee' }}>GC-303</span>
        <span className="init-overlay__module-name" style={{ color: '#a78bfa' }}>GC-2</span>
        <span className="init-overlay__module-name" style={{ color: '#fb923c' }}>GC-SUB</span>
      </div>
      <span className="init-overlay__cta">Click anywhere to start</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/InitOverlay.tsx
git commit -m "feat: branded init overlay with waveform animation"
```

---

### Task 5: Accordion Layout — App.tsx + All Module Sections

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/bass/BassSection.tsx`
- Modify: `src/components/synth/SynthSection.tsx`
- Modify: `src/components/subtractor/SubtractorSection.tsx`
- Modify: `src/components/mixer/MixerPanel.tsx`
- Modify: `src/components/master/MasterSection.tsx`

This is the largest task — converting all modules to the accordion pattern.

- [ ] **Step 1: Rewrite App.tsx with accordion state**

Replace `focusPanel` with `expandedModule`. Each module section gets `expanded` and `onToggle` props. The 909 drum section is directly in App (not its own section component), so it needs the accordion wrapper inline.

```tsx
import { useState } from 'react';
import type { InstrumentId } from '../engine/types';
import { useKeyboard } from '../hooks/useKeyboard';
import { InitOverlay } from './shared/InitOverlay';
import { Transport } from './transport/Transport';
import { DrumHeader } from './drum/DrumHeader';
import { InstrumentSelector } from './drum/InstrumentSelector';
import { ParamKnobs } from './drum/ParamKnobs';
import { StepGrid } from './drum/StepGrid';
import { AccentRow } from './drum/AccentRow';
import { Playhead } from './shared/Playhead';
import { MasterSection } from './master/MasterSection';
import { BassSection } from './bass/BassSection';
import { MixerPanel } from './mixer/MixerPanel';
import { SynthSection } from './synth/SynthSection';
import { SubtractorSection } from './subtractor/SubtractorSection';

type ModuleId = 'drum' | 'bass' | 'synth' | 'subtractor' | 'mixer' | 'master';

export function App() {
  const [initialized, setInitialized] = useState(false);
  const [expandedModule, setExpandedModule] = useState<ModuleId>('drum');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>('kick');
  const [selectedStep, setSelectedStep] = useState(0);
  const [bassSelectedStep, setBassSelectedStep] = useState(0);
  const [synthSelectedStep, setSynthSelectedStep] = useState(0);
  const [subtractorSelectedStep, setSubtractorSelectedStep] = useState(0);

  const toggleModule = (id: ModuleId) => {
    setExpandedModule(prev => prev === id ? prev : id);
  };

  useKeyboard({
    selectedInstrument,
    setSelectedInstrument,
    selectedStep,
    setSelectedStep,
    expandedModule,
    setExpandedModule,
    bassSelectedStep,
    setBassSelectedStep,
    synthSelectedStep,
    setSynthSelectedStep,
    subtractorSelectedStep,
    setSubtractorSelectedStep,
  });

  return (
    <>
      {!initialized && <InitOverlay onInit={() => setInitialized(true)} />}
      <Transport />

      {/* GC-909 Drum Machine */}
      <div className="module-panel module--909">
        <div className="module-panel__header" onClick={() => toggleModule('drum')}>
          <span className={`module-panel__arrow${expandedModule === 'drum' ? ' module-panel__arrow--open' : ''}`}>▶</span>
          <span className="module-panel__title">GC-909</span>
          <span className="module-panel__subtitle">RHYTHM COMPOSER</span>
        </div>
        {expandedModule === 'drum' && (
          <div className="module-panel__content">
            <DrumHeader />
            <InstrumentSelector selected={selectedInstrument} onSelect={setSelectedInstrument} />
            <ParamKnobs instrument={selectedInstrument} />
            <StepGrid instrument={selectedInstrument} selectedStep={selectedStep} />
            <AccentRow selectedStep={selectedStep} />
            <Playhead />
          </div>
        )}
      </div>

      <BassSection
        selectedStep={bassSelectedStep}
        onSelectStep={setBassSelectedStep}
        expanded={expandedModule === 'bass'}
        onToggle={() => toggleModule('bass')}
      />

      <SynthSection
        selectedStep={synthSelectedStep}
        onSelectStep={setSynthSelectedStep}
        expanded={expandedModule === 'synth'}
        onToggle={() => toggleModule('synth')}
      />

      <SubtractorSection
        selectedStep={subtractorSelectedStep}
        onSelectStep={setSubtractorSelectedStep}
        expanded={expandedModule === 'subtractor'}
        onToggle={() => toggleModule('subtractor')}
      />

      <MixerPanel
        expanded={expandedModule === 'mixer'}
        onToggle={() => toggleModule('mixer')}
      />

      <MasterSection
        expanded={expandedModule === 'master'}
        onToggle={() => toggleModule('master')}
      />
    </>
  );
}
```

- [ ] **Step 2: Update BassSection with accordion**

```tsx
import { BassHeader } from './BassHeader';
import { BassKnobs } from './BassKnobs';
import { BassStepGrid } from './BassStepGrid';
import { BassStepEditor } from './BassStepEditor';
import { Playhead } from '../shared/Playhead';

interface BassSectionProps {
  selectedStep: number;
  onSelectStep: (step: number) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function BassSection({ selectedStep, onSelectStep, expanded, onToggle }: BassSectionProps) {
  return (
    <div className="module-panel module--303">
      <div className="module-panel__header" onClick={onToggle}>
        <span className={`module-panel__arrow${expanded ? ' module-panel__arrow--open' : ''}`}>▶</span>
        <span className="module-panel__title">GC-303</span>
        <span className="module-panel__subtitle">BASS LINE</span>
      </div>
      {expanded && (
        <div className="module-panel__content">
          <BassHeader />
          <BassKnobs />
          <BassStepGrid selectedStep={selectedStep} onSelectStep={onSelectStep} />
          <Playhead />
          <BassStepEditor selectedStep={selectedStep} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update SynthSection with accordion + collapsible sub-sections**

Same accordion wrapper pattern as Bass. Import `CollapsibleSection` from `../shared/CollapsibleSection`. Wrap `SynthOscSection`, `SynthFilterSection`, `SynthAmpSection`, `SynthLFOSection` each in a `CollapsibleSection`. Step grid/playhead/editor stay uncollapsible.

- [ ] **Step 4: Update SubtractorSection with accordion + collapsible sub-sections**

Same pattern. Wrap `SubtractorOscSection`, `SubtractorFilterSection`, `SubtractorAmpSection`, `SubtractorModSection`, `SubtractorModMatrix` in `CollapsibleSection`s.

- [ ] **Step 5: Update MixerPanel with accordion**

Accept `expanded: boolean` and `onToggle: () => void` props. When not expanded, show only the accordion header. When expanded, show full mixer content.

- [ ] **Step 6: Update MasterSection with accordion**

Same accordion pattern as mixer.

- [ ] **Step 7: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Update App.test.tsx if needed — the accordion changes may require updated assertions.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: convert all modules to accordion layout with collapsible sub-sections"
```

---

### Task 6: Update Keyboard Handler for Accordion

**Files:**
- Modify: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Replace focusPanel with expandedModule**

Update `KeyboardState` interface:
- Remove `focusPanel` and `setFocusPanel`
- Add `expandedModule: ModuleId` and `setExpandedModule: (id: ModuleId) => void`
- `ModuleId` = `'drum' | 'bass' | 'synth' | 'subtractor' | 'mixer' | 'master'`

Tab handler cycles: drum → bass → synth → subtractor → drum (skip mixer/master — they don't have step sequencers).

All panel-specific key handling checks `expandedModule` instead of `focusPanel`.

- [ ] **Step 2: Verify tests pass**

Run: `npx vitest run`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useKeyboard.ts
git commit -m "feat: update keyboard handler for accordion module switching"
```

---

### Task 7: Final Verification + Cleanup

- [ ] **Step 1: Remove old CSS classes**

Remove unused CSS: `.tr909--focused`, `.bass-section--focused`, `.synth-section--focused`, `.subtractor-section--focused`, and the old `.tr909__header`, `.tr909__title-row`, `.tr909__header-controls` classes that are now handled by the accordion header.

Clean up any remaining `var(--accent)` in step/knob/playhead CSS that should be `var(--module-accent, var(--accent))`.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "chore: clean up old CSS classes and finalize UI improvements"
git push
```
