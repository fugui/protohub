/**
 * 审核服务
 */

import { reviewRepository } from '../models/Review';
import { protoFileRepository } from '../models/ProtoFile';
import { userRepository } from '../models/User';
import type { Review } from 'protohub-shared';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler';

/**
 * 获取待审核列表
 */
/**
 * 获取审核列表
 */
export async function getReviews(params: { page: number; pageSize: number; status?: string }): Promise<{
  data: Review[];
  total: number;
}> {
  let result;
  if (params.status === 'history') {
    result = reviewRepository.findHistory({ page: params.page, pageSize: params.pageSize });
  } else if (params.status && params.status !== 'all') {
    result = reviewRepository.findByStatus(params.status, { page: params.page, pageSize: params.pageSize });
  } else {
    // If status is 'all' or undefined
    result = reviewRepository.findPaginated({ page: params.page, pageSize: params.pageSize }, {});
  }

  const reviews = await Promise.all(result.data.map(async (entity: any) => {
    const file = protoFileRepository.findById(entity.file_id);
    const submittedBy = await userRepository.findById(entity.submitted_by);
    const reviewedBy = entity.reviewed_by ? await userRepository.findById(entity.reviewed_by) : null;

    // 如果文件已被删除，可能需要处理（这里暂且容错返回空对象或忽略）
    const fileData = file ? {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.function_module_id,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: { id: file.created_by, username: '', email: '', role: 'developer', createdAt: '' }, // TODO: fetch creator
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
      lockedBy: null, // simplification
      lockedAt: file.locked_at,
    } : {
      id: entity.file_id,
      filename: 'Unknown File',
      packageName: '',
      subsystem: 0,
      status: 'unknown',
      currentVersion: 0,
      createdBy: { id: 0, username: '', email: '', role: 'developer', createdAt: '' },
      createdAt: '',
      updatedAt: '',
      locked: false,
      lockedBy: null,
      lockedAt: null,
    };

    return {
      id: entity.id,
      file: fileData,
      fileVersion: undefined, // simplify for now
      submittedBy: submittedBy ? {
        id: submittedBy.id,
        username: submittedBy.username,
        email: submittedBy.email,
        role: submittedBy.role,
        createdAt: submittedBy.created_at,
      } : {
        id: entity.submitted_by,
        username: 'Unknown User',
        email: '',
        role: 'developer',
        createdAt: '',
      },
      submittedAt: entity.submitted_at,
      reviewedBy: reviewedBy ? {
        id: reviewedBy.id,
        username: reviewedBy.username,
        email: reviewedBy.email,
        role: reviewedBy.role,
        createdAt: reviewedBy.created_at,
      } : null,
      reviewedAt: entity.reviewed_at || null,
      status: entity.status,
      reviewComment: entity.review_comment || null,
    };
  }));

  return {
    data: reviews,
    total: result.total,
  };
}

/**
 * 根据 ID 获取审核
 */
export async function getReviewById(reviewId: number): Promise<Review | undefined> {
  const entity = reviewRepository.findById(reviewId);
  if (!entity) {
    return undefined;
  }

  const file = protoFileRepository.findById(entity.file_id);
  const submittedBy = await userRepository.findById(entity.submitted_by);
  const reviewedBy = entity.reviewed_by ? await userRepository.findById(entity.reviewed_by) : null;

  return {
    id: entity.id,
    file: file ? {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.function_module_id,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: { id: file.created_by, username: '', email: '', role: 'developer', createdAt: '' },
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
      lockedBy: null,
      lockedAt: file.locked_at,
    } : {
      id: entity.file_id,
      filename: 'Unknown File',
      packageName: '',
      subsystem: 0,
      status: 'draft' as const,
      currentVersion: 0,
      createdBy: { id: 0, username: '', email: '', role: 'developer' as const, createdAt: '' },
      createdAt: '',
      updatedAt: '',
      locked: false,
      lockedBy: null,
      lockedAt: null,
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
    submittedBy: submittedBy ? {
      id: submittedBy.id,
      username: submittedBy.username,
      email: submittedBy.email,
      role: submittedBy.role,
      createdAt: submittedBy.created_at,
    } : {
      id: entity.submitted_by,
      username: 'Unknown User',
      email: '',
      role: 'developer',
      createdAt: '',
    },
    submittedAt: entity.submitted_at,
    reviewedBy: reviewedBy ? {
      id: reviewedBy.id,
      username: reviewedBy.username,
      email: reviewedBy.email,
      role: reviewedBy.role,
      createdAt: reviewedBy.created_at,
    } : null,
    reviewedAt: entity.reviewed_at || null,
    status: entity.status,
    reviewComment: entity.review_comment || null,
  };
}

/**
 * 批准审核
 */
export async function approveReview(reviewId: number, reviewedBy: number, comment?: string): Promise<Review> {
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

  return (await getReviewById(reviewId))!;
}

/**
 * 拒绝审核
 */
export async function rejectReview(reviewId: number, reviewedBy: number, comment: string): Promise<Review> {
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

  return (await getReviewById(reviewId))!;
}

/**
 * 创建审核记录（文件提交流程）
 */
export async function createReview(fileId: number, submittedBy: number): Promise<Review> {
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
    submitted_at: new Date().toISOString(),
    status: 'pending_review',
    review_comment: null,
  });

  return (await getReviewById(reviewId))!;
}

/**
 * 获取文件的审核历史
 */
export async function getReviewsByFileId(fileId: number): Promise<Review[]> {
  const entities = reviewRepository.findByFileId(fileId);

  return Promise.all(entities.map(async (entity: any) => {
    const file = protoFileRepository.findById(entity.file_id);
    const submittedBy = await userRepository.findById(entity.submitted_by);
    const reviewedBy = entity.reviewed_by ? await userRepository.findById(entity.reviewed_by) : null;

    const fileData = file ? {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.function_module_id,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: { id: file.created_by, username: '', email: '', role: 'developer' as const, createdAt: '' },
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: false,
      lockedBy: null,
      lockedAt: null,
    } : {
      id: entity.file_id,
      filename: 'Unknown File',
      packageName: '',
      subsystem: 0,
      status: 'draft' as const,
      currentVersion: 0,
      createdBy: { id: 0, username: '', email: '', role: 'developer' as const, createdAt: '' },
      createdAt: '',
      updatedAt: '',
      locked: false,
      lockedBy: null,
      lockedAt: null,
    };

    return {
      id: entity.id,
      file: fileData,
      fileVersion: undefined,
      submittedBy: submittedBy ? {
        id: submittedBy.id,
        username: submittedBy.username,
        email: submittedBy.email,
        role: submittedBy.role,
        createdAt: submittedBy.created_at,
      } : {
        id: entity.submitted_by,
        username: 'Unknown User',
        email: '',
        role: 'developer',
        createdAt: '',
      },
      submittedAt: entity.submitted_at,
      reviewedBy: reviewedBy ? {
        id: reviewedBy.id,
        username: reviewedBy.username,
        email: reviewedBy.email,
        role: reviewedBy.role,
        createdAt: reviewedBy.created_at,
      } : null,
      reviewedAt: entity.reviewed_at || null,
      status: entity.status,
      reviewComment: entity.review_comment || null,
    };
  }));
}
