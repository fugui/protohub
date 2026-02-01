/**
 * 认证路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { login, register } from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/v1/auth/login
 * 用户登录
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await login(req.body);
    res.json(result);
  })
);

/**
 * POST /api/v1/auth/register
 * 用户注册
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await register(req.body);
    res.status(201).json(result);
  })
);

export { router as authRoutes };
