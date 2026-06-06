import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import * as shopsLib from '@/lib/shops';
import MasterShops from './MasterShops';

function setup() {
  storage.setJSON('shop_data', { id: 1, name: 'Rezzy HQ', is_master: true });
  storage.set('shop_token', 'tok');
  return render(<MemoryRouter><ShopProvider><MasterShops /></ShopProvider></MemoryRouter>);
}

describe('MasterShops', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('lists every business with code and pin', async () => {
    vi.spyOn(shopsLib, 'getMasterShops').mockResolvedValue([
      {
        id: 30, name: 'Shakaina Salon', shop_code: '730762', pin: '2511',
        phone: '0554501483', category: 'Salon', bookings_count: 4,
        wa_connected: true, wa_number: '+971503744113',
        created_at: '2026-06-06T18:00:00Z', last_login_at: '2026-06-07T10:00:00Z',
      },
      {
        id: 12, name: 'Quick Fix AC', shop_code: '101010', pin: '9001',
        phone: null, category: 'AC Repair', bookings_count: 0, wa_connected: false,
      },
    ]);

    setup();
    expect(await screen.findByText('Shakaina Salon')).toBeInTheDocument();
    expect(screen.getByText('730762')).toBeInTheDocument();
    expect(screen.getByText('2511')).toBeInTheDocument();
    expect(screen.getByText('Quick Fix AC')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Not set up')).toBeInTheDocument();
  });
});
