import { describe, it, expect } from 'vitest';
import { tokenFromCreds } from './avatar';

describe('tokenFromCreds', () => {
  it('prefers session_token', () => {
    expect(tokenFromCreds({ session_token: 'a', token: 'b' })).toBe('a');
  });

  it('falls back through the known field names', () => {
    expect(tokenFromCreds({ token: 'b' })).toBe('b');
    expect(tokenFromCreds({ access_token: 'c' })).toBe('c');
    expect(tokenFromCreds({ livekit_client_token: 'd' })).toBe('d');
    expect(tokenFromCreds({ session_id: 'e' })).toBe('e');
  });

  it('returns undefined when no string token is present', () => {
    expect(tokenFromCreds({})).toBeUndefined();
    expect(tokenFromCreds({ session_token: 123 as unknown as string })).toBeUndefined();
  });
});
