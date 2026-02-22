/**
 * 架构图服务层
 * 处理架构图的业务逻辑：层级、分组、节点位置、依赖验证
 */

import { architectureLayerRepository } from '../models/ArchitectureLayer';
import { subsystemGroupRepository } from '../models/SubsystemGroup';
import { subsystemGroupMemberRepository } from '../models/SubsystemGroupMember';
import { architectureNodePositionRepository } from '../models/ArchitectureNodePosition';
import { architectureSnapshotRepository } from '../models/ArchitectureSnapshot';
import { subsystemRepository } from '../models/Subsystem';
import { dependencyRepository } from '../models/Dependency';
import { protoFileRepository } from '../models/ProtoFile';
import type { ArchitectureLayerEntity } from '../models/ArchitectureLayer';
import type { SubsystemGroupEntity } from '../models/SubsystemGroup';
import type { ArchitectureNodePositionEntity } from '../models/ArchitectureNodePosition';

// ============================================
// 类型定义
// ============================================

export interface ArchitectureNode {
  id: string;
  type: 'subsystem' | 'group';
  name: string;
  layerLevel: number;
  x: number;
  y: number;
  width: number;
  height: number;
  combo?: string;  // 所属分组的 ID（G6 Combo 用）
  parentGroupId?: string;
  style?: {
    color: string;
    borderColor?: string;
  };
  // 子系统特有
  subsystemInfo?: {
    id: number;
    fileCount: number;
    dependenciesIn: number;
    dependenciesOut: number;
  };
  // 分组特有
  groupInfo?: {
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
 * G6 Combo 数据结构 - 表示分组容器
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
    groupId: number;
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
// 分组服务
// ============================================

export function getSubsystemGroups(): SubsystemGroupEntity[] {
  return subsystemGroupRepository.findAll();
}

export function getGroupsByLayer(layerId: number): SubsystemGroupEntity[] {
  return subsystemGroupRepository.findByLayer(layerId);
}

export function createSubsystemGroup(data: {
  name: string;
  layerId?: number;
  parentGroupId?: number;
  color?: string;
  columns?: number;
  positionX?: number;
  positionY?: number;
}): SubsystemGroupEntity {
  const result = subsystemGroupRepository.insert({
    name: data.name,
    layer_id: data.layerId || null,
    parent_group_id: data.parentGroupId || null,
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

  const group = subsystemGroupRepository.findById(id);
  if (!group) {
    throw new Error('创建分组失败');
  }
  return group as SubsystemGroupEntity;
}

export function updateGroupPosition(
  groupId: number,
  x: number,
  y: number
): void {
  subsystemGroupRepository.updatePosition(groupId, x, y);
}

export function toggleGroupCollapsed(groupId: number, collapsed: boolean): void {
  subsystemGroupRepository.toggleCollapsed(groupId, collapsed);
}

export function deleteSubsystemGroup(groupId: number): void {
  // 删除分组（级联删除成员关联）
  subsystemGroupRepository.delete(groupId);
}

export function updateGroupInfo(groupId: number, data: { columns?: number, name?: string, color?: string, layerId?: number }): void {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (data.columns !== undefined) updateData.columns = data.columns;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.layerId !== undefined) updateData.layer_id = data.layerId;
  subsystemGroupRepository.update(groupId, updateData);
}

// ============================================
// 分组成员服务
// ============================================

export function addSubsystemToGroup(
  groupId: number,
  subsystemId: number,
  positionX?: number,
  positionY?: number
): void {
  subsystemGroupMemberRepository.addToGroup(groupId, subsystemId, positionX, positionY);
}

export function updateSubsystemGroup(
  subsystemId: number,
  newGroupId: number | null
): void {
  // First, get all current groups and remove from them
  const currentGroups = subsystemGroupMemberRepository.getGroupsForSubsystem(subsystemId);
  for (const oldGroupId of currentGroups) {
    if (oldGroupId !== newGroupId) {
      removeSubsystemFromGroup(oldGroupId, subsystemId);
    }
  }

  // Then add to new group if not null and not already in it
  if (newGroupId !== null && !currentGroups.includes(newGroupId)) {
    addSubsystemToGroup(newGroupId, subsystemId);
  }
}

export function removeSubsystemFromGroup(groupId: number, subsystemId: number): void {
  subsystemGroupMemberRepository.removeFromGroup(groupId, subsystemId);
}

export function getSubsystemsInGroup(groupId: number): number[] {
  const members = subsystemGroupMemberRepository.findByGroup(groupId);
  return members.map(m => m.subsystem_id);
}

// ============================================
// 节点位置服务
// ============================================

export function saveNodePosition(
  nodeId: string,
  nodeType: 'subsystem' | 'group',
  x: number,
  y: number,
  layerLevel?: number,
  parentGroupId?: number,
  width: number = 120,
  height: number = 60
): void {
  architectureNodePositionRepository.savePosition(
    nodeId, nodeType, x, y, layerLevel, parentGroupId, width, height
  );
}

export function batchSaveNodePositions(
  positions: Array<{
    nodeId: string;
    nodeType: 'subsystem' | 'group';
    x: number;
    y: number;
    layerLevel?: number;
    parentGroupId?: number;
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

  // 2. 获取所有子系统
  const subsystems = subsystemRepository.findAll();

  // 3. 获取所有分组
  const groups = subsystemGroupRepository.findAll();

  // 4. 获取节点位置
  const positions = getNodePositions();
  const positionMap = new Map(positions.map(p => [p.node_id, p]));

  // 5. 获取文件统计
  const files = protoFileRepository.findAll();
  const fileCountMap = new Map<number, number>();
  files.forEach(f => {
    if (f.subsystem_id) {
      fileCountMap.set(f.subsystem_id, (fileCountMap.get(f.subsystem_id) || 0) + 1);
    }
  });

  // 6. 获取依赖统计
  const deps = dependencyRepository.findAll();
  const depsInMap = new Map<number, number>();
  const depsOutMap = new Map<number, number>();

  // 构建文件到子系统的映射
  const fileSubsystemMap = new Map<number, number>();
  files.forEach(f => {
    if (f.subsystem_id) {
      fileSubsystemMap.set(f.id, f.subsystem_id);
    }
  });

  deps.forEach(d => {
    const targetSub = fileSubsystemMap.get(d.target_file_id);
    if (targetSub) {
      depsInMap.set(targetSub, (depsInMap.get(targetSub) || 0) + 1);
    }
    if (d.source_file_id) {
      const sourceSub = fileSubsystemMap.get(d.source_file_id);
      if (sourceSub) {
        depsOutMap.set(sourceSub, (depsOutMap.get(sourceSub) || 0) + 1);
      }
    }
  });

  // 7. 构建 combos（分组）
  const combos: ArchitectureCombo[] = groups.map((group, index) => {
    const layer = layers.find(l => l.id === group.layer_id);
    // 获取分组位置，如果没有则使用默认值
    const defaultX = 100 + (index % 3) * 300;
    const defaultY = 100 + Math.floor(index / 3) * 250;

    const pos = positionMap.get(`group_${group.id}`);

    return {
      id: `group_${group.id}`,
      type: 'combo',
      label: group.name,
      layerLevel: layer?.level || 3,
      collapsed: !!group.collapsed,
      // 优先从 positionMap 取，其次是 group 的原字段，最后是默认值
      x: pos?.x ?? (group.position_x !== 0 ? group.position_x : null) ?? defaultX,
      y: pos?.y ?? (group.position_y !== 0 ? group.position_y : null) ?? defaultY,
      style: {
        fill: group.color || '#fff7e6',
        stroke: '#fa8c16',
        lineWidth: 2,
        lineDash: [5, 5],
      },
      data: {
        groupId: group.id,
        color: group.color,
        columns: group.columns || 3,
        childrenCount: getSubsystemsInGroup(group.id).length,
      },
    };
  });

  // 8. 构建子系统节点，并查询所属分组
  const nodes: ArchitectureNode[] = [];

  // 构建子系统到分组的映射
  const subsystemToGroupMap = new Map<number, string>();
  groups.forEach(group => {
    const members = subsystemGroupMemberRepository.findByGroup(group.id);
    members.forEach(member => {
      subsystemToGroupMap.set(member.subsystem_id, `group_${group.id}`);
    });
  });

  subsystems.forEach((sub, index) => {
    const pos = positionMap.get(`sub_${sub.id}`);
    const layerIndex = (sub.layer_level || 3) - 1;
    const defaultX = 100 + (index % 5) * 150;
    const defaultY = 100 + layerIndex * 200;

    // 获取所属分组的 ID
    const comboId = subsystemToGroupMap.get(sub.id);

    nodes.push({
      id: `sub_${sub.id}`,
      type: 'subsystem',
      name: sub.name,
      layerLevel: sub.layer_level || 3,
      x: pos?.x ?? defaultX,
      y: pos?.y ?? defaultY,
      width: pos?.width ?? 120,
      height: pos?.height ?? 60,
      combo: comboId,  // G6 Combo 用 - 指定所属分组
      parentGroupId: comboId,
      style: {
        color: layers.find(l => l.level === (sub.layer_level || 3))?.color || '#91cc75',
      },
      subsystemInfo: {
        id: sub.id,
        fileCount: fileCountMap.get(sub.id) || 0,
        dependenciesIn: depsInMap.get(sub.id) || 0,
        dependenciesOut: depsOutMap.get(sub.id) || 0,
      },
    });
  });

  // 9. 构建边（子系统级依赖）
  const edgeMap = new Map<string, ArchitectureEdge>();

  deps.forEach(dep => {
    const sourceSub = dep.source_file_id ? fileSubsystemMap.get(dep.source_file_id) : null;
    const targetSub = fileSubsystemMap.get(dep.target_file_id);

    if (sourceSub && targetSub && sourceSub !== targetSub) {
      const edgeKey = `sub_${sourceSub}->sub_${targetSub}`;

      if (!edgeMap.has(edgeKey)) {
        const sourceNode = nodes.find(n => n.id === `sub_${sourceSub}`);
        const targetNode = nodes.find(n => n.id === `sub_${targetSub}`);

        const sourceLayer = sourceNode?.layerLevel || 3;
        const targetLayer = targetNode?.layerLevel || 3;

        let direction: 'down' | 'same' | 'up' = 'same';
        if (sourceLayer > targetLayer) direction = 'down';
        else if (sourceLayer < targetLayer) direction = 'up';

        edgeMap.set(edgeKey, {
          id: edgeKey,
          source: `sub_${sourceSub}`,
          target: `sub_${targetSub}`,
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
  // 解析 ID
  const sourceMatch = sourceId.match(/sub_(\d+)/);
  const targetMatch = targetId.match(/sub_(\d+)/);

  if (!sourceMatch || !targetMatch) {
    return { valid: false, reason: '无效的节点ID', severity: 'error' };
  }

  const sourceSubId = parseInt(sourceMatch[1]);
  const targetSubId = parseInt(targetMatch[1]);

  // 1. 不能依赖自己
  if (sourceSubId === targetSubId) {
    return { valid: false, reason: '子系统不能依赖自己', severity: 'error' };
  }

  // 2. 获取层级信息
  const sourceSub = subsystemRepository.findById(sourceSubId);
  const targetSub = subsystemRepository.findById(targetSubId);

  if (!sourceSub || !targetSub) {
    return { valid: false, reason: '子系统不存在', severity: 'error' };
  }

  const sourceLayer = sourceSub.layer_level || 3;
  const targetLayer = targetSub.layer_level || 3;

  // 3. 下层不能依赖上层
  if (sourceLayer < targetLayer) {
    return {
      valid: false,
      reason: `基础层（${sourceLayer}）不能依赖应用层（${targetLayer}），违反架构分层原则`,
      severity: 'error'
    };
  }

  // 4. 检查循环依赖
  const hasCycle = checkCircularDependency(sourceSubId, targetSubId);
  if (hasCycle) {
    return { valid: false, reason: '会产生循环依赖', severity: 'error' };
  }

  // 5. 同级依赖过多时警告
  if (sourceLayer === targetLayer) {
    const siblingDeps = countSiblingDependencies(sourceSubId, sourceLayer);
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

    // 获取当前子系统的依赖
    const files = protoFileRepository.findAll().filter(f => f.subsystem_id === current);
    const fileIds = files.map(f => f.id);

    const deps = dependencyRepository.findAll().filter(d =>
      fileIds.includes(d.target_file_id)
    );

    for (const dep of deps) {
      if (dep.source_file_id) {
        const sourceFile = protoFileRepository.findById(dep.source_file_id);
        if (sourceFile?.subsystem_id) {
          stack.push(sourceFile.subsystem_id);
        }
      }
    }
  }

  return false;
}

function countSiblingDependencies(subsystemId: number, layer: number): number {
  const files = protoFileRepository.findAll().filter(f => f.subsystem_id === subsystemId);
  const fileIds = files.map(f => f.id);

  let count = 0;
  const deps = dependencyRepository.findAll();

  for (const dep of deps) {
    if (fileIds.includes(dep.source_file_id || 0)) {
      const targetFile = protoFileRepository.findById(dep.target_file_id);
      if (targetFile?.subsystem_id) {
        const targetSub = subsystemRepository.findById(targetFile.subsystem_id);
        if (targetSub?.layer_level === layer && targetFile.subsystem_id !== subsystemId) {
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
