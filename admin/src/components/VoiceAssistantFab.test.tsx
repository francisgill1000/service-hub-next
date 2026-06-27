import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceAssistantFab } from './VoiceAssistantFab';

vi.mock('./VoiceAssistantPanel', () => ({
  VoiceAssistantPanel: ({ onClose }: { onClose: () => void }) => <div data-testid="panel" onClick={onClose}>panel</div>,
}));

describe('VoiceAssistantFab', () => {
  it('opens the panel when tapped', () => {
    render(<VoiceAssistantFab />);
    expect(screen.queryByTestId('panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /assistant/i }));
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});
