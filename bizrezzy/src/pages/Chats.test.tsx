import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import * as chatsLib from '@/lib/chats';
import Chats, { chatTime } from './Chats';

function setup() {
  storage.setJSON('shop_data', { id: 7, name: 'Acme' });
  storage.set('shop_token', 'tok');
  return render(<MemoryRouter><ShopProvider><Chats /></ShopProvider></MemoryRouter>);
}

describe('Chats', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('lists contacts with preview and unread badge', async () => {
    vi.spyOn(chatsLib, 'getWaContacts').mockResolvedValue({
      connected: true,
      data: [
        { id: 1, wa_number: '971501112222', name: 'Ali', last_message_preview: 'Salam', last_message_direction: 'in', unread_count: 2 },
        { id: 2, wa_number: '971503334444', name: null, last_message_preview: 'See you', last_message_direction: 'out', unread_count: 0 },
      ],
    });

    setup();
    expect(await screen.findByText('Ali')).toBeInTheDocument();
    expect(screen.getByText('Salam')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // unnamed contact falls back to number; outgoing preview gets "You: "
    expect(screen.getByText('971503334444')).toBeInTheDocument();
    expect(screen.getByText(/You:\s*See you/)).toBeInTheDocument();
  });

  it('shows setup CTA when WhatsApp is not connected', async () => {
    vi.spyOn(chatsLib, 'getWaContacts').mockResolvedValue({ connected: false, data: [] });

    setup();
    expect(await screen.findByText(/whatsapp not connected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up whatsapp/i })).toBeInTheDocument();
  });
});

describe('chatTime', () => {
  it('handles empty and invalid input', () => {
    expect(chatTime()).toBe('');
    expect(chatTime('not-a-date')).toBe('');
  });
});
