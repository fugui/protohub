/**
 * 认证 API 服务
 */

import axios from 'axios';
import type { LoginRequest, RegisterRequest, LoginResponse, User } from 'protohub-shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const api = axios.create({
  baseURL: BASE_URL,
});

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post('/auth/login', data);
  return response.data;
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<User> {
  const response = await api.post('/auth/register', data);
  return response.data;
}

/**
 * 登出
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('auth_user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * 获取认证 token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}
