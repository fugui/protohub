/**
 * 架构图数据和操作 Hook
 * 统一管理所有架构图数据获取、状态和后端交互
 */

import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { api } from '../../../services/api';
import type {
  ArchitectureGraph,
  ArchitectureLayer,
  ArchitectureCombo,
} from '../../../services/architectureService';

export interface PositionUpdate {
  nodeId: string;
  nodeType: 'function_module' | 'subsystem';
  x: number;
  y: number;
  layerLevel?: number;
  parentGroupId?: number | null;
  width?: number;
  height?: number;
}

export function useArchitectureGraph() {
  const [graphData, setGraphData] = useState<ArchitectureGraph | null>(null);
  const [layers, setLayers] = useState<ArchitectureLayer[]>([]);
  const [combos, setCombos] = useState<ArchitectureCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // 防抖位置保存
  const pendingPositionsRef = useRef<PositionUpdate[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);

  // 本地坐标缓存（5秒有效，防止后端覆盖用户刚拖拽的位置）
  const localPositionCacheRef = useRef<Map<string, { x: number; y: number; ts: number }>>(new Map());

  /**
   * 从后端获取架构图数据
   */
  const fetchGraphData = useCallback(async (): Promise<ArchitectureGraph | null> => {
    try {
      const response = await api.get('/architecture/graph');
      const data: ArchitectureGraph = response.data;
      setGraphData(data);
      setLayers(data.layers);
      setCombos(data.combos || []);
      return data;
    } catch (error) {
      message.error('获取架构图失败');
      console.error(error);
      return null;
    }
  }, []);

  /**
   * 初始加载
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      await fetchGraphData();
    } finally {
      setLoading(false);
    }
  }, [fetchGraphData]);

  /**
   * 防抖批量保存节点位置
   */
  const savePositions = useCallback((positions: PositionUpdate[]) => {
    // 写入本地缓存
    positions.forEach((p) => {
      localPositionCacheRef.current.set(p.nodeId, { x: p.x, y: p.y, ts: Date.now() });
    });

    pendingPositionsRef.current = [...pendingPositionsRef.current, ...positions];

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      const toSave = pendingPositionsRef.current;
      pendingPositionsRef.current = [];
      if (toSave.length === 0) return;
      try {
        await api.post('/architecture/node-positions', { positions: toSave });
      } catch (error: any) {
        if (error.response?.status !== 429) {
          console.error('保存位置失败:', error);
        }
      }
    }, 500);
  }, []);

  /**
   * 获取节点的本地缓存坐标（5秒有效）
   */
  const getLocalPosition = useCallback(
    (nodeId: string): { x: number; y: number } | null => {
      const cached = localPositionCacheRef.current.get(nodeId);
      if (cached && Date.now() - cached.ts < 5000) {
        return { x: cached.x, y: cached.y };
      }
      return null;
    },
    []
  );

  /**
   * 更新功能模块所属子系统（拖拽或下拉选择）
   */
  const updateFMSubsystem = useCallback(
    async (fmId: string | number, newSubsystemId: number | null): Promise<boolean> => {
      try {
        await api.put(`/architecture/function-modules/${fmId}/subsystem`, {
          subsystemId: newSubsystemId,
        });
        return true;
      } catch (error) {
        message.error('更新所属子系统失败');
        return false;
      }
    },
    []
  );

  /**
   * 创建子系统
   */
  const createSubsystem = useCallback(
    async (data: {
      name: string;
      layerId?: number;
      color?: string;
      columns?: number;
      positionX?: number;
      positionY?: number;
    }): Promise<boolean> => {
      try {
        await api.post('/architecture/groups', data);
        message.success('子系统创建成功');
        return true;
      } catch (error) {
        message.error('创建子系统失败');
        return false;
      }
    },
    []
  );

  /**
   * 更新子系统信息（名称、列数、颜色、层级）
   */
  const updateSubsystemInfo = useCallback(
    async (
      groupId: number,
      data: { name?: string; layerId?: number; color?: string; columns?: number }
    ): Promise<boolean> => {
      try {
        await api.put(`/architecture/groups/${groupId}`, data);
        return true;
      } catch (error) {
        message.error('更新子系统失败');
        return false;
      }
    },
    []
  );

  /**
   * 验证两个 FM 之间的依赖是否合法
   */
  const validateDependency = useCallback(
    async (
      sourceId: string,
      targetId: string
    ): Promise<{ valid: boolean; reason?: string; severity: 'error' | 'warning' | 'info' }> => {
      try {
        const response = await api.post('/architecture/validate-dependency', {
          sourceId,
          targetId,
        });
        return response.data;
      } catch (error) {
        return { valid: false, reason: '验证请求失败', severity: 'error' };
      }
    },
    []
  );

  /**
   * 更新功能模块所属层级
   */
  const updateFMLayer = useCallback(
    async (fmId: string | number, layerLevel: number): Promise<boolean> => {
      try {
        await api.put(`/architecture/function-modules/${fmId}/layer`, { layerLevel });
        message.success('层级修改成功');
        return true;
      } catch (error) {
        message.error('修改层级失败');
        return false;
      }
    },
    []
  );

  /**
   * 清理防抖定时器
   */
  const destroy = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    graphData,
    layers,
    combos,
    loading,
    editMode,
    setEditMode,
    load,
    fetchGraphData,
    savePositions,
    getLocalPosition,
    updateFMSubsystem,
    updateFMLayer,
    createSubsystem,
    updateSubsystemInfo,
    validateDependency,
    destroy,
  };
}
