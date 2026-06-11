import api from './api';
import type { ChatMessage } from '@/types';

/**
 * In-app Live Chat with a shop. The thread is keyed server-side by the
 * X-Device-Id header the api client already sends — no login required.
 */
export async function getChatMessages(shopId: number, sinceId?: number): Promise<ChatMessage[]> {
  const { data } = await api.get(`/chat/shops/${shopId}/messages`, {
    params: sinceId ? { since_id: sinceId } : undefined,
  });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function sendChatMessage(shopId: number, text: string): Promise<ChatMessage> {
  const { data } = await api.post(`/chat/shops/${shopId}/messages`, { text });
  return data?.data ?? data;
}
