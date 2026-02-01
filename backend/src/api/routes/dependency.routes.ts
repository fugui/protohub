/**
 * 依赖关系 API 路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { getDependencyGraph, getImpactAnalysis } from '../controllers/dependency.controller';

const router = Router();

/**
 * GET /api/v1/dependencies/graph
 * 获取依赖关系图
 */
router.get(
  '/graph',
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      fileId: req.query.fileId ? parseInt(req.query.fileId as string) : undefined,
      subsystemId: req.query.subsystemId ? parseInt(req.query.subsystemId as string) : undefined,
    };
    const result = await getDependencyGraph(params);
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
