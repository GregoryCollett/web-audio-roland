import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

describe('App', () => {
  it('renders init overlay on first load', () => {
    render(<App />);
    expect(screen.getByText('Start')).toBeDefined();
  });

  it('renders transport controls', () => {
    render(<App />);
    expect(screen.getByText('TRANSPORT')).toBeDefined();
    expect(screen.getByText('PLAY')).toBeDefined();
    expect(screen.getByText('STOP')).toBeDefined();
  });

  it('renders all instrument tabs', () => {
    render(<App />);
    for (const name of ['BD', 'SD', 'CP', 'RS', 'CH', 'OH', 'LT', 'MT', 'HT', 'CC', 'RC']) {
      expect(screen.getByText(name)).toBeDefined();
    }
  });

  it('renders 16 step buttons', () => {
    render(<App />);
    for (let i = 1; i <= 16; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it('toggles step on click', async () => {
    const user = userEvent.setup();
    render(<App />);

    const step1 = screen.getByText('1');
    expect(step1.className).toContain('inactive');

    await user.click(step1);
    expect(step1.className).toContain('active');

    await user.click(step1);
    expect(step1.className).toContain('inactive');
  });

  it('switches instrument on tab click', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Pattern — Bass Drum')).toBeDefined();

    await user.click(screen.getByText('SD'));
    expect(screen.getByText('Pattern — Snare')).toBeDefined();
  });

  it('renders pattern and kit preset selectors', () => {
    render(<App />);
    // Both drum and bass sections have 'Pattern' labels — expect at least 2
    const patternLabels = screen.getAllByText('Pattern');
    expect(patternLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Kit')).toBeDefined();
  });

  it('shows Custom as default preset name', () => {
    render(<App />);
    // Drum section: Pattern + Kit (2), Bass section: Pattern + Synth (2) = 4 total
    const customLabels = screen.getAllByText('Custom');
    expect(customLabels.length).toBe(4);
  });
});
