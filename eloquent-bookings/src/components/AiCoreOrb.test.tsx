import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiCoreOrb } from './AiCoreOrb';

describe('AiCoreOrb', () => {
  it('renders the monogram letter', () => {
    render(<AiCoreOrb state="idle" letter="G" />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('carries the matching state class for every state', () => {
    for (const s of ['idle', 'listening', 'thinking', 'talking'] as const) {
      const { getByTestId, unmount } = render(<AiCoreOrb state={s} letter="G" />);
      expect(getByTestId('ai-core')).toHaveClass('c-core', `state-${s}`);
      unmount();
    }
  });
});
