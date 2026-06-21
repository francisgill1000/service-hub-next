import api from './api';

/**
 * Raw LiveAvatar FULL-mode session credentials returned by our backend broker.
 * Known fields are typed loosely; the exact shape is confirmed during the
 * LiveAvatar end-to-end pass and consumed by the Web SDK as-is.
 */
export type AvatarSession = {
  session_id?: string;
  livekit?: { url?: string; token?: string };
  [k: string]: unknown;
};

export async function createAvatarSession(shopId: string | number): Promise<AvatarSession> {
  const { data } = await api.post(`/avatar/shops/${shopId}/session`);
  return data as AvatarSession;
}
