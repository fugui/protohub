/**
 * 文件管理控制器
 */

import {
  getFiles as getProtoFiles,
  getFileById as getProtoFileById,
  createFile as createProtoFile,
  updateFile as updateProtoFile,
  deleteFile as deleteProtoFile,
  lockFile as lockProtoFile,
  unlockFile as unlockProtoFile,
} from '../../services/fileService';
import { reviewRepository } from '../../models/Review';
import { userRepository } from '../../models/User';
import { SubmitReviewResponse } from 'protohub-shared';

/**
 * 获取文件列表
 */
export async function getFiles(params: any) {
  return await getProtoFiles(params);
}

/**
 * 根据 ID 获取文件
 */
export async function getFileById(fileId: number) {
  return await getProtoFileById(fileId);
}

/**
 * 创建文件
 */
export async function createFile(req: any, data: any) {
  return await createProtoFile(req, data);
}

/**
 * 更新文件
 */
export async function updateFile(fileId: number, data: any, req: any) {
  return await updateProtoFile(fileId, data, req);
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: number, _req: any) {
  return await deleteProtoFile(fileId);
}

/**
 * 锁定文件
 */
export async function lockFile(fileId: number, req: any) {
  return await lockProtoFile(fileId, req);
}

/**
 * 解锁文件
 */
export async function unlockFile(fileId: number, req: any) {
  return await unlockProtoFile(fileId, req);
}

/**
 * 提交审核
 */
export async function submitReview(fileId: number, req: any): Promise<SubmitReviewResponse> {
  const userId = (req.user as any).userId;
  const file = await getProtoFileById(fileId);

  // 创建审核记录
  const reviewId = reviewRepository.create({
    file_id: fileId,
    file_version_id: null, // TODO: 获取当前版本 ID
    submitted_by: userId,
    submitted_at: new Date().toISOString(),
    status: 'pending_review',
    review_comment: null,
  });

  // 更新文件状态为待审核
  await updateProtoFile(fileId, { content: file.content }, req);
  // 实际上文件状态是在 updateFile 中更新的

  const reviewEntity = reviewRepository.findById(reviewId);
  if (!reviewEntity) {
    throw new Error('审核记录创建失败');
  }

  const submittedBy = await userRepository.findById(reviewEntity.submitted_by);
  const reviewedBy = reviewEntity.reviewed_by ? await userRepository.findById(reviewEntity.reviewed_by) : null;

  const review = {
    id: reviewEntity.id,
    file: {
      id: file.id,
      filename: file.filename,
      packageName: file.packageName,
      subsystem: file.subsystem,
      status: file.status,
      currentVersion: file.currentVersion,
      createdBy: submittedBy ? {
        id: submittedBy.id,
        username: submittedBy.username,
        email: submittedBy.email,
        role: submittedBy.role,
        createdAt: submittedBy.created_at,
      } : undefined,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      locked: file.locked,
      lockedBy: file.lockedBy || null,
      lockedAt: file.lockedAt || null,
    },
    fileVersion: undefined,
    submittedBy: submittedBy ? {
      id: submittedBy.id,
      username: submittedBy.username,
      email: submittedBy.email,
      role: submittedBy.role,
      createdAt: submittedBy.created_at,
    } : null,
    submittedAt: reviewEntity.submitted_at,
    reviewedBy: reviewedBy ? {
      id: reviewedBy.id,
      username: reviewedBy.username,
      email: reviewedBy.email,
      role: reviewedBy.role,
      createdAt: reviewedBy.created_at,
    } : null,
    reviewedAt: reviewEntity.reviewed_at,
    status: reviewEntity.status,
    reviewComment: reviewEntity.review_comment,
  };

  return { review };
}
