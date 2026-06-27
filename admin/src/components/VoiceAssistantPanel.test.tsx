import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

vi.mock('@/lib/assistant', () => ({
  postText: vi.fn().mockResolvedValue({ transcript: 'hi', reply_text: 'You made 50 dirhams.', reply_audio_url: null, history: [] }),
  postVoice: vi.fn(),
}));
vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: () => ({ recording: false, start: vi.fn(), stop: vi.fn(), supported: true }),
}));

describe('VoiceAssistantPanel', () => {
  it('shows the assistant reply after a typed question', async () => {
    render(<VoiceAssistantPanel onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/type/i), { target: { value: 'how much' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByText('You made 50 dirhams.')).toBeInTheDocument());
  });
});
