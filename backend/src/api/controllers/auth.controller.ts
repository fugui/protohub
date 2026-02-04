/**
 * 认证控制器
 */

import { login as loginUser, register as registerUser } from '../../services/authService';
import type { UserRole } from 'protohub-shared';

/**
 * 用户登录
 */
export async function login(data: { username: string; password: string }) {
  return await loginUser(data);
}

/**
 * 用户注册
 */
export async function register(data: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  return await registerUser(data);
}
