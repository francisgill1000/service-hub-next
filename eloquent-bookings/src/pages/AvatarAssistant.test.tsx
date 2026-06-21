import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AvatarAssistant from './AvatarAssistant';

describe('AvatarAssistant', () => {
  it('embeds the LiveAvatar iframe with microphone permission', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/shop/5/assistant']}>
        <Routes><Route path="/shop/:id/assistant" element={<AvatarAssistant />} /></Routes>
      </MemoryRouter>,
    );
    const frame = container.querySelector('iframe');
    expect(frame).toBeTruthy();
    expect(frame!.getAttribute('src')).toContain('embed.liveavatar.com');
    expect(frame!.getAttribute('allow')).toContain('microphone');
  });
});
