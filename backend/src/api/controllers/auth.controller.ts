/**
 * 认证控制器
 */

import { login as loginUser, register as registerUser } from '../../services/authService';

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
  role: string;
}) {
  return await registerUser(data);
}
