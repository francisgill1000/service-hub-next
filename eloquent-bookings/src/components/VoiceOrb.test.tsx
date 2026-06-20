import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VoiceOrb } from './VoiceOrb';

describe('VoiceOrb', () => {
  it('reports speaking state on play and pause', () => {
    const onSpeakingChange = vi.fn();
    const { container } = render(
      <VoiceOrb src="https://example.com/a.mp3" letter="G" onSpeakingChange={onSpeakingChange} />,
    );
    const audio = container.querySelector('audio')!;
    fireEvent.play(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(true);
    fireEvent.pause(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(false);
    fireEvent.ended(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(false);
  });
});
