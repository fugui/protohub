/**
 * 依赖分析服务
 */

import { dependencyRepository } from '../models/Dependency';
import { protoFileRepository } from '../models/ProtoFile';
import { subsystemRepository } from '../models/Subsystem';
import type { DependencyNode, DependencyEdge } from 'protohub-shared';

/**
 * 获取依赖关系图
 */
export function getDependencyGraph(): { nodes: DependencyNode[]; edges: DependencyEdge[]; circularDependencies: string[][] } {
  const deps = dependencyRepository.findAll();

  // 构建节点和边
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];

  deps.forEach((dep) => {
    const sourceFile = dep.source_file_id ? protoFileRepository.findById(dep.source_file_id) : null;
    const targetFile = protoFileRepository.findById(dep.target_file_id);

    if (targetFile) {
      // 添加源节点（如果是文件级依赖）
      if (sourceFile && !nodes.has(sourceFile.id.toString())) {
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
      if (sourceFile) {
        edges.push({
          source: sourceFile.id.toString(),
          target: targetFile.id.toString(),
          type: 'import',
        });
      }
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
 * 获取子系统依赖关系图
 */
export function getSubsystemDependencyGraph(): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const deps = dependencyRepository.findAll();
  const subsystems = subsystemRepository.findAll();
  const files = protoFileRepository.findAll();

  // 构建节点
  const nodes: DependencyNode[] = subsystems.map(sub => ({
    id: `sub_${sub.id}`,
    label: sub.name,
    type: 'subsystem',
    category: sub.name,
  }));

  // 构建边 - 使用 Map 来聚合文件依赖
  const edgesMap = new Map<string, DependencyEdge>();

  // 预加载文件所属子系统映射和详情
  const fileSubsystemMap = new Map<number, number>();
  const fileDetailsMap = new Map<number, { id: number; filename: string; packageName: string }>();

  files.forEach(f => {
    if (f.subsystem_id) {
      fileSubsystemMap.set(f.id, f.subsystem_id);
      fileDetailsMap.set(f.id, {
        id: f.id,
        filename: f.filename,
        packageName: f.package_name,
      });
    }
  });

  deps.forEach(dep => {
    // 优先使用显示的 source_subsystem_id，否则从 source_file_id 推导
    const sourceSubId = dep.source_subsystem_id || (dep.source_file_id ? fileSubsystemMap.get(dep.source_file_id) : null);
    const targetSubId = fileSubsystemMap.get(dep.target_file_id);

    if (sourceSubId && targetSubId && sourceSubId !== targetSubId) {
      const edgeKey = `sub_${sourceSubId}->sub_${targetSubId}`;

      // 获取或创建边
      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          source: `sub_${sourceSubId}`,
          target: `sub_${targetSubId}`,
          type: 'import',
          fileDependencies: [],
        });
      }

      const edge = edgesMap.get(edgeKey)!;
      const sourceFile = dep.source_file_id ? fileDetailsMap.get(dep.source_file_id) : undefined;
      const targetFile = fileDetailsMap.get(dep.target_file_id);

      if (targetFile) {
        // 避免重复添加同一个目标文件依赖
        const alreadyExists = edge.fileDependencies?.some(fd =>
          fd.targetFile.id === targetFile.id && fd.sourceFile?.id === sourceFile?.id
        );

        if (!alreadyExists) {
          edge.fileDependencies?.push({
            id: dep.id,
            sourceFile,
            targetFile,
          });
        }
      }
    }
  });

  return {
    nodes,
    edges: Array.from(edgesMap.values()),
  };
}

/**
 * 影响分析
 */
export function getImpactAnalysis(fileId: number): {
  affectedSubsystems: string[];
  affectedFiles: number;
  dependencyChain: string[];
} {
  const directDependents = dependencyRepository.findByTargetFileId(fileId);
  const affectedFiles = directDependents.length;
  const subsystems = new Set<string>();

  directDependents.forEach((dep) => {
    let subName = '';
    if (dep.source_subsystem_id) {
      const sub = subsystemRepository.findById(dep.source_subsystem_id);
      if (sub) subName = sub.name;
    } else if (dep.source_file_id) {
      const file = protoFileRepository.findById(dep.source_file_id);
      if (file) {
        const sub = file.subsystem_id ? subsystemRepository.findById(file.subsystem_id) : null;
        if (sub) subName = sub.name;
      }
    }
    if (subName) subsystems.add(subName);
  });

  const dependencyChain: string[] = [protoFileRepository.findById(fileId)!.filename];
  const visited = new Set<number>();
  let current: number | undefined = fileId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const deps = dependencyRepository.findBySourceFileId(current);
    if (deps.length > 0) {
      current = deps[0].target_file_id;
      const file = protoFileRepository.findById(current);
      if (file) dependencyChain.push(file.filename);
    } else {
      current = undefined;
    }
  }

  return {
    affectedSubsystems: Array.from(subsystems),
    affectedFiles,
    dependencyChain,
  };
}

/**
 * 创建子系统依赖
 */
export function createSubsystemDependency(sourceSubsystemId: number, targetFileIds: number[]): { count: number; message: string } {
  const results = [];
  for (const targetFileId of targetFileIds) {
    const existing = dependencyRepository.findOne({
      source_subsystem_id: sourceSubsystemId,
      target_file_id: targetFileId
    });

    if (!existing) {
      const id = dependencyRepository.create({
        source_subsystem_id: sourceSubsystemId,
        source_file_id: null,
        target_file_id: targetFileId,
        dependency_type: 'import',
        created_at: new Date().toISOString(),
      });
      results.push(id);
    }
  }
  return { count: results.length, message: `已成功创建 ${results.length} 个依赖项` };
}

/**
 * 创建单条依赖
 */
export function createDependency(sourceFileId: number, targetFileId: number): { id: number; message: string } {
  const sourceFile = protoFileRepository.findById(sourceFileId);
  const sourceSubsystemId = sourceFile?.subsystem_id || null;

  const id = dependencyRepository.create({
    source_file_id: sourceFileId > 0 ? sourceFileId : null,
    source_subsystem_id: sourceSubsystemId,
    target_file_id: targetFileId,
    dependency_type: 'import',
    created_at: new Date().toISOString(),
  });
  return { id, message: '依赖创建成功' };
}

/**
 * 删除依赖
 */
export function deleteDependency(id: number): { message: string } {
  dependencyRepository.delete(id);
  return { message: '依赖关系已删除' };
}
