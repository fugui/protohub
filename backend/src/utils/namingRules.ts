/**
 * 命名规范检查器
 */

import type { Violation, RuleType, ViolationSeverity } from 'protohub-shared';

/**
 * 文件名格式检查
 * 规范：{子系统}_{模块}_{版本}.proto
 */
const FILENAME_PATTERN = /^[a-z0-9]+_[a-z0-9]+_[0-9]+\.[a-z]+$/;

/**
 * 包名格式检查
 * 规范：{子系统}.{模块}
 */
const PACKAGE_NAME_PATTERN = /^[a-z0-9]+\.[a-z0-9]+$/;

/**
 * 消息名检查（PascalCase）
 */
const MESSAGE_NAME_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;

/**
 * 字段名检查（snake_case）
 */
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * 服务名检查（PascalCase + Service）
 */
const SERVICE_NAME_PATTERN = /^[A-Z][a-zA-Z0-9]*Service$/;

/**
 * 提取文件名
 */
function extractFilename(content: string): string | null {
  const match = content.match(/filename\s*=\s*"([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * 提取包名
 */
function extractPackageName(content: string): string | null {
  const match = content.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
  return match ? match[1] : null;
}

/**
 * 提取所有消息名
 */
function extractMessageNames(content: string): string[] {
  const names: string[] = [];
  const regex = /message\s+([A-Za-z0-9_]+)\s*\{/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/**
 * 提取所有字段名
 */
function extractFieldNames(content: string): string[] {
  const names: string[] = [];
  const regex = /(\w+)\s*=\s*(\d+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/**
 * 提取所有服务名
 */
function extractServiceNames(content: string): string[] {
  const names: string[] = [];
  const regex = /service\s+([A-Za-z0-9_]+)\s*\{/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/**
 * 生成违规项
 */
function createViolation(
  ruleType: RuleType,
  severity: ViolationSeverity,
  line: number,
  message: string,
  suggestion?: string
): Violation {
  return {
    id: 0, // 临时 ID
    ruleType,
    severity,
    fileLine: line,
    violationMessage: message,
    suggestion: suggestion,
  };
}

/**
 * 检查文件名
 */
export function checkFilename(content: string): Violation[] {
  const violations: Violation[] = [];
  const filename = extractFilename(content);

  if (!filename) {
    return violations;
  }

  if (!FILENAME_PATTERN.test(filename)) {
    violations.push(
      createViolation(
        'naming_file',
        'error',
        0,
        `文件名 "${filename}" 不符合命名规范`,
        '文件名格式应为：{子系统}_{模块}_{版本}.proto，例如：user_service_model_v1.proto'
      )
    );
  }

  return violations;
}

/**
 * 检查包名
 */
export function checkPackageName(content: string): Violation[] {
  const violations: Violation[] = [];
  const packageName = extractPackageName(content);

  if (!packageName) {
    return violations;
  }

  if (!PACKAGE_NAME_PATTERN.test(packageName)) {
    violations.push(
      createViolation(
        'naming_package',
        'error',
        0,
        `包名 "${packageName}" 不符合命名规范`,
        '包名格式应为：{子系统}.{模块}，例如：user_service.model'
      )
    );
  }

  return violations;
}

/**
 * 检查消息名
 */
export function checkMessageNames(content: string): Violation[] {
  const violations: Violation[] = [];
  const names = extractMessageNames(content);
  const lines = content.split('\n');

  names.forEach((name) => {
    if (!MESSAGE_NAME_PATTERN.test(name)) {
      // 找到消息定义的行号
      const messageLine = lines.findIndex((line) => line.includes(`message ${name}`));
      violations.push(
        createViolation(
          'naming_message',
          'error',
          messageLine + 1,
          `消息名 "${name}" 不符合 PascalCase 规范`,
          '消息名应使用大驼峰命名，例如：UserInfo'
        )
      );
    }
  });

  return violations;
}

/**
 * 检查字段名
 */
export function checkFieldNames(content: string): Violation[] {
  const violations: Violation[] = [];
  const names = extractFieldNames(content);
  const lines = content.split('\n');

  names.forEach((name) => {
    if (!FIELD_NAME_PATTERN.test(name)) {
      const fieldLine = lines.findIndex((line) => line.includes(name) && line.includes('='));
      violations.push(
        createViolation(
          'naming_field',
          'error',
          fieldLine + 1,
          `字段名 "${name}" 不符合 snake_case 规范`,
          '字段名应使用小写+下划线命名，例如：user_id'
        )
      );
    }
  });

  return violations;
}

/**
 * 检查服务名
 */
export function checkServiceNames(content: string): Violation[] {
  const violations: Violation[] = [];
  const names = extractServiceNames(content);
  const lines = content.split('\n');

  names.forEach((name) => {
    if (!SERVICE_NAME_PATTERN.test(name)) {
      const serviceLine = lines.findIndex((line) => line.includes(`service ${name}`));
      violations.push(
        createViolation(
          'naming_service',
          'warning',
          serviceLine + 1,
          `服务名 "${name}" 不符合命名规范`,
          '服务名应以 PascalCase + Service 结尾，例如：UserService'
        )
      );
    }
  });

  return violations;
}
