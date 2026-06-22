import api from './api';
import type { Shop } from '@/types';

export type AiCategory = { id: number; name: string; count: number };

export type AiSearchResult = {
  reply: string;
  category_id: number | null;
  shops: Shop[];
  categories?: AiCategory[];
};

/**
 * Ask the AI service finder a question. The backend classifies it into a
 * service category, a "what's available" list request, or off-topic, and
 * returns matching shops (same shape ShopCard consumes) or the category list.
 * Pass coords when available so "near me" queries rank by distance.
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

/** Service categories that currently have shops (with counts), for the chips. */
export async function getAiCategories(): Promise<AiCategory[]> {
  const res = await api.get<{ categories: AiCategory[] }>('/ai/categories');
  return res.data.categories ?? [];
}
