/**
 * 架构图 API 服务
 */

import { api } from './api';

export interface ArchitectureLayer {
  id: number;
  name: string;
  level: number;
  color?: string;
  description?: string;
}

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
  subsystemInfo?: {
    id: number;
    fileCount: number;
    dependenciesIn: number;
    dependenciesOut: number;
  };
  groupInfo?: {
    id: number;
    collapsed: boolean;
    childrenCount: number;
  };
}

export interface ArchitectureCombo {
  id: string;
  type?: 'combo';
  label: string;
  layerLevel: number;
  collapsed?: boolean;
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
    [key: string]: any;
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

export interface ArchitectureGraph {
  layers: ArchitectureLayer[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  combos: ArchitectureCombo[];
}

/**
 * 获取架构图完整数据
 */
export async function getArchitectureGraph(): Promise<ArchitectureGraph> {
  const response = await api.get('/architecture/graph');
  return response.data;
}

/**
 * 获取层级定义
 */
export async function getArchitectureLayers(): Promise<ArchitectureLayer[]> {
  const response = await api.get('/architecture/layers');
  return response.data;
}

/**
 * 获取所有分组
 */
export async function getSubsystemGroups(): Promise<any[]> {
  const response = await api.get('/architecture/groups');
  return response.data;
}

/**
 * 创建分组
 */
export async function createSubsystemGroup(data: {
  name: string;
  layerId?: number;
  parentGroupId?: number;
  color?: string;
  positionX?: number;
  positionY?: number;
}): Promise<any> {
  const response = await api.post('/architecture/groups', data);
  return response.data;
}

/**
 * 更新分组位置
 */
export async function updateGroupPosition(
  groupId: number,
  x: number,
  y: number
): Promise<void> {
  await api.put(`/architecture/groups/${groupId}/position`, { x, y });
}

/**
 * 切换分组折叠状态
 */
export async function toggleGroupCollapsed(
  groupId: number,
  collapsed: boolean
): Promise<void> {
  await api.put(`/architecture/groups/${groupId}/collapsed`, { collapsed });
}

/**
 * 删除分组
 */
export async function deleteSubsystemGroup(groupId: number): Promise<void> {
  await api.delete(`/architecture/groups/${groupId}`);
}

/**
 * 添加子系统到分组
 */
export async function addSubsystemToGroup(
  groupId: number,
  subsystemId: number,
  positionX?: number,
  positionY?: number
): Promise<void> {
  await api.post(`/architecture/groups/${groupId}/members`, {
    subsystemId,
    positionX,
    positionY,
  });
}

/**
 * 从分组移除子系统
 */
export async function removeSubsystemFromGroup(
  groupId: number,
  subsystemId: number
): Promise<void> {
  await api.delete(`/architecture/groups/${groupId}/members`, {
    data: { subsystemId },
  });
}

/**
 * 保存节点位置（批量）
 */
export async function saveNodePositions(
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
): Promise<void> {
  await api.post('/architecture/node-positions', { positions });
}

/**
 * 验证依赖合法性
 */
export async function validateDependency(
  sourceId: string,
  targetId: string
): Promise<{
  valid: boolean;
  reason?: string;
  severity: 'error' | 'warning' | 'info';
}> {
  const response = await api.post('/architecture/validate-dependency', {
    sourceId,
    targetId,
  });
  return response.data;
}

/**
 * 保存架构图快照
 */
export async function saveSnapshot(
  name: string,
  data: any,
  description?: string,
  isDefault: boolean = false
): Promise<number> {
  const response = await api.post('/architecture/snapshots', {
    name,
    data,
    description,
    isDefault,
  });
  return response.data.id;
}

/**
 * 获取所有快照
 */
export async function getSnapshots(): Promise<any[]> {
  const response = await api.get('/architecture/snapshots');
  return response.data;
}

/**
 * 加载快照
 */
export async function loadSnapshot(snapshotId: number): Promise<any> {
  const response = await api.get(`/architecture/snapshots/${snapshotId}`);
  return response.data;
}

/**
 * 设置默认快照
 */
export async function setDefaultSnapshot(snapshotId: number): Promise<void> {
  await api.put(`/architecture/snapshots/${snapshotId}/default`);
}

/**
 * 获取默认快照
 */
export async function getDefaultSnapshot(): Promise<any | null> {
  const response = await api.get('/architecture/snapshots/default');
  return response.data;
}

/**
 * 更新子系统层级
 */
export async function updateSubsystemLayer(
  subsystemId: number,
  layerLevel: number
): Promise<void> {
  await api.put(`/architecture/subsystems/${subsystemId}/layer`, { layerLevel });
}
