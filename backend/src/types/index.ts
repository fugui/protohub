import type { Request } from 'express';
import type { UserRole } from 'protohub-shared';

/**
 * 认证用户信息
 */
export interface AuthUser {
  userId: number;
  username: string;
  role: UserRole;
}

/**
 * 带用户信息的认证请求
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
}

/**
 * 获取文件列表参数
 */
export interface GetFilesParams {
  page: number;
  pageSize: number;
  subsystemId?: number;
  status?: string;
  search?: string;
}

/**
 * 创建文件数据
 */
export interface CreateFileData {
  subsystemId?: number;
  functionModuleId?: number;
  filename?: string;
  content?: string;
}

/**
 * 更新文件数据
 */
export interface UpdateFileData {
  content: string;
  changeNote?: string;
}
