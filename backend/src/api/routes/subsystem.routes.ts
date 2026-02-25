/**
 * 功能模块路由（原 "子系统"）
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import {
  getFunctionModulesController,
  getFunctionModuleByIdController,
  createFunctionModuleController
} from '../controllers/subsystem.controller';

const router = Router();

/**
 * GET /api/v1/subsystems
 * 获取功能模块列表
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await getFunctionModulesController();
    res.json(result);
  })
);

/**
 * GET /api/v1/subsystems/:id
 * 根据ID获取功能模块
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await getFunctionModuleByIdController(id);
    if (!result) {
      res.status(404).json({ error: '功能模块不存在' });
      return;
    }
    res.json(result);
  })
);

/**
 * POST /api/v1/subsystems
 * 创建功能模块
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createFunctionModuleController(req.body);
    res.status(201).json(result);
  })
);

export { router as functionModuleRoutes };
