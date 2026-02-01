/**
 * Proto 文件解析工具
 */

import type { ProtoParseResult, ProtoMessage, ProtoEnum, ProtoService } from 'protohub-shared';

/**
 * 解析 Proto 文件
 */
export function parseProtoFile(content: string): ProtoParseResult {
  const result: ProtoParseResult = {
    packageName: '',
    messages: [],
    enums: [],
    services: [],
    imports: [],
  };

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 解析 package
    const packageMatch = trimmedLine.match(/^package\s+([a-zA-Z0-9_.]+)\s*;/);
    if (packageMatch) {
      result.packageName = packageMatch[1];
    }

    // 解析 import
    const importMatch = trimmedLine.match(/^import\s+(["'])(.*?)\1/);
    if (importMatch) {
      result.imports.push(importMatch[2]);
    }

    // 解析 message
    const messageMatch = trimmedLine.match(/^message\s+([A-Za-z0-9_]+)/);
    if (messageMatch) {
      result.messages.push({
        name: messageMatch[1],
        fields: [],
      });
    }

    // 解析 message 字段
    const fieldMatch = trimmedLine.match(/(optional|repeated)?\s+([a-zA-Z0-9_]+)\s+([a-z0-9_]+)\s*=\s*(\d+)/);
    if (fieldMatch && result.messages.length > 0) {
      const currentMessage = result.messages[result.messages.length - 1];
      currentMessage.fields.push({
        type: fieldMatch[2],
        name: fieldMatch[3],
        number: parseInt(fieldMatch[4], 10),
        repeated: fieldMatch[1] === 'repeated',
        optional: fieldMatch[1] === 'optional',
      });
    }

    // 解析 enum
    const enumMatch = trimmedLine.match(/^enum\s+([A-Za-z0-9_]+)/);
    if (enumMatch) {
      result.enums.push({
        name: enumMatch[1],
        values: [],
      });
    }

    // 解析 enum 值
    const enumValueMatch = trimmedLine.match(/([A-Z0-9_]+)\s*=\s*(\d+)/);
    if (enumValueMatch && result.enums.length > 0 && trimmedLine.includes('=')) {
      const currentEnum = result.enums[result.enums.length - 1];
      currentEnum.values.push({
        name: enumValueMatch[1],
        number: parseInt(enumValueMatch[2], 10),
      });
    }

    // 解析 service
    const serviceMatch = trimmedLine.match(/^service\s+([A-Za-z0-9_]+)/);
    if (serviceMatch) {
      result.services.push({
        name: serviceMatch[1],
        methods: [],
      });
    }

    // 解析 rpc 方法
    const rpcMatch = trimmedLine.match(/^rpc\s+([A-Za-z0-9_]+)\s*\(\s*([A-Za-z0-9_]+)\s*\)\s*returns\s*\(\s*([A-Za-z0-9_]+)\s*\)/);
    if (rpcMatch && result.services.length > 0) {
      const currentService = result.services[result.services.length - 1];
      currentService.methods.push({
        name: rpcMatch[1],
        requestType: rpcMatch[2],
        responseType: rpcMatch[3],
        clientStreaming: trimmedLine.includes('stream'),
        serverStreaming: trimmedLine.includes('stream'),
      });
    }
  }

  return result;
}

/**
 * 提取 import 依赖
 */
export function extractDependencies(content: string): string[] {
  const parsed = parseProtoFile(content);
  return parsed.imports;
}

/**
 * 验证 Proto 文件语法
 */
export function validateProtoFile(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const parsed = parseProtoFile(content);

  // 检查 package 声明
  if (!parsed.packageName) {
    errors.push('缺少 package 声明');
  }

  // 检查 message 命名规范（PascalCase）
  const messagePattern = /^[A-Z][a-zA-Z0-9]*$/;
  for (const msg of parsed.messages) {
    if (!messagePattern.test(msg.name)) {
      errors.push(`消息名 "${msg.name}" 不符合 PascalCase 规范`);
    }
  }

  // 检查字段命名规范（snake_case）
  const fieldPattern = /^[a-z][a-z0-9_]*$/;
  for (const msg of parsed.messages) {
    for (const field of msg.fields) {
      if (!fieldPattern.test(field.name)) {
        errors.push(`字段名 "${msg.name}.${field.name}" 不符合 snake_case 规范`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
