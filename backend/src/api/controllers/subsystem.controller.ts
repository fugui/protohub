/**
 * 子系统控制器
 */

import { getSubsystems as getSubs, createSubsystem as addSubsystem } from '../../services/subsystemService';

/**
 * 获取子系统列表
 */
export async function getSubsystems() {
  return await getSubs();
}

/**
 * 创建子系统
 */
export async function createSubsystem(data: { name: string; description?: string; owner?: string }, userId?: number) {
  return await addSubsystem(data, userId);
}
