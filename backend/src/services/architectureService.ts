/**
 * 架构图服务层
 * 处理架构图的业务逻辑：层级、分组、节点位置、依赖验证
 */

import { architectureLayerRepository } from '../models/ArchitectureLayer';
import { subsystemRepository } from '../models/Subsystem';
import { subsystemMemberRepository } from '../models/SubsystemMember';
import { architectureNodePositionRepository } from '../models/ArchitectureNodePosition';
import { architectureSnapshotRepository } from '../models/ArchitectureSnapshot';
import { functionModuleRepository } from '../models/FunctionModule';
import { dependencyRepository } from '../models/Dependency';
import { protoFileRepository } from '../models/ProtoFile';
import type { ArchitectureLayerEntity } from '../models/ArchitectureLayer';
import type { SubsystemEntity } from '../models/Subsystem';
import type { ArchitectureNodePositionEntity } from '../models/ArchitectureNodePosition';

// ============================================
// 类型定义
// ============================================

export interface ArchitectureNode {
  id: string;
  type: 'function_module' | 'subsystem';
  name: string;
  layerLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
  combo?: string;  // 所属子系统的 ID（G6 Combo 用）
  parentSubsystemId?: string;
  style?: {
    color: string;
    borderColor?: string;
  };
  // 功能模块特有
  functionModuleInfo?: {
    id: number;
    fileCount: number;
    dependenciesIn: number;
    dependenciesOut: number;
  };
  // 子系统特有
  subsystemInfo?: {
    id: number;
    collapsed: boolean;
    childrenCount: number;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  sourceLayer: number;
  targetLayer: number;
  direction: 'down' | 'same' | 'up';
  valid: boolean;
  dependencyCount: number;
  fileDependencies?: Array<{
    sourceFile: { id: number; filename: string; packageName: string };
    targetFile: { id: number; filename: string; packageName: string };
  }>;
}

/**
 * G6 Combo 数据结构 - 表示子系统容器
 */
export interface ArchitectureCombo {
  id: string;
  type?: 'combo';
  label: string;
  layerLevel: number;
  collapsed?: boolean;
  x?: number;  // 位置 X
  y?: number;  // 位置 Y
  style?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    lineDash?: number[];
    [key: string]: any;
  };
  data?: {
    subsystemId: number;
    color?: string | null;
    childrenCount: number;
    columns: number;
    [key: string]: any;
  };
}

export interface ArchitectureGraph {
  layers: ArchitectureLayerEntity[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  combos: ArchitectureCombo[];  // G6 Combo 数据
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================
// 层级服务
// ============================================

export function getArchitectureLayers(): ArchitectureLayerEntity[] {
  return architectureLayerRepository.findAllOrdered();
}

// ============================================
// 子系统服务
// ============================================

export function getSubsystems(): SubsystemEntity[] {
  return subsystemRepository.findAll();
}

export function getGroupsByLayer(layerId: number): SubsystemEntity[] {
  return subsystemRepository.findByLayer(layerId);
}

export function createSubsystemGroup(data: {
  name: string;
  layerId?: number;
  parentGroupId?: number;
  color?: string;
  columns?: number;
  positionX?: number;
  positionY?: number;
}): SubsystemEntity {
  const result = subsystemRepository.insert({
    name: data.name,
    layer_id: data.layerId || null,
    parent_subsystem_id: data.parentGroupId || null,
    color: data.color || null,
    columns: data.columns !== undefined ? data.columns : 3,
    position_x: data.positionX || 0,
    position_y: data.positionY || 0,
    width: 300,
    height: 200,
    collapsed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const id = Number(result.lastInsertRowid);

  const group = subsystemRepository.findById(id);
  if (!group) {
    throw new Error('创建分组失败');
  }
  return group as SubsystemEntity;
}

export function updateGroupPosition(
  groupId: number,
  x: number,
  y: number
): void {
  subsystemRepository.updatePosition(groupId, x, y);
}

export function toggleGroupCollapsed(groupId: number, collapsed: boolean): void {
  subsystemRepository.toggleCollapsed(groupId, collapsed);
}

export function deleteSubsystemGroup(groupId: number): void {
  // 删除分组（级联删除成员关联）
  subsystemRepository.delete(groupId);
}

export function updateGroupInfo(groupId: number, data: { columns?: number, name?: string, color?: string, layerId?: number }): void {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (data.columns !== undefined) updateData.columns = data.columns;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.layerId !== undefined) updateData.layer_id = data.layerId;
  subsystemRepository.update(groupId, updateData);
}

// ============================================
// 分组成员服务
// ============================================

export function addToSubsystem(
  subsystemId: number,
  functionModuleId: number,
  positionX?: number,
  positionY?: number
): void {
  subsystemMemberRepository.addToSubsystem(subsystemId, functionModuleId, positionX, positionY);
}

export function updateFunctionModuleSubsystem(
  functionModuleId: number,
  newSubsystemId: number | null
): void {
  // First, get all current subsystems and remove from them
  const currentSubsystems = subsystemMemberRepository.getSubsystemsForFunctionModule(functionModuleId);
  for (const oldSubsystemId of currentSubsystems) {
    if (oldSubsystemId !== newSubsystemId) {
      removeFromSubsystem(oldSubsystemId, functionModuleId);
    }
  }

  // Then add to new subsystem if not null and not already in it
  if (newSubsystemId !== null && !currentSubsystems.includes(newSubsystemId)) {
    addToSubsystem(newSubsystemId, functionModuleId);
  }
}

export function removeFromSubsystem(subsystemId: number, functionModuleId: number): void {
  subsystemMemberRepository.removeFromSubsystem(subsystemId, functionModuleId);
}

export function getFunctionModulesInSubsystem(subsystemId: number): number[] {
  const members = subsystemMemberRepository.findBySubsystem(subsystemId);
  return members.map(m => m.function_module_id);
}

// ============================================
// 节点位置服务
// ============================================

export function saveNodePosition(
  nodeId: string,
  nodeType: 'function_module' | 'subsystem',
  x: number,
  y: number,
  layerLevel?: number,
  parentSubsystemId?: number,
  width: number = 120,
  height: number = 60
): void {
  architectureNodePositionRepository.savePosition(
    nodeId, nodeType, x, y, layerLevel, parentSubsystemId, width, height
  );
}

export function batchSaveNodePositions(
  positions: Array<{
    nodeId: string;
    nodeType: 'function_module' | 'subsystem';
    x: number;
    y: number;
    layerLevel?: number;
    parentSubsystemId?: number;
    width?: number;
    height?: number;
  }>
): void {
  architectureNodePositionRepository.batchSavePositions(positions);
}

export function getNodePositions(): ArchitectureNodePositionEntity[] {
  return architectureNodePositionRepository.findAll();
}

// ============================================
// 架构图构建服务
// ============================================

export function buildArchitectureGraph(): ArchitectureGraph {
  // 1. 获取层级定义
  const layers = getArchitectureLayers();

  // 2. 获取所有功能模块（作为图中的节点）
  const functionModules = functionModuleRepository.findAll();

  // 3. 获取所有子系统（作为 combo/分组）
  const subsystems = subsystemRepository.findAll();

  // 4. 获取节点位置
  const positions = getNodePositions();
  const positionMap = new Map(positions.map(p => [p.node_id, p]));

  // 5. 获取文件统计（按功能模块）
  const files = protoFileRepository.findAll();
  const fileCountMap = new Map<number, number>();
  files.forEach(f => {
    if (f.function_module_id) {
      fileCountMap.set(f.function_module_id, (fileCountMap.get(f.function_module_id) || 0) + 1);
    }
  });

  // 6. 获取依赖统计
  const deps = dependencyRepository.findAll();
  const depsInMap = new Map<number, number>();
  const depsOutMap = new Map<number, number>();

  // 构建文件到功能模块的映射
  const fileFunctionModuleMap = new Map<number, number>();
  files.forEach(f => {
    if (f.function_module_id) {
      fileFunctionModuleMap.set(f.id, f.function_module_id);
    }
  });

  deps.forEach(d => {
    const targetFm = fileFunctionModuleMap.get(d.target_file_id);
    if (targetFm) {
      depsInMap.set(targetFm, (depsInMap.get(targetFm) || 0) + 1);
    }
    if (d.source_file_id) {
      const sourceFm = fileFunctionModuleMap.get(d.source_file_id);
      if (sourceFm) {
        depsOutMap.set(sourceFm, (depsOutMap.get(sourceFm) || 0) + 1);
      }
    }
  });

  // 7. 构建 combos（子系统作为容器）
  const combos: ArchitectureCombo[] = subsystems.map((subsystem, index) => {
    const layer = layers.find(l => l.id === subsystem.layer_id);
    // 获取子系统位置，如果没有则使用默认值
    const defaultX = 100 + (index % 3) * 300;
    const defaultY = 100 + Math.floor(index / 3) * 250;

    const pos = positionMap.get(`sub_${subsystem.id}`);

    return {
      id: `sub_${subsystem.id}`,
      type: 'combo',
      label: subsystem.name,
      layerLevel: layer?.level || 3,
      collapsed: !!subsystem.collapsed,
      // 优先从 positionMap 取，其次是 subsystem 的原字段，最后是默认值
      x: pos?.x ?? (subsystem.position_x !== 0 ? subsystem.position_x : null) ?? defaultX,
      y: pos?.y ?? (subsystem.position_y !== 0 ? subsystem.position_y : null) ?? defaultY,
      style: {
        fill: subsystem.color || '#fff7e6',
        stroke: '#fa8c16',
        lineWidth: 2,
        lineDash: [5, 5],
      },
      data: {
        subsystemId: subsystem.id,
        color: subsystem.color,
        columns: subsystem.columns || 3,
        childrenCount: getFunctionModulesInSubsystem(subsystem.id).length,
      },
    };
  });

  // 8. 构建功能模块节点，并查询所属子系统
  const nodes: ArchitectureNode[] = [];

  // 构建功能模块到子系统的映射
  const functionModuleToSubsystemMap = new Map<number, string>();
  subsystems.forEach(subsystem => {
    const members = subsystemMemberRepository.findBySubsystem(subsystem.id);
    members.forEach(member => {
      functionModuleToSubsystemMap.set(member.function_module_id, `sub_${subsystem.id}`);
    });
  });

  functionModules.forEach((fm, index) => {
    const pos = positionMap.get(`func_mod_${fm.id}`);
    const layerIndex = (fm.layer_level || 3) - 1;
    const defaultX = 100 + (index % 5) * 150;
    const defaultY = 100 + layerIndex * 200;

    // 获取所属子系统的 ID
    const comboId = functionModuleToSubsystemMap.get(fm.id);

    nodes.push({
      id: `func_mod_${fm.id}`,
      type: 'function_module',
      name: fm.name,
      layerLevel: fm.layer_level || 3,
      x: pos?.x ?? defaultX,
      y: pos?.y ?? defaultY,
      width: pos?.width ?? 120,
      height: pos?.height ?? 60,
      combo: comboId,  // G6 Combo 用 - 指定所属子系统
      parentSubsystemId: comboId,
      style: {
        color: layers.find(l => l.level === (fm.layer_level || 3))?.color || '#91cc75',
      },
      functionModuleInfo: {
        id: fm.id,
        fileCount: fileCountMap.get(fm.id) || 0,
        dependenciesIn: depsInMap.get(fm.id) || 0,
        dependenciesOut: depsOutMap.get(fm.id) || 0,
      },
    });
  });

  // 9. 构建边（功能模块级依赖）
  const edgeMap = new Map<string, ArchitectureEdge>();

  deps.forEach(dep => {
    const sourceFm = dep.source_file_id ? fileFunctionModuleMap.get(dep.source_file_id) : null;
    const targetFm = fileFunctionModuleMap.get(dep.target_file_id);

    if (sourceFm && targetFm && sourceFm !== targetFm) {
      const edgeKey = `func_mod_${sourceFm}->func_mod_${targetFm}`;

      if (!edgeMap.has(edgeKey)) {
        const sourceNode = nodes.find(n => n.id === `func_mod_${sourceFm}`);
        const targetNode = nodes.find(n => n.id === `func_mod_${targetFm}`);

        const sourceLayer = sourceNode?.layerLevel || 3;
        const targetLayer = targetNode?.layerLevel || 3;

        let direction: 'down' | 'same' | 'up' = 'same';
        if (sourceLayer > targetLayer) direction = 'down';
        else if (sourceLayer < targetLayer) direction = 'up';

        edgeMap.set(edgeKey, {
          id: edgeKey,
          source: `func_mod_${sourceFm}`,
          target: `func_mod_${targetFm}`,
          sourceLayer,
          targetLayer,
          direction,
          valid: direction !== 'up',
          dependencyCount: 0,
          fileDependencies: [],
        });
      }

      const edge = edgeMap.get(edgeKey)!;
      edge.dependencyCount++;

      const sourceFile = files.find(f => f.id === dep.source_file_id);
      const targetFile = files.find(f => f.id === dep.target_file_id);

      if (sourceFile && targetFile) {
        edge.fileDependencies!.push({
          sourceFile: {
            id: sourceFile.id,
            filename: sourceFile.filename,
            packageName: sourceFile.package_name,
          },
          targetFile: {
            id: targetFile.id,
            filename: targetFile.filename,
            packageName: targetFile.package_name,
          },
        });
      }
    }
  });

  return {
    layers,
    nodes,
    edges: Array.from(edgeMap.values()),
    combos,
  };
}

// ============================================
// 依赖验证服务
// ============================================

export function validateDependency(
  sourceId: string,
  targetId: string
): ValidationResult {
  // 解析 ID (功能模块ID格式: func_mod_数字)
  const sourceMatch = sourceId.match(/func_mod_(\d+)/);
  const targetMatch = targetId.match(/func_mod_(\d+)/);

  if (!sourceMatch || !targetMatch) {
    return { valid: false, reason: '无效的节点ID', severity: 'error' };
  }

  const sourceFmId = parseInt(sourceMatch[1]);
  const targetFmId = parseInt(targetMatch[1]);

  // 1. 不能依赖自己
  if (sourceFmId === targetFmId) {
    return { valid: false, reason: '功能模块不能依赖自己', severity: 'error' };
  }

  // 2. 获取层级信息
  const sourceFm = functionModuleRepository.findById(sourceFmId);
  const targetFm = functionModuleRepository.findById(targetFmId);

  if (!sourceFm || !targetFm) {
    return { valid: false, reason: '功能模块不存在', severity: 'error' };
  }

  const sourceLayer = sourceFm.layer_level || 3;
  const targetLayer = targetFm.layer_level || 3;

  // 3. 下层不能依赖上层
  if (sourceLayer < targetLayer) {
    return {
      valid: false,
      reason: `基础层（${sourceLayer}）不能依赖应用层（${targetLayer}），违反架构分层原则`,
      severity: 'error'
    };
  }

  // 4. 检查循环依赖
  const hasCycle = checkCircularDependency(sourceFmId, targetFmId);
  if (hasCycle) {
    return { valid: false, reason: '会产生循环依赖', severity: 'error' };
  }

  // 5. 同级依赖过多时警告
  if (sourceLayer === targetLayer) {
    const siblingDeps = countSiblingDependencies(sourceFmId, sourceLayer);
    if (siblingDeps > 5) {
      return {
        valid: true,
        reason: `同级依赖较多（${siblingDeps}个），建议考虑是否需要重构`,
        severity: 'warning'
      };
    }
  }

  return { valid: true, severity: 'info' };
}

function checkCircularDependency(sourceId: number, targetId: number): boolean {
  // 简化的循环依赖检测
  const visited = new Set<number>();
  const stack = [targetId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === sourceId) {
      return true; // 发现循环
    }

    if (visited.has(current)) continue;
    visited.add(current);

    // 获取当前功能模块的文件
    const files = protoFileRepository.findAll().filter(f => f.function_module_id === current);
    const fileIds = files.map(f => f.id);

    const deps = dependencyRepository.findAll().filter(d =>
      fileIds.includes(d.target_file_id)
    );

    for (const dep of deps) {
      if (dep.source_file_id) {
        const sourceFile = protoFileRepository.findById(dep.source_file_id);
        if (sourceFile?.function_module_id) {
          stack.push(sourceFile.function_module_id);
        }
      }
    }
  }

  return false;
}

function countSiblingDependencies(subsystemId: number, layer: number): number {
  const files = protoFileRepository.findAll().filter(f => f.function_module_id === subsystemId);
  const fileIds = files.map(f => f.id);

  let count = 0;
  const deps = dependencyRepository.findAll();

  for (const dep of deps) {
    if (fileIds.includes(dep.source_file_id || 0)) {
      const targetFile = protoFileRepository.findById(dep.target_file_id);
      if (targetFile?.function_module_id) {
        const targetFM = functionModuleRepository.findById(targetFile.function_module_id);
        if (targetFM?.layer_level === layer && targetFile.function_module_id !== subsystemId) {
          count++;
        }
      }
    }
  }

  return count;
}

// ============================================
// 快照服务
// ============================================

export function saveSnapshot(
  name: string,
  data: ArchitectureGraph,
  description?: string,
  userId?: number,
  isDefault: boolean = false
): number {
  return architectureSnapshotRepository.createSnapshot(
    name, data, description, userId, isDefault
  );
}

export function getSnapshots() {
  return architectureSnapshotRepository.findAllOrdered();
}

export function getDefaultSnapshot() {
  return architectureSnapshotRepository.findDefault();
}

export function loadSnapshot(snapshotId: number): ArchitectureGraph | null {
  const snapshot = architectureSnapshotRepository.findById(snapshotId);
  if (!snapshot) return null;

  return architectureSnapshotRepository.parseData(snapshot);
}

export function setDefaultSnapshot(snapshotId: number): void {
  architectureSnapshotRepository.setDefault(snapshotId);
}
