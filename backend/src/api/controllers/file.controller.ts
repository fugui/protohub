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
export async function deleteFile(fileId: number, req: any) {
  return await deleteProtoFile(fileId, req);
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
    status: 'pending_review',
    review_comment: null,
  });

  // 更新文件状态为待审核
  await updateProtoFile(fileId, { content: file.content }, req);
  // 实际上文件状态是在 updateFile 中更新的

  const review = reviewRepository.findById(reviewId);
  return { review };
}
