import type { Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * 404 Not Found 错误类
 */
export class NotFoundError extends Error {
  public readonly statusCode: number = 404;

  constructor(message: string) {
    super(message);
    this.name = 'NotFound';
  }
}

/**
 * Not Found 处理中间件
 * 处理 404 错误
 */
export function notFoundHandler(req: Request, res: Response, _: NextFunction): void {
  logger.warn(`Resource not found: ${(req as any).method} ${(req as any).path}`);
  res.status(404).json({
    error: '资源不存在',
    timestamp: new Date().toISOString()
  });
}
