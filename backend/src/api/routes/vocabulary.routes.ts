/**
 * 词汇管理 API 路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { requireRole } from '../../middlewares/auth';
import {
  getAllTerms,
  getTermsByCategory,
  createTerm,
  updateTerm,
  deleteTerm,
} from '../controllers/vocabulary.controller';

const router = Router();

/**
 * GET /api/v1/vocabulary/terms
 * 获取所有术语
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getAllTerms();
    res.json(result);
  })
);

/**
 * GET /api/v1/vocabulary/terms?category={category}
 * 根据分类获取术语
 */
router.get(
  '/terms',
  asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const result = await getTermsByCategory(category);
    res.json(result);
  })
);

/**
 * POST /api/v1/vocabulary/terms
 * 创建术语
 */
router.post(
  '/',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createTerm(req.body);
    res.status(201).json(result);
  })
);

/**
 * PUT /api/v1/vocabulary/terms/:id
 * 更新术语
 */
router.put(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await updateTerm(id, req.body);
    res.json(result);
  })
);

/**
 * DELETE /api/v1/vocabulary/terms/:id
 * 删除术语
 */
router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await deleteTerm(id);
    res.status(204).send();
  })
);

export { router as vocabularyRoutes };
