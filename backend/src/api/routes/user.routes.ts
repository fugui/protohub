/**
 * 用户管理路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { requireRole } from '../../middlewares/auth';
import { getUsers, getUserById } from '../controllers/user.controller';

const router = Router();

/**
 * GET /api/v1/users
 * 获取用户列表
 */
router.get(
  '/',
  requireRole('admin', 'reviewer'),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getUsers({ page, pageSize });
    res.json(result);
  })
);

/**
 * GET /api/v1/users/:userId
 * 获取用户详情
 */
router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const result = await getUserById(userId);
    res.json(result);
  })
);

export { router as userRoutes };
