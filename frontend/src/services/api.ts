/**
 * 统一 API 客户端
 * 配置请求/响应拦截器，处理认证和错误
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
});

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// 请求拦截器 - 添加认证头
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证数据
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // 跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
