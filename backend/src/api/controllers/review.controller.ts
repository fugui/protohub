/**
 * 审核控制器
 */

import {
  getReviews as getReviewsService,
  approveReview as approveReviewService,
  rejectReview as rejectReviewService,
} from '../../services/reviewService';

/**
 * 获取待审核列表
 */
export async function getReviews(params: { page: number; pageSize: number; status?: string }) {
  return getReviewsService(params);
}

/**
 * 批准审核
 */
export async function approveReview(reviewId: number, comment?: string, req?: any) {
  const userId = req ? (req as any).userId : 1;
  return approveReviewService(reviewId, userId, comment);
}

/**
 * 拒绝审核
 */
export async function rejectReview(reviewId: number, comment: string, req?: any) {
  const userId = req ? (req as any).userId : 1;
  return rejectReviewService(reviewId, userId, comment);
}
