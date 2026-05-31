import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as shops from '@/lib/shops';
import Register from './Register';

const nav = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig() as object),
  useNavigate: () => nav,
}));

describe('Register', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); nav.mockReset(); });

  it('submits the form with entered values', async () => {
    const spy = vi.spyOn(shops, 'registerShop').mockResolvedValue({ shop: { id: 1, name: 'Acme' } });
    render(<MemoryRouter><Register /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/business name/i), 'Acme Salon');
    await user.type(screen.getByLabelText(/phone/i), '0501234567');
    await user.click(screen.getByRole('button', { name: /register business/i }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Salon', phone: '0501234567' }));
    expect(await screen.findByText(/business registered/i)).toBeInTheDocument();
  });

  it('blocks submit without a business name', async () => {
    const spy = vi.spyOn(shops, 'registerShop').mockResolvedValue({});
    render(<MemoryRouter><Register /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /register business/i }));
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
  });
});
