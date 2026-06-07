import api from './api';
import type { BotPrompt } from '@/types';

/** Master only: bot prompt presets for the sales/test number. */
export async function getBotPrompts(): Promise<BotPrompt[]> {
  const { data } = await api.get('/master/bot-prompts');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createBotPrompt(payload: { name: string; body: string }): Promise<BotPrompt> {
  const { data } = await api.post('/master/bot-prompts', payload);
  return data?.data ?? data;
}

export async function updateBotPrompt(
  id: number,
  payload: { name?: string; body?: string },
): Promise<BotPrompt> {
  const { data } = await api.put(`/master/bot-prompts/${id}`, payload);
  return data?.data ?? data;
}

/** Make this prompt the active one (deactivates the rest). */
export async function activateBotPrompt(id: number): Promise<void> {
  await api.post(`/master/bot-prompts/${id}/activate`);
}

export async function deleteBotPrompt(id: number): Promise<void> {
  await api.delete(`/master/bot-prompts/${id}`);
}
