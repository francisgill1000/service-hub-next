import api from './api';
import type { ParentCategory } from '@/types';

export async function listParentCategories(): Promise<ParentCategory[]> {
  const { data } = await api.get('/shop/parent-categories');
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
}

export async function createParentCategory(name: string): Promise<ParentCategory> {
  const { data } = await api.post('/shop/parent-categories', { name });
  return data?.data ?? data;
}
