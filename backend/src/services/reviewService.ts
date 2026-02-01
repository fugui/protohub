/**
 * 审核服务
 */

import { reviewRepository } from '../models/Review';
import { protoFileRepository } from '../models/ProtoFile';
import type { Review, User } from 'protohub-shared';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler';

/**
 * 获取待审核列表
 */
export function getPendingReviews(params: { page: number; pageSize: number }): {
  data: Review[];
  total: number;
} {
  const result = reviewRepository.findPendingReviews(params);

  const reviews = result.data.map((entity) => ({
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      status: 'draft',
      currentVersion: 1,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    fileVersion: entity.file_version_id
      ? {
          id: entity.file_version_id,
          version: 1,
          filePath: '',
          changeNote: undefined,
          modifiedBy: { id: entity.submitted_by, username: '', email: '', role: 'developer', createdAt: '' },
          modifiedAt: entity.submitted_at,
        }
      : undefined,
    submittedBy: {
      id: entity.submitted_by,
      username: '', // TODO: 从用户表获取
      email: '',
      role: 'developer',
      createdAt: '',
    },
    submittedAt: entity.submitted_at,
    reviewedBy: entity.reviewed_by
      ? {
          id: entity.reviewed_by,
          username: '',
          email: '',
          role: 'developer',
          createdAt: '',
        }
      : null,
    reviewedAt: entity.reviewed_at || null,
    status: entity.status,
    reviewComment: entity.review_comment || null,
  }));

  return {
    data: reviews,
    total: result.total,
  };
}

/**
 * 根据 ID 获取审核
 */
export function getReviewById(reviewId: number): Review | undefined {
  const entity = reviewRepository.findById(reviewId);
  if (!entity) {
    return undefined;
  }

  return {
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      status: 'draft',
      currentVersion: 1,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    fileVersion: entity.file_version_id
      ? {
          id: entity.file_version_id,
          version: 1,
          filePath: '',
          changeNote: undefined,
          modifiedBy: { id: entity.submitted_by, username: '', email: '', role: 'developer', createdAt: '' },
          modifiedAt: entity.submitted_at,
        }
      : undefined,
    submittedBy: {
      id: entity.submitted_by,
      username: '',
      email: '',
      role: 'developer',
      createdAt: '',
    },
    submittedAt: entity.submitted_at,
    reviewedBy: entity.reviewed_by
      ? {
          id: entity.reviewed_by,
          username: '',
          email: '',
          role: 'developer',
          createdAt: '',
        }
      : null,
    reviewedAt: entity.reviewed_at || null,
    status: entity.status,
    reviewComment: entity.review_comment || null,
  };
}

/**
 * 批准审核
 */
export function approveReview(reviewId: number, reviewedBy: number, comment?: string): Review {
  const entity = reviewRepository.findById(reviewId);
  if (!entity) {
    throw new NotFoundError('审核记录不存在');
  }

  if (entity.status !== 'pending_review') {
    throw new ValidationError('审核状态不是待审核');
  }

  // 更新文件状态为已批准
  protoFileRepository.updateFile(entity.file_id, { status: 'approved' });

  // 更新审核记录
  reviewRepository.approve(reviewId, reviewedBy, comment);

  return getReviewById(reviewId)!;
}

/**
 * 拒绝审核
 */
export function rejectReview(reviewId: number, reviewedBy: number, comment: string): Review {
  const entity = reviewRepository.findById(reviewId);
  if (!entity) {
    throw new NotFoundError('审核记录不存在');
  }

  if (entity.status !== 'pending_review') {
    throw new ValidationError('审核状态不是待审核');
  }

  // 更新文件状态为草稿
  protoFileRepository.updateFile(entity.file_id, { status: 'draft' });

  // 更新审核记录
  reviewRepository.reject(reviewId, reviewedBy, comment);

  return getReviewById(reviewId)!;
}

/**
 * 创建审核记录（文件提交流程）
 */
export function createReview(fileId: number, submittedBy: number): Review {
  const entity = protoFileRepository.findById(fileId);
  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 更新文件状态为待审核
  protoFileRepository.updateFile(fileId, { status: 'pending_review' });

  // 创建审核记录
  const reviewId = reviewRepository.create({
    file_id: fileId,
    file_version_id: null, // TODO: 获取当前版本 ID
    submitted_by: submittedBy,
    status: 'pending_review',
    review_comment: null,
  });

  return getReviewById(reviewId)!;
}

/**
 * 获取文件的审核历史
 */
export function getReviewsByFileId(fileId: number): Review[] {
  const entities = reviewRepository.findByFileId(fileId);

  return entities.map((entity) => ({
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      status: 'draft',
      currentVersion: 1,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    fileVersion: entity.file_version_id
      ? {
          id: entity.file_version_id,
          version: 1,
          filePath: '',
          changeNote: undefined,
          modifiedBy: { id: entity.submitted_by, username: '', email: '', role: 'developer', createdAt: '' },
          modifiedAt: entity.submitted_at,
        }
      : undefined,
    submittedBy: {
      id: entity.submitted_by,
      username: '',
      email: '',
      role: 'developer',
      createdAt: '',
    },
    submittedAt: entity.submitted_at,
    reviewedBy: entity.reviewed_by
      ? {
          id: entity.reviewed_by,
          username: '',
          email: '',
          role: 'developer',
          createdAt: '',
        }
      : null,
    reviewedAt: entity.reviewed_at || null,
    status: entity.status,
    reviewComment: entity.review_comment || null,
  }));
}
