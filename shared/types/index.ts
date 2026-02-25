// Shared TypeScript type definitions for ProtoHub

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'developer' | 'reviewer' | 'admin';
  createdAt: string;
}

export interface ProtoFile {
  id: number;
  filename: string;
  filePath: string;
  packageName: string;
  functionModuleId?: number;
  gitRepoId?: number;
  gitFilePath?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  currentVersion: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
  lockedBy?: number;
  lockedAt?: string;
}

export interface FileVersion {
  id: number;
  fileId: number;
  version: number;
  content: string;
  filePath: string;
  changeNote?: string;
  modifiedBy: number;
  modifiedAt: string;
}

export interface Review {
  id: number;
  fileId: number;
  fileVersionId?: number;
  submittedBy: number;
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewComment?: string;
}

export interface CheckReport {
  id: number;
  fileId: number;
  fileVersionId?: number;
  checkedAt: string;
  violations: Violation[];
  passed: boolean;
}

export interface Violation {
  id: number;
  reportId: number;
  ruleType: 'naming_file' | 'naming_package' | 'naming_message' | 'naming_field' | 'naming_service' | 'vocabulary' | 'common_interface';
  severity: 'error' | 'warning' | 'info';
  fileLine?: number;
  violationMessage: string;
  suggestion?: string;
}

export interface Dependency {
  id: number;
  sourceFileId: number;
  targetFileId: number;
  dependencyType: string;
  createdAt: string;
}

export interface FunctionModule {
  id: number;
  name: string;
  description?: string;
  owner?: string;
  createdAt: string;
}

export interface Subsystem {
  id: number;
  name: string;
  layerId?: number;
  parentSubsystemId?: number;
  color?: string;
  columns: number;
  positionX?: number;
  positionY?: number;
  width: number;
  height: number;
  collapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitRepo {
  id: number;
  userId: number;
  name: string;
  repoUrl: string;
  branch: string;
  username?: string;
  password?: string;
  sshKey?: string;
  lastSyncAt?: string;
  createdAt: string;
}

export interface VocabularyTerm {
  id: number;
  term: string;
  description?: string;
  category?: string;
  createdAt: string;
}

export interface ApiResponse<T = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse extends ApiResponse<{
  token: string;
  user: User;
}> {}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ConflictError extends ApiResponse<never> {
  error: string;
  lockedBy?: User;
  lockedAt?: string;
}
