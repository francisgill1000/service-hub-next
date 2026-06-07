import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import * as lib from '@/lib/botPrompts';
import MasterPrompts from './MasterPrompts';

function setup() {
  storage.setJSON('shop_data', { id: 1, name: 'Rezzy HQ', is_master: true });
  storage.set('shop_token', 'tok');
  return render(<MemoryRouter><ShopProvider><MasterPrompts /></ShopProvider></MemoryRouter>);
}

describe('MasterPrompts', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('lists prompts and marks the active one', async () => {
    vi.spyOn(lib, 'getBotPrompts').mockResolvedValue([
      { id: 1, name: 'Sales Bot', body: null, is_default: true, is_active: true },
      { id: 2, name: 'Salon', body: 'You are a salon assistant.', is_default: false, is_active: false },
    ]);

    setup();

    expect(await screen.findByText('Sales Bot')).toBeInTheDocument();
    expect(screen.getByText('Salon')).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('activates a prompt when its Use button is clicked', async () => {
    vi.spyOn(lib, 'getBotPrompts').mockResolvedValue([
      { id: 1, name: 'Sales Bot', body: null, is_default: true, is_active: true },
      { id: 2, name: 'Salon', body: 'Salon assistant.', is_default: false, is_active: false },
    ]);
    const activate = vi.spyOn(lib, 'activateBotPrompt').mockResolvedValue();

    setup();
    const user = (await import('@testing-library/user-event')).default.setup();
    await user.click(await screen.findByRole('button', { name: /use salon/i }));

    expect(activate).toHaveBeenCalledWith(2);
  });

  it('edits a prompt and saves the changes', async () => {
    vi.spyOn(lib, 'getBotPrompts').mockResolvedValue([
      { id: 1, name: 'Sales Bot', body: null, is_default: true, is_active: true },
      { id: 2, name: 'Salon', body: 'Salon assistant.', is_default: false, is_active: false },
    ]);
    const update = vi.spyOn(lib, 'updateBotPrompt').mockResolvedValue(
      { id: 2, name: 'Salon', body: 'Updated assistant prompt.', is_default: false, is_active: false },
    );

    setup();
    const user = (await import('@testing-library/user-event')).default.setup();
    await user.click(await screen.findByRole('button', { name: /edit salon/i }));
    const body = screen.getByLabelText(/prompt text/i);
    await user.clear(body);
    await user.type(body, 'Updated assistant prompt.');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(update).toHaveBeenCalledWith(2, { name: 'Salon', body: 'Updated assistant prompt.' });
  });

  it('creates a new prompt', async () => {
    vi.spyOn(lib, 'getBotPrompts').mockResolvedValue([
      { id: 1, name: 'Sales Bot', body: null, is_default: true, is_active: true },
    ]);
    const create = vi.spyOn(lib, 'createBotPrompt').mockResolvedValue(
      { id: 3, name: 'Clinic', body: 'Clinic assistant.', is_default: false, is_active: false },
    );

    setup();
    const user = (await import('@testing-library/user-event')).default.setup();
    await user.click(await screen.findByRole('button', { name: /add prompt/i }));
    await user.type(screen.getByLabelText(/prompt name/i), 'Clinic');
    await user.type(screen.getByLabelText(/prompt text/i), 'Clinic assistant.');
    await user.click(screen.getByRole('button', { name: /save prompt/i }));

    expect(create).toHaveBeenCalledWith({ name: 'Clinic', body: 'Clinic assistant.' });
  });
});
