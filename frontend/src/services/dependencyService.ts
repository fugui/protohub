/**
 * 依赖关系 API 服务
 */

import axios from 'axios';
import type { DependencyNode, DependencyEdge, Subsystem } from 'protohub-shared';

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
 * 获取依赖关系图
 */
export async function getDependencyGraph(params: {
  fileId?: number;
  subsystemId?: number;
  level?: 'file' | 'subsystem';
}): Promise<{
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  circularDependencies: string[][];
}> {
  const response = await api.get('/dependencies/graph', { params });
  return response.data;
}

/**
 * 获取文件的影响分析
 */
export async function getImpactAnalysis(fileId: number): Promise<{
  affectedSubsystems: string[];
  affectedFiles: number;
  dependencyChain: string[];
}> {
  const response = await api.get(`/dependencies/${fileId}/impact-analysis`);
  return response.data;
}

/**
 * 获取所有子系统
 */
export async function getAllSubsystems(): Promise<Subsystem[]> {
  const response = await api.get('/subsystems');
  return response.data;
}

/**
 * 根据ID获取子系统
 */
export async function getSubsystemById(id: number): Promise<Subsystem> {
  const response = await api.get(`/subsystems/${id}`);
  return response.data;
}

/**
 * 创建依赖关系
 */
export async function createDependency(sourceFileId: number, targetFileId: number): Promise<{ id: number; message: string }> {
  const response = await api.post('/dependencies', { sourceFileId, targetFileId });
  return response.data;
}

/**
 * 创建子系统依赖关系
 */
export async function createSubsystemDependency(sourceSubsystemId: number, targetFileIds: number[]): Promise<{ count: number; message: string }> {
  const response = await api.post('/dependencies/subsystem', { sourceSubsystemId, targetFileIds });
  return response.data;
}

/**
 * 删除依赖关系
 */
export async function deleteDependency(id: number): Promise<{ message: string }> {
  const response = await api.delete(`/dependencies/${id}`);
  return response.data;
}
