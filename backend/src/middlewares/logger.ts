/**
 * 日志中间件
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * 日志级别
 */
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 格式化日志消息
 */
function formatLog(level: LogLevel, req: Request, additionalInfo?: string): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.socket.remoteAddress || '-';
  const userAgent = req.get('user-agent') || '-';
  const userId = (req.user as any)?.userId || '-';

  let message = `[${timestamp}] [${level}] ${method} ${url}`;
  message += ` | IP: ${ip}`;
  message += ` | User: ${userId}`;
  message += ` | UA: ${userAgent}`;

  if (additionalInfo) {
    message += ` | ${additionalInfo}`;
  }

  return message;
}

/**
 * 记录信息日志
 */
function logInfo(req: Request, additionalInfo?: string): void {
  console.log(formatLog(LogLevel.INFO, req, additionalInfo));
}

/**
 * 记录警告日志
 */
function logWarn(req: Request, additionalInfo?: string): void {
  console.warn(formatLog(LogLevel.WARN, req, additionalInfo));
}

/**
 * 记录错误日志
 */
function logError(req: Request, additionalInfo?: string): void {
  console.error(formatLog(LogLevel.ERROR, req, additionalInfo));
}

/**
 * 请求日志中间件
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // 记录请求开始
  logInfo(req);

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    let logLevel = LogLevel.INFO;
    let additionalInfo = `Status: ${statusCode} | Duration: ${duration}ms`;

    // 根据状态码调整日志级别
    if (statusCode >= 500) {
      logLevel = LogLevel.ERROR;
    } else if (statusCode >= 400) {
      logLevel = LogLevel.WARN;
    }

    // 记录响应
    const logFn = logLevel === LogLevel.ERROR ? logError : logLevel === LogLevel.WARN ? logWarn : logInfo;
    logFn(req, additionalInfo);
  });

  next();
}

/**
 * 记录关键操作
 */
export function logOperation(operation: string, userId?: number, details?: any): void {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [INFO] Operation: ${operation}`;
  const userInfo = userId ? ` | User: ${userId}` : '';
  const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : '';

  console.log(`${message}${userInfo}${detailsStr}`);
}
