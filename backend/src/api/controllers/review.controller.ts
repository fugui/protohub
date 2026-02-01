/**
 * 审核控制器
 */

import { reviewRepository } from '../../models/Review';
import { protoFileRepository } from '../../models/ProtoFile';

/**
 * 获取待审核列表
 */
export async function getReviews(params: { page: number; pageSize: number }) {
  const result = reviewRepository.findPendingReviews(params);
  return {
    reviews: result.data.map((review) => ({
      id: review.id,
      file: { id: review.file_id, filename: '' }, // TODO: 添加更多字段
      submittedBy: { id: review.submitted_by, username: '', email: '', role: 'developer', createdAt: '' },
      submittedAt: review.submitted_at,
      reviewedBy: review.reviewed_by ? { id: review.reviewed_by, username: '', email: '', role: 'developer', createdAt: '' } : null,
      reviewedAt: review.reviewed_at || null,
      status: review.status,
      reviewComment: review.review_comment,
    })),
    total: result.total,
  };
}

/**
 * 批准审核
 */
export async function approveReview(reviewId: number, comment?: string, req?: any) {
  const userId = req ? (req as any).userId : 1;

  reviewRepository.approve(reviewId, userId, comment);

  // 更新文件状态
  const review = reviewRepository.findById(reviewId);
  if (review) {
    protoFileRepository.updateFile(review.file_id, { status: 'approved' });
  }

  return reviewRepository.findById(reviewId);
}

/**
 * 拒绝审核
 */
export async function rejectReview(reviewId: number, comment: string, req?: any) {
  const userId = req ? (req as any).userId : 1;

  reviewRepository.reject(reviewId, userId, comment);

  // 更新文件状态
  const review = reviewRepository.findById(reviewId);
  if (review) {
    protoFileRepository.updateFile(review.file_id, { status: 'rejected' });
  }

  return reviewRepository.findById(reviewId);
}
