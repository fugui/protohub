/**
 * 依赖关系 API 路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { getDependencyGraph, getImpactAnalysis, createDependency, createSubsystemDependency, deleteDependency } from '../controllers/dependency.controller';

const router = Router();

/**
 * GET /api/v1/dependencies/graph
 * 获取依赖关系图
 */
router.get(
  '/graph',
  asyncHandler(async (req: Request, res: Response) => {
    const level = req.query.level as string;
    const result = await getDependencyGraph(level);
    res.json(result);
  })
);

/**
 * POST /api/v1/dependencies
 * 创建依赖关系
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { sourceFileId, targetFileId } = req.body;
    const result = await createDependency(sourceFileId, targetFileId);
    res.status(201).json(result);
  })
);

/**
 * POST /api/v1/dependencies/subsystem
 * 创建子系统依赖关系
 */
router.post(
  '/subsystem',
  asyncHandler(async (req: Request, res: Response) => {
    const { sourceSubsystemId, targetFileIds } = req.body;
    const result = await createSubsystemDependency(sourceSubsystemId, targetFileIds);
    res.status(201).json(result);
  })
);

/**
 * DELETE /api/v1/dependencies/:id
 * 删除依赖关系
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await deleteDependency(id);
    res.json(result);
  })
);

/**
 * GET /api/v1/files/:fileId/impact-analysis
 * 获取影响分析
 */
router.get(
  '/:fileId/impact-analysis',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await getImpactAnalysis(fileId);
    res.json(result);
  })
);

export { router as dependencyRoutes };
