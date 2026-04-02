# UI Improvements — Design Spec

## Overview

Overhaul the UI to address scrolling, visual identity, interactivity, and responsiveness. The app currently has 6+ panels stacked vertically with no way to collapse or navigate between them. All modules look identical. Transport controls scroll off-screen. Knob interactions have no feedback.

## 1. Accordion Layout

All modules become collapsible accordion panels. Click the header to expand/collapse.

**Behavior:**
- Only one instrument module expanded at a time (auto-collapse others when one opens)
- Mixer and Master can be expanded independently of instrument modules
- Clicking an already-expanded header collapses it
- On initial load, GC-909 starts expanded
- Tab keyboard shortcut cycles the expanded module (replaces the current focus panel behavior)
- Collapsed headers show: accent color left border, module name, preset name (if loaded), expand arrow (▶/▼)

**Header bar (collapsed):**
```
┌─── ▶ GC-909  RHYTHM COMPOSER  ─────────────────────────────┐
└─────────────────────────────────────────────────────────────┘
```

**Header bar (expanded):**
```
┌─── ▼ GC-303  BASS LINE  [Pattern: Acid Line] [Synth: Classic Acid] ──┐
│  ... full module content ...                                          │
└───────────────────────────────────────────────────────────────────────┘
```

**Implementation:** Add `expandedModule` state to App.tsx (replacing `focusPanel`). Each module section component receives `expanded: boolean` and `onToggle: () => void`. When `expanded` is false, render only the header bar. The `useKeyboard` Tab handler sets `expandedModule` instead of `focusPanel`.

## 2. Module Accent Colors

Each module gets a unique CSS custom property for its accent color:

| Module | Color | Hex | Character |
|--------|-------|-----|-----------|
| GC-909 | Orange | `#ff6b35` | Warm, punchy, classic |
| GC-303 | Cyan | `#22d3ee` | Cool, electric, acid |
| GC-2 | Lavender | `#a78bfa` | Soft, analog, synthy |
| GC-SUB | Peach | `#fb923c` | Warm but distinct from 909 |
| Mixer | Gray | `#999999` | Neutral utility |
| Master | Gray | `#999999` | Neutral utility |

**Where color applies:**
- Module header title text
- Left border accent strip (3px solid)
- Active step buttons
- Knob arc fill
- Focused/expanded outline
- Playhead indicator

**Implementation:** Each module section wraps its content in a div with a CSS class that sets `--module-accent` custom property. All child components that currently use `var(--accent)` will use `var(--module-accent, var(--accent))` instead — falling back to the global orange if no module accent is set.

```css
.module--909 { --module-accent: #ff6b35; }
.module--303 { --module-accent: #22d3ee; }
.module--sh2 { --module-accent: #a78bfa; }
.module--sub { --module-accent: #fb923c; }
```

Components use `var(--module-accent)` for: step-btn--active background, knob arc, playhead indicator, header title, accent border.

## 3. Sticky Transport

```css
.transport {
  position: sticky;
  top: 0;
  z-index: 40;
}
```

The transport bar sticks to the top of the viewport when scrolling. Always visible regardless of which module is expanded.

## 4. Collapsible Sub-Sections

Within the SH-2 and Subtractor modules, individual parameter sections (OSC, Filter, Amp, LFO, Mod Matrix) can be collapsed independently.

**Always visible (not collapsible):** step grid, playhead, step editor — these are the primary interaction surface.

**Collapsible:** oscillator section, filter section, amp section, LFO section, mod matrix.

**Implementation:** Each collapsible section gets a clickable title bar that toggles visibility of its content. State is local to the component (useState). Collapsed state shows just the section title with a ▶ indicator.

```tsx
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible">
      <button className="collapsible__header" onClick={() => setOpen(!open)}>
        <span className="collapsible__arrow">{open ? '▼' : '▶'}</span>
        <span className="collapsible__title">{title}</span>
      </button>
      {open && <div className="collapsible__content">{children}</div>}
    </div>
  );
}
```

This component goes in `shared/CollapsibleSection.tsx`. The SH-2 and Subtractor section components wrap their sub-sections with it. The 909 and 303 are simple enough to not need this.

## 5. Knob Improvements

Three enhancements to the shared `Knob` component:

**A. Value tooltip while dragging:**
- Show a small floating label above the knob displaying the current value
- Only visible during drag (appears on mousedown, disappears on mouseup)
- Uses the `displayValue` prop if provided, otherwise shows the raw value as percentage

**B. Active state:**
- While dragging, the knob dial gets a brighter ring/glow effect
- CSS class `knob__dial--active` added during drag, removed on mouseup

**C. Double-click to reset:**
- Double-clicking the knob resets it to the center/default value
- For 0-1 range knobs, resets to 0.5
- For knobs with explicit min/max, resets to the midpoint

**Implementation:** All changes are in `shared/Knob.tsx` + CSS. Add `isDragging` state. On mousedown set `isDragging = true`, on mouseup set `false`. Render tooltip conditionally. Add `onDoubleClick` handler.

## 6. Init Overlay Refresh

Replace the plain "Start" button with a branded splash:

- App title "WEB AUDIO ROLAND" in large text
- Animated waveform visualization (CSS-only — animating SVG path or gradient)
- Four module names listed: GC-909 / GC-303 / GC-2 / GC-SUB
- "Click anywhere to start" instruction text
- On click: fade-out animation (300ms opacity transition) then remove from DOM

**Implementation:** Update `shared/InitOverlay.tsx` with new markup and CSS. Add fade-out class on click, remove component after transition ends.

## 7. Responsive Width

Replace fixed `max-width: 900px` with responsive sizing:

```css
.transport,
.module-panel {
  max-width: min(900px, calc(100vw - 32px));
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
```

Body layout changes from `display: flex; align-items: center; justify-content: center` to a normal flow layout with auto margins — the current centering prevents scrolling properly with multiple panels.

```css
body {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
}

#root {
  max-width: min(900px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 16px 0;
}
```

## File Changes

**New files:**
```
src/components/shared/CollapsibleSection.tsx
```

**Modified files:**
```
src/styles/index.css           — accordion styles, module colors, sticky transport, responsive, collapsible sections, knob improvements, init overlay
src/components/App.tsx          — replace focusPanel with expandedModule, accordion toggle logic
src/components/shared/Knob.tsx  — dragging state, tooltip, double-click reset, active class
src/components/shared/InitOverlay.tsx — branded splash with animation
src/components/drum/DrumHeader.tsx    — accept onToggle/expanded props (or integrated into module panel)
src/components/bass/BassSection.tsx   — accept expanded/onToggle, render header-only when collapsed
src/components/synth/SynthSection.tsx — same + wrap sub-sections in CollapsibleSection
src/components/subtractor/SubtractorSection.tsx — same
src/components/mixer/MixerPanel.tsx   — accept expanded/onToggle
src/components/master/MasterSection.tsx — accept expanded/onToggle
src/hooks/useKeyboard.ts       — Tab cycles expandedModule instead of focusPanel
```

## Testing

- Existing tests updated for new props (expanded/onToggle)
- App.test.tsx: verify accordion behavior — only one instrument module expanded at a time
- Knob: verify double-click resets value
- CollapsibleSection: verify toggle behavior
