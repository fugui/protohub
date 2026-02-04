/**
 * API 相关类型定义
 * 前后端共享，确保类型一致性
 */

/**
 * 用户角色枚举
 */
export type UserRole = 'developer' | 'reviewer' | 'admin';

/**
 * 文件状态枚举
 */
export type FileStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

/**
 * 审核状态枚举
 */
export type ReviewStatus = 'pending_review' | 'approved' | 'rejected';

/**
 * 违规严重程度枚举
 */
export type ViolationSeverity = 'error' | 'warning' | 'info';

/**
 * 规则类型枚举
 */
export type RuleType =
  | 'naming_file'
  | 'naming_package'
  | 'naming_message'
  | 'naming_field'
  | 'naming_service'
  | 'vocabulary'
  | 'common_interface';

/**
 * 用户信息
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Proto 文件基本信息
 */
export interface ProtoFile {
  id: number;
  filename: string;
  packageName: string;
  subsystem?: Subsystem | number | null | undefined;
  status: FileStatus;
  currentVersion: number;
  createdBy: User | undefined;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
  lockedBy?: User | null;
  lockedAt?: string | null;
  gitRepo?: GitRepo | null;
}

/**
 * Proto 文件详情（包含内容）
 */
export interface ProtoFileDetail extends ProtoFile {
  content: string;
}

/**
 * 文件版本
 */
export interface FileVersion {
  id: number;
  version: number;
  filePath: string;
  changeNote?: string;
  modifiedBy: User;
  modifiedAt: string;
}

/**
 * 审核记录
 */
export interface Review {
  id: number;
  file: ProtoFile;
  fileVersion?: FileVersion;
  submittedBy: User | null;
  submittedAt: string;
  reviewedBy?: User | null;
  reviewedAt?: string | null;
  status: ReviewStatus;
  reviewComment?: string | null;
}

/**
 * 违规项
 */
export interface Violation {
  id: number;
  ruleType: RuleType;
  severity: ViolationSeverity;
  fileLine?: number;
  violationMessage: string;
  suggestion?: string;
}

/**
 * 检查报告
 */
export interface CheckReport {
  id: number;
  file: ProtoFile;
  checkedAt: string;
  violations: Violation[];
  passed: boolean;
}

/**
 * 依赖节点
 */
export interface DependencyNode {
  id: string;
  label: string;
  type: 'subsystem' | 'file';
  category?: string | null;
}

/**
 * 依赖边
 */
export interface DependencyEdge {
  source: string;
  target: string;
  type: 'import';
}

/**
 * Git 仓库配置
 */
export interface GitRepo {
  id: number;
  userId: number;
  name: string;
  repoUrl: string;
  branch: string;
  username?: string | null;
  password?: string | null;
  sshKey?: string | null;
  lastSyncAt?: string | null;
  createdAt: string;
}

/**
 * 子系统
 */
export interface Subsystem {
  id: number;
  name: string;
  description?: string;
  owner?: string;
  createdAt: string;
}

/**
 * 词汇术语
 */
export interface VocabularyTerm {
  id: number;
  term: string;
  description?: string;
  category?: string;
  createdAt: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * API 错误响应
 */
export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * 创建文件请求
 */
export interface CreateFileRequest {
  subsystemId: number;
  file: File;
}

/**
 * 更新文件请求
 */
export interface UpdateFileRequest {
  content: string;
  changeNote?: string;
}

/**
 * 提交审核响应
 */
export interface SubmitReviewResponse {
  review: Review;
}

/**
 * 依赖关系图响应
 */
export interface DependencyGraphResponse {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  circularDependencies: string[][];
}

/**
 * 影响分析响应
 */
export interface ImpactAnalysisResponse {
  affectedSubsystems: string[];
  affectedFiles: number;
  dependencyChain: string[];
}

/**
 * Git 导入响应
 */
export interface GitImportResponse {
  importedCount: number;
  files: ProtoFile[];
  errors: Array<{
    file: string;
    error: string;
  }>;
}

/**
 * 一致性检查响应
 */
export interface ConsistencyCheckResponse {
  consistent: boolean;
  differences: Array<{
    file: string;
    type: 'added' | 'modified' | 'deleted';
    details: string;
  }>;
}
