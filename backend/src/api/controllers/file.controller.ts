import type { Request } from 'express';
import type { CreateFileData, UpdateFileData, GetFilesParams, AuthenticatedRequest } from '../../types';
import type { SubmitReviewResponse, PaginatedResponse, ProtoFile, ProtoFileDetail } from 'protohub-shared';
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
import { protoFileRepository } from '../../models/ProtoFile';
import { userRepository } from '../../models/User';

/**
 * 获取文件列表
 */
export function getFiles(params: GetFilesParams): PaginatedResponse<ProtoFile> {
  return getProtoFiles(params);
}

/**
 * 根据 ID 获取文件
 */
export async function getFileById(fileId: number): Promise<ProtoFileDetail> {
  return getProtoFileById(fileId);
}

/**
 * 创建文件
 */
export async function createFile(req: Request, data: CreateFileData) {
  const functionModuleId = data.functionModuleId ?? data.subsystemId;
  if (functionModuleId === undefined) {
    throw new Error('functionModuleId or subsystemId is required');
  }
  return createProtoFile(req, {
    functionModuleId,
    filename: data.filename,
    content: data.content,
  });
}

/**
 * 更新文件
 */
export async function updateFile(fileId: number, data: UpdateFileData, req: Request) {
  return updateProtoFile(fileId, data, req as AuthenticatedRequest);
}

/**
 * 删除文件
 */
export function deleteFile(fileId: number, _req: Request): void {
  return deleteProtoFile(fileId);
}

/**
 * 锁定文件
 */
export function lockFile(fileId: number, req: Request) {
  return lockProtoFile(fileId, req as AuthenticatedRequest);
}

/**
 * 解锁文件
 */
export function unlockFile(fileId: number, req: Request) {
  return unlockProtoFile(fileId, req as AuthenticatedRequest);
}

/**
 * 提交审核
 */
export function submitReview(fileId: number, req: Request): SubmitReviewResponse {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const file = protoFileRepository.findById(fileId);
  if (!file) {
    throw new Error('文件不存在');
  }

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
  protoFileRepository.updateFile(fileId, { status: 'pending_review' });

  const reviewEntity = reviewRepository.findById(reviewId);
  if (!reviewEntity) {
    throw new Error('审核记录创建失败');
  }

  const submittedBy = userRepository.findById(reviewEntity.submitted_by);
  const reviewedBy = reviewEntity.reviewed_by ? userRepository.findById(reviewEntity.reviewed_by) : null;

  const review = {
    id: reviewEntity.id,
    file: {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.function_module_id,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: submittedBy ? {
        id: submittedBy.id,
        username: submittedBy.username,
        email: submittedBy.email,
        role: submittedBy.role,
        createdAt: submittedBy.created_at,
      } : undefined,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
      lockedBy: file.locked_by ? { id: file.locked_by, username: '', email: '', role: 'developer' as const, createdAt: '' } : null,
      lockedAt: file.locked_at,
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
