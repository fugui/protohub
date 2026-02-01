/**
 * 用户服务
 */

import { userRepository } from '../models/User';
import { User, PaginatedResponse } from 'protohub-shared';
import { NotFoundError } from '../middlewares/errorHandler';

/**
 * 获取用户列表
 */
export function getUsers(params: { page: number; pageSize: number }): PaginatedResponse<User> {
  const result = userRepository.findPaginated({
    page: params.page,
    pageSize: params.pageSize,
  });

  return {
    data: result.data.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

/**
 * 根据 ID 获取用户
 */
export function getUserById(userId: number): User {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

/**
 * 更新用户
 */
export function updateUser(userId: number, data: Partial<User>): User {
  const existing = userRepository.findById(userId);
  if (!existing) {
    throw new NotFoundError('用户不存在');
  }

  // 只允许更新特定字段
  const allowedFields = ['username', 'email', 'role'];
  const updateData: any = {};

  for (const field of allowedFields) {
    if (data[field as keyof User] !== undefined) {
      updateData[field] = data[field as keyof User];
    }
  }

  userRepository.updateUser(userId, updateData);

  const updated = userRepository.findById(userId);
  if (!updated) {
    throw new NotFoundError('用户不存在');
  }

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    role: updated.role,
    createdAt: updated.created_at,
  };
}
