import { logger } from './logger';
import type { Response, NextFunction } from 'express';

/**
 * 请求验证类
 */
export class ValidationError extends Error {
  public readonly statusCode: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 请求验证中间件
 */
export function validateRequest(req: any, res: Response, next: NextFunction): void {
  const errors: string[] = [];

  // 验证请求体
  if (!req.body || Object.keys(req.body).length === 0) {
    errors.push('请求体不能为空');
  }

  // 可以在这里添加更多验证规则...

  if (errors.length > 0) {
    logger.warn(`请求验证失败: ${errors.join(', ')}`);
    res.status(400).json({
      error: '请求参数无效',
      errors
    });
    return;
  }

  next();
}
