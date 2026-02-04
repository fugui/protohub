/**
 * 用户管理控制器
 */

import { getUsers as getAllUsers, getUserById as getUserInfo } from '../../services/userService';

/**
 * 获取用户列表
 */
export async function getUsers(params: { page: number; pageSize: number }) {
  return await getAllUsers(params);
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(userId: number) {
  return await getUserInfo(userId);
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(userId: number) {
  return await getUserInfo(userId);
}
