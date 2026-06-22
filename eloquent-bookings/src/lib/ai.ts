import api from './api';
import type { Shop } from '@/types';

export type AiSearchResult = {
  reply: string;
  category_id: number | null;
  shops: Shop[];
};

/**
 * Ask the AI service finder a question. The backend classifies it into a
 * service category (or marks it off-topic) and returns matching shops in the
 * same shape ShopCard consumes. Pass coords when available so "near me"
 * queries rank by distance.
 */
export async function aiSearch(
  message: string,
  coords?: { lat: number; lon: number },
): Promise<AiSearchResult> {
  const res = await api.post<AiSearchResult>('/ai/search', {
    message,
    lat: coords?.lat,
    lon: coords?.lon,
  });
  return res.data;
}
