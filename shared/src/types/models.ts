/**
 * 数据模型类型定义
 * 用于数据库 ORM 层
 */

import type {
  UserRole,
  FileStatus,
  ReviewStatus,
  ViolationSeverity,
  RuleType,
} from './api';

/**
 * 数据库表: users
 */
export interface UserEntity {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * 数据库表: git_repos
 */
export interface GitRepoEntity {
  id: number;
  user_id: number;
  name: string;
  repo_url: string;
  branch: string;
  username?: string | null;
  password?: string | null;
  ssh_key?: string | null;
  last_sync_at?: string | null;
  created_at: string;
}

/**
 * 数据库表: proto_files
 */
export interface ProtoFileEntity {
  id: number;
  filename: string;
  file_path: string;
  package_name: string;
  function_module_id?: number | null;
  git_repo_id?: number | null;
  git_file_path?: string | null;
  status: FileStatus;
  current_version: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  locked: number; // SQLite 不支持 boolean，使用 0/1
  locked_by?: number | null;
  locked_at?: string | null;
}

/**
 * 数据库表: file_versions
 */
export interface FileVersionEntity {
  id: number;
  file_id: number;
  version: number;
  content: string;
  file_path: string;
  change_note?: string | null;
  modified_by: number;
  modified_at: string;
}

/**
 * 数据库表: reviews
 */
export interface ReviewEntity {
  id: number;
  file_id: number;
  file_version_id?: number | null;
  submitted_by: number;
  submitted_at: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  status: ReviewStatus;
  review_comment?: string | null;
}

/**
 * 数据库表: check_reports
 */
export interface CheckReportEntity {
  id: number;
  file_id: number;
  file_version_id?: number | null;
  checked_at: string;
}

/**
 * 数据库表: violations
 */
export interface ViolationEntity {
  id: number;
  report_id: number;
  rule_type: RuleType;
  severity: ViolationSeverity;
  file_line?: number | null;
  violation_message: string;
  suggestion?: string | null;
}

/**
 * 数据库表: dependencies
 */
export interface DependencyEntity {
  id: number;
  source_file_id?: number | null; // 可为空，表示功能模块级依赖
  source_function_module_id?: number | null; // 对应的功能模块ID
  target_file_id: number;
  dependency_type: string;
  created_at: string;
}

/**
 * 数据库表: function_modules (功能模块，原子系统)
 */
export interface FunctionModuleEntity {
  id: number;
  name: string;
  description?: string | null;
  owner?: string | null;
  layer_level?: number | null;  // 所属架构层级
  created_at: string;
}

/**
 * 数据库表: subsystems (子系统，原分组)
 */
export interface SubsystemEntity {
  id: number;
  name: string;
  layer_id?: number | null;
  parent_subsystem_id?: number | null;
  color?: string | null;
  columns: number;
  position_x?: number | null;
  position_y?: number | null;
  width: number;
  height: number;
  collapsed: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 数据库表: vocabulary_terms
 */
export interface VocabularyTermEntity {
  id: number;
  term: string;
  description?: string | null;
  description_en?: string | null;
  aliases?: string | null; // JSON array
  similar_terms?: string | null; // JSON array
  domain?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Proto 文件解析结果
 */
export interface ProtoParseResult {
  syntax: string;
  packageName: string;
  messages: ProtoMessage[];
  enums: ProtoEnum[];
  services: ProtoService[];
  imports: string[];
}

/**
 * Proto 消息定义
 */
export interface ProtoMessage {
  name: string;
  fields: ProtoField[];
}

/**
 * Proto 字段定义
 */
export interface ProtoField {
  name: string;
  type: string;
  number?: number;
  repeated?: boolean;
  optional?: boolean;
  defaultValue?: string;
  nestedType?: string;
  messageDef?: ProtoMessage;
}

/**
 * Proto 枚举定义
 */
export interface ProtoEnum {
  name: string;
  values: ProtoEnumValue[];
}

/**
 * Proto 枚举值
 */
export interface ProtoEnumValue {
  name: string;
  number?: number;
  value?: number;
}

/**
 * Proto 服务定义
 */
export interface ProtoService {
  name: string;
  methods: ProtoMethod[];
}

/**
 * Proto 方法定义
 */
export interface ProtoMethod {
  name: string;
  requestType: string;
  responseType: string;
  clientStreaming?: boolean;
  serverStreaming?: boolean;
}
