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
  asyncHandler(async (req: Request, res: Response) => {
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
    const userId = req.user ? (req.user as any).userId : undefined;
    const result = await createSubsystem(req.body, userId);
    res.status(201).json(result);
  })
);

export { router as subsystemRoutes };
