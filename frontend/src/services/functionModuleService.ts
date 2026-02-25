/**
 * 功能模块 API 服务
 */

import { api } from './api';
import type { FunctionModule } from 'protohub-shared';

/**
 * 获取所有功能模块
 */
export async function getAllFunctionModules(): Promise<FunctionModule[]> {
  const response = await api.get('/function-modules');
  return response.data;
}

/**
 * 根据ID获取功能模块
 */
export async function getFunctionModuleById(id: number): Promise<FunctionModule> {
  const response = await api.get(`/function-modules/${id}`);
  return response.data;
}

/**
 * 创建功能模块
 */
export async function createFunctionModule(data: { name: string; description?: string; owner?: string }): Promise<FunctionModule> {
  const response = await api.post('/function-modules', data);
  return response.data;
}

/**
 * 更新功能模块
 */
export async function updateFunctionModule(id: number, data: { name?: string; description?: string; owner?: string }): Promise<FunctionModule> {
  const response = await api.put(`/function-modules/${id}`, data);
  return response.data;
}

/**
 * 删除功能模块
 */
export async function deleteFunctionModule(id: number): Promise<void> {
  await api.delete(`/function-modules/${id}`);
}
