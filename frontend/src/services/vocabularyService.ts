/**
 * 词汇 API 服务
 */

import axios from 'axios';
import type { VocabularyTerm, PaginatedResponse } from 'protohub-shared';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({
  baseURL: BASE_URL,
});

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
export async function createTerm(data: { term: string; description?: string; category?: string }): Promise<VocabularyTerm> {
  const response = await api.post('/vocabulary', data);
  return response.data;
}

/**
 * 更新术语 (仅管理员)
 */
export async function updateTerm(id: number, data: { term: string; description?: string; category?: string }): Promise<VocabularyTerm> {
  const response = await api.put(`/vocabulary/${id}`, data);
  return response.data;
}

/**
 * 删除术语 (仅管理员)
 */
export async function deleteTerm(id: number): Promise<void> {
  await api.delete(`/vocabulary/${id}`);
}
