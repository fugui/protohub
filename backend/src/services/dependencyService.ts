/**
 * 依赖分析服务
 */

import { dependencyRepository } from '../models/Dependency';
import { protoFileRepository } from '../models/ProtoFile';
import type { DependencyNode, DependencyEdge } from 'protohub-shared';

/**
 * 获取依赖关系图
 */
export function getDependencyGraph(): { nodes: DependencyNode[]; edges: DependencyEdge[]; circularDependencies: string[][] } {
  const deps = dependencyRepository.findAll();

  // 构建节点和边
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];

  // TODO: 根据子系统 ID 过滤

  deps.forEach((dep) => {
    const sourceFile = protoFileRepository.findById(dep.source_file_id);
    const targetFile = protoFileRepository.findById(dep.target_file_id);

    if (sourceFile && targetFile) {
      // 添加源节点
      if (!nodes.has(sourceFile.id.toString())) {
        nodes.set(sourceFile.id.toString(), {
          id: sourceFile.id.toString(),
          label: sourceFile.filename,
          type: 'file',
          category: sourceFile.package_name,
        });
      }

      // 添加目标节点
      if (!nodes.has(targetFile.id.toString())) {
        nodes.set(targetFile.id.toString(), {
          id: targetFile.id.toString(),
          label: targetFile.filename,
          type: 'file',
          category: targetFile.package_name,
        });
      }

      // 添加边
      edges.push({
        source: sourceFile.id.toString(),
        target: targetFile.id.toString(),
        type: 'import',
      });
    }
  });

  // 检测循环依赖
  const circularDependencies = dependencyRepository.detectCircularDependencies();

  return {
    nodes: Array.from(nodes.values()),
    edges,
    circularDependencies,
  };
}

/**
 * 获取文件的影响分析
 */
export function getImpactAnalysis(fileId: number): {
  affectedSubsystems: string[];
  affectedFiles: number;
  dependencyChain: string[];
} {
  // 查找所有依赖当前文件的文件
  const directDependents = dependencyRepository.findByTargetFileId(fileId);

  const affectedFiles = directDependents.length;

  // 获取依赖的所有子系统
  const subsystems = new Set<string>();
  directDependents.forEach((dep) => {
    const file = protoFileRepository.findById(dep.source_file_id);
    if (file) {
      subsystems.add(file.package_name);
    }
  });

  const affectedSubsystems = Array.from(subsystems);

  // 构建依赖链 - 查找该文件依赖的其他文件
  const dependencyChain: string[] = [protoFileRepository.findById(fileId)!.filename];

  const visited = new Set<number>();
  let current = fileId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const deps = dependencyRepository.findBySourceFileId(current);
    if (deps.length > 0) {
      current = deps[0].target_file_id;
      const file = protoFileRepository.findById(current);
      if (file) {
        dependencyChain.push(file.filename);
      }
    }
  }

  return {
    affectedSubsystems,
    affectedFiles,
    dependencyChain,
  };
}
