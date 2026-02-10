/**
 * 审核路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { requireRole } from '../../middlewares/auth';
import {
  getReviews,
  approveReview,
  rejectReview,
} from '../controllers/review.controller';

const router = Router();

/**
 * GET /api/v1/reviews
 * 获取待审核列表
 */
router.get(
  '/',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const result = await getReviews({ page, pageSize, status });
    res.json(result);
  })
);

/**
 * POST /api/v1/reviews/:reviewId/approve
 * 批准审核
 */
router.post(
  '/:reviewId/approve',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const reviewId = parseInt(req.params.reviewId);
    const { comment } = req.body;
    const result = await approveReview(reviewId, comment, req);
    res.json(result);
  })
);

/**
 * POST /api/v1/reviews/:reviewId/reject
 * 拒绝审核
 */
router.post(
  '/:reviewId/reject',
  requireRole('reviewer', 'admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const reviewId = parseInt(req.params.reviewId);
    const { comment } = req.body;
    const result = await rejectReview(reviewId, comment, req);
    res.json(result);
  })
);

export { router as reviewRoutes };
