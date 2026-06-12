import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import * as personaLib from '@/lib/persona';
import Assistant from './Assistant';

function setup() {
  storage.setJSON('shop_data', { id: 7, name: 'Acme' });
  storage.set('shop_token', 'tok');
  return render(<MemoryRouter><ShopProvider><Assistant /></ShopProvider></MemoryRouter>);
}

const DEFAULT_PROMPT = 'You are the warm, professional WhatsApp assistant for Acme, a salon business.';

describe('Assistant', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('shows the standard prompt when no custom persona is set', async () => {
    vi.spyOn(personaLib, 'getPersona').mockResolvedValue({
      persona: null, default_prompt: DEFAULT_PROMPT, effective_prompt: DEFAULT_PROMPT, using_custom: false,
    });

    setup();
    expect(await screen.findByText(/standard \(based on your category\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText('System prompt')).toHaveValue(DEFAULT_PROMPT);
    expect(screen.queryByRole('button', { name: /reset to standard/i })).not.toBeInTheDocument();
  });

  it('saves a custom prompt', async () => {
    vi.spyOn(personaLib, 'getPersona').mockResolvedValue({
      persona: null, default_prompt: DEFAULT_PROMPT, effective_prompt: DEFAULT_PROMPT, using_custom: false,
    });
    const save = vi.spyOn(personaLib, 'savePersona').mockResolvedValue({
      persona: 'You are Bella.', default_prompt: DEFAULT_PROMPT, effective_prompt: 'You are Bella.', using_custom: true,
    });

    setup();
    const box = await screen.findByLabelText('System prompt');
    const user = userEvent.setup();
    await user.clear(box);
    await user.type(box, 'You are Bella.');
    await user.click(screen.getByRole('button', { name: /save prompt/i }));

    expect(save).toHaveBeenCalledWith('You are Bella.');
    expect(await screen.findByText(/saved — your assistant now uses this prompt/i)).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset to standard/i })).toBeInTheDocument();
  });

  it('resets to the standard prompt', async () => {
    vi.spyOn(personaLib, 'getPersona').mockResolvedValue({
      persona: 'You are Bella.', default_prompt: DEFAULT_PROMPT, effective_prompt: 'You are Bella.', using_custom: true,
    });
    const save = vi.spyOn(personaLib, 'savePersona').mockResolvedValue({
      persona: null, default_prompt: DEFAULT_PROMPT, effective_prompt: DEFAULT_PROMPT, using_custom: false,
    });

    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /reset to standard/i }));

    expect(save).toHaveBeenCalledWith(null);
    expect(await screen.findByText(/back to the standard assistant/i)).toBeInTheDocument();
    expect(screen.getByLabelText('System prompt')).toHaveValue(DEFAULT_PROMPT);
  });

  it('shows an error when saving fails', async () => {
    vi.spyOn(personaLib, 'getPersona').mockResolvedValue({
      persona: null, default_prompt: DEFAULT_PROMPT, effective_prompt: DEFAULT_PROMPT, using_custom: false,
    });
    vi.spyOn(personaLib, 'savePersona').mockRejectedValue(new Error('network'));

    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /save prompt/i }));

    expect(await screen.findByText(/could not save/i)).toBeInTheDocument();
  });
});
