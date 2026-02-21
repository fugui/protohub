/**
 * 词汇 API 服务
 */

import { api } from './api';
import type { VocabularyTerm, PaginatedResponse } from 'protohub-shared';

/**
 * 获取所有术语
 */
export async function getVocabularyTerms(): Promise<PaginatedResponse<VocabularyTerm>> {
  const response = await api.get('/vocabulary');
  return response.data;
}

/**
 * 根据分类获取术语
 */
export async function getTermsByCategory(category: string): Promise<VocabularyTerm[]> {
  const response = await api.get('/vocabulary/terms', { params: { category } });
  return response.data;
}

/**
 * 创建术语 (仅管理员)
 */
export async function createTerm(data: {
  term: string;
  description?: string;
  descriptionEn?: string;
  aliases?: string[];
  similarTerms?: string[];
  domain?: string;
  category?: string;
}): Promise<VocabularyTerm> {
  const response = await api.post('/vocabulary', data);
  return response.data;
}

/**
 * 更新术语 (仅管理员)
 */
export async function updateTerm(
  id: number,
  data: {
    term?: string;
    description?: string;
    descriptionEn?: string;
    aliases?: string[];
    similarTerms?: string[];
    domain?: string;
    category?: string;
  }
): Promise<VocabularyTerm> {
  const response = await api.put(`/vocabulary/${id}`, data);
  return response.data;
}

/**
 * 删除术语 (仅管理员)
 */
export async function deleteTerm(id: number): Promise<void> {
  await api.delete(`/vocabulary/${id}`);
}
