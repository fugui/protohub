/**
 * 检查 API 服务
 */

import axios from 'axios';
import type { CheckReport } from 'protohub-shared';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({
  baseURL: BASE_URL,
});

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 执行文件检查
 */
export async function checkFile(fileId: number): Promise<CheckReport> {
  const response = await api.post(`/files/${fileId}/check`);
  return response.data;
}

/**
 * 获取检查报告详情
 */
export async function getCheckReport(reportId: number): Promise<CheckReport> {
  const response = await api.get(`/checks/${reportId}`);
  return response.data;
}

/**
 * 获取文件的检查报告列表
 */
export async function getFileCheckReports(fileId: number): Promise<CheckReport[]> {
  const response = await api.get(`/files/${fileId}/reports`);
  return response.data;
}

/**
 * 获取最新的检查报告
 */
export async function getLatestCheckReport(fileId: number): Promise<CheckReport | undefined> {
  const response = await api.get(`/files/${fileId}/latest-report`);
  return response.data;
}
