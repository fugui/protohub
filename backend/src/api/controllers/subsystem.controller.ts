/**
 * 功能模块控制器（原 "子系统"）
 */

import {
  getFunctionModules,
  getFunctionModuleById,
  createFunctionModule
} from '../../services/functionModuleService';

/**
 * 获取功能模块列表
 */
export async function getFunctionModulesController() {
  return await getFunctionModules();
}

/**
 * 根据ID获取功能模块
 */
export async function getFunctionModuleByIdController(id: number) {
  return await getFunctionModuleById(id);
}

/**
 * 创建功能模块
 */
export async function createFunctionModuleController(data: { name: string; description?: string; owner?: string }) {
  return await createFunctionModule(data);
}
