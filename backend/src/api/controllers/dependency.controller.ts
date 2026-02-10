/**
 * 依赖关系控制器
 */

import {
  getDependencyGraph as getDepsGraph,
  getSubsystemDependencyGraph as getSubsystemDepsGraph,
  getImpactAnalysis as analyzeImpact,
  createDependency as createDep,
  createSubsystemDependency as createSubsystemDep,
  deleteDependency as deleteDep,
} from '../../services/dependencyService';

/**
 * 获取依赖关系图
 */
export async function getDependencyGraph(level: string = 'file') {
  if (level === 'subsystem') {
    return await getSubsystemDepsGraph();
  }
  return await getDepsGraph();
}

/**
 * 获取影响分析
 */
export async function getImpactAnalysis(fileId: number) {
  return await analyzeImpact(fileId);
}

/**
 * 创建依赖关系
 */
export async function createDependency(sourceFileId: number, targetFileId: number) {
  return await createDep(sourceFileId, targetFileId);
}

/**
 * 创建子系统依赖关系
 */
export async function createSubsystemDependency(sourceSubsystemId: number, targetFileIds: number[]) {
  return await createSubsystemDep(sourceSubsystemId, targetFileIds);
}

/**
 * 删除依赖关系
 */
export async function deleteDependency(id: number) {
  return await deleteDep(id);
}
