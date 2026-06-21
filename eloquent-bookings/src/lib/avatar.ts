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

/**
 * Pull the SDK session-access token out of whatever the backend broker returns.
 * Field name is reconciled during the LiveAvatar end-to-end pass; we try the
 * common names so a contract tweak there doesn't require a frontend change.
 */
export function tokenFromCreds(creds: AvatarSession): string | undefined {
  const c = creds as Record<string, unknown>;
  const candidate =
    c.session_token ?? c.token ?? c.access_token ?? c.livekit_client_token ?? c.session_id;
  return typeof candidate === 'string' ? candidate : undefined;
}
