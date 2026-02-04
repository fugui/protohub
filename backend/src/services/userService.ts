/**
 * 用户服务
 */

import { userRepository } from '../models/User';
import { User, PaginatedResponse } from 'protohub-shared';
import { NotFoundError } from '../middlewares/errorHandler';

/**
 * 获取用户列表
 */
export async function getUsers(params: { page: number; pageSize: number }): Promise<PaginatedResponse<User>> {
  const result = await userRepository.findPaginated({
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
export async function getUserById(userId: number): Promise<User> {
  const user = await userRepository.findById(userId);
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
export async function updateUser(userId: number, data: Partial<User>): Promise<User> {
  const existing = await userRepository.findById(userId);
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

  await userRepository.updateUser(userId, updateData);

  const updated = await userRepository.findById(userId);
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
