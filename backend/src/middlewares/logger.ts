/**
 * 日志中间件
 */

import type { Request, Response, NextFunction } from 'express';
import winston from 'winston';

/**
 * Winston logger 实例
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'isoDateTime' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json()
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json()
    })
  ]
});

/**
 * 请求日志中间件
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // 记录请求开始
  logger.info(`Request: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req.user as any)?.userId
  });

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    let logLevel: 'info' | 'warn' | 'error' = 'info';

    // 根据状态码调整日志级别
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    logger[logLevel](`Response: ${req.method} ${req.url}`, {
      status: statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

/**
 * 记录关键操作
 */
export function logOperation(operation: string, userId?: number, details?: any): void {
  logger.info(`Operation: ${operation}`, {
    userId,
    details
  });
}
