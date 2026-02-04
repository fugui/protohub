/**
 * 依赖关系控制器
 */

import {
  getDependencyGraph as getDepsGraph,
  getImpactAnalysis as analyzeImpact,
} from '../../services/dependencyService';

/**
 * 获取依赖关系图
 */
export async function getDependencyGraph() {
  return await getDepsGraph();
}

/**
 * 获取影响分析
 */
export async function getImpactAnalysis(fileId: number) {
  return await analyzeImpact(fileId);
}
