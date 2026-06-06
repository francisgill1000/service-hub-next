import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';

describe('Settings', () => {
  it('lists the settings options with their links', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /working hours/i })).toHaveAttribute('href', '/working-hours');
    expect(screen.getByRole('link', { name: /services/i })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: /staff/i })).toHaveAttribute('href', '/staff');
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', '/chats/setup');
  });
});
