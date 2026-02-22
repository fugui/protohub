/**
 * 架构图 API 路由
 */

import { Router } from 'express';
import * as architectureController from '../controllers/architecture.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth';

const router = Router();

// 所有路由需要认证
router.use(authMiddleware);

// 获取架构图数据
router.get('/graph', architectureController.getArchitectureGraph);

// 层级管理
router.get('/layers', architectureController.getLayers);

// 分组管理
router.get('/groups', architectureController.getGroups);
router.post('/groups', requireRole('admin'), architectureController.createGroup);
router.put('/groups/:id/position', requireRole('admin'), architectureController.updateGroupPosition);
router.put('/groups/:id/collapsed', requireRole('admin'), architectureController.toggleGroupCollapsed);
router.put('/groups/:id', requireRole('admin'), architectureController.updateGroupInfo);
router.delete('/groups/:id', requireRole('admin'), architectureController.deleteGroup);

// 分组成员管理
router.post('/groups/:id/members', requireRole('admin'), architectureController.addToGroup);
router.delete('/groups/:id/members', requireRole('admin'), architectureController.removeFromGroup);

// 节点位置管理
router.post('/node-positions', requireRole('admin'), architectureController.saveNodePositions);

// 依赖验证
router.post('/validate-dependency', architectureController.validateDependency);

// 快照管理
router.get('/snapshots', architectureController.getSnapshots);
router.post('/snapshots', requireRole('admin'), architectureController.saveSnapshot);
router.get('/snapshots/default', architectureController.getDefaultSnapshot);
router.get('/snapshots/:id', architectureController.loadSnapshot);
router.put('/snapshots/:id/default', requireRole('admin'), architectureController.setDefaultSnapshot);

// 子系统层级管理
router.put('/subsystems/:id/layer', requireRole('admin'), architectureController.updateSubsystemLayer);
router.put('/subsystems/:id/group', requireRole('admin'), architectureController.updateSubsystemGroup);

export default router;
