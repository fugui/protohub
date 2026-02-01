/**
 * 检查 API 路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { runCheck, getReport } from '../controllers/check.controller';

const router = Router();

/**
 * POST /api/v1/files/:fileId/check
 * 执行文件检查
 */
router.post(
  '/:fileId/check',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await runCheck(fileId);
    res.json(result);
  })
);

/**
 * GET /api/v1/checks/:reportId
 * 获取检查报告详情
 */
router.get(
  '/checks/:reportId',
  asyncHandler(async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.reportId);
    const result = await getReport(reportId);
    res.json(result);
  })
);

export { router as checkRoutes };
