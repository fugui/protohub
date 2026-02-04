/**
 * 错误处理中间件
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

/**
 * 未找到错误
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404);
  }
}

/**
 * 未授权错误
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权') {
    super(message, 401);
  }
}

/**
 * 权限不足错误
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403);
  }
}

/**
 * 冲突错误
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error | AppError,
  _: Request,
  res: Response,
  __: NextFunction
): void {
  // 记录错误日志
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // 处理 AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.isOperational ? {} : { stack: process.env.NODE_ENV === 'development' ? err.stack : undefined }),
    });
    return;
  }

  // 处理其他错误
  const statusCode = 500;
  const message = '服务器内部错误';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `路径 ${req.method} ${req.path} 不存在` });
}

/**
 * 异步路由处理包装函数
 * 用于捕获异步路由中的错误
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
