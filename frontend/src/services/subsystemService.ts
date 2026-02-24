/**
 * 子系统 API 服务
 */

import { api } from './api';
import type { Subsystem } from 'protohub-shared';

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
 * 创建子系统
 */
export async function createSubsystem(data: { name: string; description?: string; owner?: string }): Promise<Subsystem> {
  const response = await api.post('/subsystems', data);
  return response.data;
}

/**
 * 更新子系统
 */
export async function updateSubsystem(id: number, data: { name?: string; description?: string; owner?: string }): Promise<Subsystem> {
  const response = await api.put(`/subsystems/${id}`, data);
  return response.data;
}

/**
 * 删除子系统
 */
export async function deleteSubsystem(id: number): Promise<void> {
  await api.delete(`/subsystems/${id}`);
}
