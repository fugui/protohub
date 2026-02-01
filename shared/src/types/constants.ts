/**
 * 常量定义
 */

/**
 * 用户角色枚举值
 */
export const USER_ROLES = {
  DEVELOPER: 'developer' as const,
  REVIEWER: 'reviewer' as const,
  ADMIN: 'admin' as const,
} as const;

/**
 * 文件状态枚举值
 */
export const FILE_STATUS = {
  DRAFT: 'draft' as const,
  PENDING_REVIEW: 'pending_review' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

/**
 * 审核状态枚举值
 */
export const REVIEW_STATUS = {
  PENDING_REVIEW: 'pending_review' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

/**
 * 违规严重程度枚举值
 */
export const VIOLATION_SEVERITY = {
  ERROR: 'error' as const,
  WARNING: 'warning' as const,
  INFO: 'info' as const,
} as const;

/**
 * 规则类型枚举值
 */
export const RULE_TYPES = {
  NAMING_FILE: 'naming_file' as const,
  NAMING_PACKAGE: 'naming_package' as const,
  NAMING_MESSAGE: 'naming_message' as const,
  NAMING_FIELD: 'naming_field' as const,
  NAMING_SERVICE: 'naming_service' as const,
  VOCABULARY: 'vocabulary' as const,
  COMMON_INTERFACE: 'common_interface' as const,
} as const;

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * 文件锁超时时间（毫秒）
 */
export const FILE_LOCK_TIMEOUT = 30 * 60 * 1000; // 30 分钟

/**
 * 分页默认配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 文件大小限制（字节）
 */
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

/**
 * Git 仓库配置限制
 */
export const GIT_REPO_LIMIT_PER_USER = 5;

/**
 * 依赖关系图节点上限
 */
export const DEPENDENCY_GRAPH_MAX_NODES = 500;

/**
 * API 响应延迟（用于开发环境模拟）
 */
export const API_DELAY = 0;

/**
 * 数据库配置
 */
export const DB_CONFIG = {
  WAL_MODE: true,
  CACHE_SIZE: -10000, // 10MB
  PAGE_SIZE: 4096,
} as const;
