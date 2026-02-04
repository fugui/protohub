/**
 * 子系统路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { getSubsystems, createSubsystem } from '../controllers/subsystem.controller';

const router = Router();

/**
 * GET /api/v1/subsystems
 * 获取子系统列表
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await getSubsystems();
    res.json(result);
  })
);

/**
 * POST /api/v1/subsystems
 * 创建子系统
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createSubsystem(req.body);
    res.status(201).json(result);
  })
);

export { router as subsystemRoutes };
