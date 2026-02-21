/**
 * 审核 API 服务
 */

import { api } from './api';
import type { Review, PaginatedResponse, Violation } from 'protohub-shared';

/**
 * 词汇检查报告
 */
export interface VocabularyReport {
  fileId: number;
  fileName: string;
  checkedAt: string;
  violations: Violation[];
  standardTerms: string[];
  totalTerms: number;
  violationCount: number;
  warningCount: number;
  errorCount: number;
  infoCount: number;
}

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

/**
 * 获取文件词汇检查报告
 */
export async function getVocabularyReport(fileId: number): Promise<VocabularyReport> {
  const response = await api.get(`/files/${fileId}/vocabulary-report`);
  return response.data;
}
