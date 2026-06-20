import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiCoreOrb } from './AiCoreOrb';

describe('AiCoreOrb', () => {
  it('renders the monogram letter', () => {
    render(<AiCoreOrb state="idle" letter="G" />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('renders an image when imageSrc is given, instead of the letter', () => {
    const { container } = render(
      <AiCoreOrb state="idle" letter="G" imageSrc="/influencer-orb.png" />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute('src', '/influencer-orb.png');
    expect(container.querySelector('.c-core-letter')).toBeNull();
  });

  it('carries the matching state class for every state', () => {
    for (const s of ['idle', 'listening', 'thinking', 'talking'] as const) {
      const { getByTestId, unmount } = render(<AiCoreOrb state={s} letter="G" />);
      expect(getByTestId('ai-core')).toHaveClass('c-core', `state-${s}`);
      unmount();
    }
  });
});
