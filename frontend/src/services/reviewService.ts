/**
 * 审核 API 服务
 */

import axios from 'axios';
import type { Review, PaginatedResponse } from 'protohub-shared';

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
 * 获取待审核列表
 */
export async function getReviews(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<Review>> {
  const response = await api.get('/reviews', { params });
  return response.data;
}

/**
 * 批准审核
 */
export async function approveReview(reviewId: number, comment?: string): Promise<Review> {
  const response = await api.post(`/reviews/${reviewId}/approve`, { comment });
  return response.data;
}

/**
 * 拒绝审核
 */
export async function rejectReview(reviewId: number, reason: string): Promise<Review> {
  const response = await api.post(`/reviews/${reviewId}/reject`, { comment: reason });
  return response.data;
}

/**
 * 获取审核详情
 */
export async function getReviewById(reviewId: number): Promise<Review> {
  const response = await api.get(`/reviews/${reviewId}`);
  return response.data;
}

/**
 * 获取文件的审核历史
 */
export async function getFileReviews(fileId: number): Promise<Review[]> {
  const response = await api.get(`/reviews?fileId=${fileId}`);
  return response.data.data || [];
}
