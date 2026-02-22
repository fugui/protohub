/**
 * 架构图 API 控制器（简化版）
 */

import { Request, Response } from 'express';
import * as architectureService from '../../services/architectureService';

export function getArchitectureGraph(_req: Request, res: Response): void {
  try {
    const graph = architectureService.buildArchitectureGraph();
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: '获取架构图失败' });
  }
}

export function getLayers(_req: Request, res: Response): void {
  try {
    const layers = architectureService.getArchitectureLayers();
    res.json(layers);
  } catch (error) {
    res.status(500).json({ error: '获取层级失败' });
  }
}

export function getGroups(_req: Request, res: Response): void {
  try {
    const groups = architectureService.getSubsystemGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: '获取分组失败' });
  }
}

export function createGroup(req: Request, res: Response): void {
  try {
    const { name, layerId, parentGroupId, color, positionX, positionY, columns } = req.body;
    if (!name) {
      res.status(400).json({ error: '名称不能为空' });
      return;
    }
    const group = architectureService.createSubsystemGroup({
      name, layerId, parentGroupId, color, positionX, positionY, columns
    });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateGroupPosition(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    const { x, y } = req.body;
    architectureService.updateGroupPosition(groupId, x, y);
    res.json({ message: '更新成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateGroupInfo(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    const { columns, name, color, layerId } = req.body;
    architectureService.updateGroupInfo(groupId, { columns, name, color, layerId });
    res.json({ message: '更新成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function toggleGroupCollapsed(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    const { collapsed } = req.body;
    architectureService.toggleGroupCollapsed(groupId, collapsed);
    res.json({ message: '更新成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteGroup(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    architectureService.deleteSubsystemGroup(groupId);
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function addToGroup(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    const { subsystemId, positionX, positionY } = req.body;
    architectureService.addSubsystemToGroup(groupId, subsystemId, positionX, positionY);
    res.json({ message: '添加成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function removeFromGroup(req: Request, res: Response): void {
  try {
    const groupId = parseInt(req.params.id);
    const { subsystemId } = req.body;
    architectureService.removeSubsystemFromGroup(groupId, subsystemId);
    res.json({ message: '移除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function saveNodePositions(req: Request, res: Response): void {
  try {
    const { positions } = req.body;
    architectureService.batchSaveNodePositions(positions);
    res.json({ message: '保存成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function validateDependency(req: Request, res: Response): void {
  try {
    const { sourceId, targetId } = req.body;
    const result = architectureService.validateDependency(sourceId, targetId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function saveSnapshot(req: Request, res: Response): void {
  try {
    const { name, data, description, isDefault } = req.body;
    const userId = (req as any).user?.userId;
    const id = architectureService.saveSnapshot(name, data, description, userId, isDefault);
    res.status(201).json({ id, message: '保存成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getSnapshots(_req: Request, res: Response): void {
  try {
    const snapshots = architectureService.getSnapshots();
    res.json(snapshots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function loadSnapshot(req: Request, res: Response): void {
  try {
    const snapshotId = parseInt(req.params.id);
    const data = architectureService.loadSnapshot(snapshotId);
    if (!data) {
      res.status(404).json({ error: '快照不存在' });
      return;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function setDefaultSnapshot(req: Request, res: Response): void {
  try {
    const snapshotId = parseInt(req.params.id);
    architectureService.setDefaultSnapshot(snapshotId);
    res.json({ message: '设置成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getDefaultSnapshot(_req: Request, res: Response): void {
  try {
    const snapshot = architectureService.getDefaultSnapshot();
    if (!snapshot) {
      res.status(404).json({ error: '没有默认快照' });
      return;
    }
    res.json(snapshot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateSubsystemLayer(req: Request, res: Response): void {
  try {
    const subsystemId = parseInt(req.params.id);
    const { layerLevel } = req.body;
    const { subsystemRepository } = require('../../models/Subsystem');
    subsystemRepository.updateSubsystem(subsystemId, { layer_level: layerLevel });
    res.json({ message: '更新成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateSubsystemGroup(req: Request, res: Response): void {
  try {
    const subsystemId = parseInt(req.params.id);
    const { groupId } = req.body; // Expects null or number
    architectureService.updateSubsystemGroup(subsystemId, groupId);
    res.json({ message: '更新分组成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
