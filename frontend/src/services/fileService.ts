/**
 * 文件 API 服务
 */

import axios from 'axios';
import type { ProtoFile, ProtoFileDetail, PaginatedResponse } from 'protohub-shared';

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
 * 获取文件列表
 */
export async function getFiles(params: {
  page?: number;
  pageSize?: number;
  subsystemId?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedResponse<ProtoFile>> {
  const response = await api.get('/files', { params });
  return response.data;
}

/**
 * 根据 ID 获取文件
 */
export async function getFileById(fileId: number): Promise<ProtoFileDetail> {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
}

/**
 * 创建文件
 */
export async function createFile(data: FormData): Promise<ProtoFile> {
  const response = await api.post('/files', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * 更新文件
 */
export async function updateFile(
  fileId: number,
  data: { content: string; changeNote?: string }
): Promise<ProtoFile> {
  const response = await api.put(`/files/${fileId}`, data);
  return response.data;
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: number): Promise<void> {
  await api.delete(`/files/${fileId}`);
}

/**
 * 锁定文件
 */
export async function lockFile(fileId: number): Promise<any> {
  const response = await api.post(`/files/${fileId}/lock`);
  return response.data;
}

/**
 * 解锁文件
 */
export async function unlockFile(fileId: number): Promise<any> {
  const response = await api.post(`/files/${fileId}/unlock`);
  return response.data;
}

/**
 * 提交审核
 */
export async function submitReview(fileId: number): Promise<any> {
  const response = await api.post(`/files/${fileId}/submit-review`);
  return response.data;
}

/**
 * 获取文件版本列表
 */
export async function getFileVersions(fileId: number): Promise<any> {
  const response = await api.get(`/files/${fileId}/versions`);
  return response.data;
}

/**
 * 对比文件版本
 */
export async function diffFileVersions(
  fileId: number,
  version1: number,
  version2: number
): Promise<any> {
  const response = await api.get(`/files/${fileId}/versions/diff`, {
    params: { version1, version2 },
  });
  return response.data;
}
