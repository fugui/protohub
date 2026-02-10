/**
 * 子系统控制器
 */

import {
  getSubsystems as getSubs,
  getSubsystemById as getSubById,
  createSubsystem as addSubsystem
} from '../../services/subsystemService';

/**
 * 获取子系统列表
 */
export async function getSubsystems() {
  return await getSubs();
}

/**
 * 根据ID获取子系统
 */
export async function getSubsystemById(id: number) {
  return await getSubById(id);
}

/**
 * 创建子系统
 */
export async function createSubsystem(data: { name: string; description?: string; owner?: string }) {
  return await addSubsystem(data);
}
