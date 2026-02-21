/**
 * Proto 文件解析工具
 */

import type { ProtoParseResult, ProtoMessage, ProtoEnum, ProtoService } from 'protohub-shared';

/**
 * 解析 Proto 文件
 */
export function parseProtoFile(content: string): ProtoParseResult {
  const result: ProtoParseResult = {
    syntax: '',
    packageName: '',
    messages: [],
    enums: [],
    services: [],
    imports: [],
  };

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 跳过空行和注释
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      i++;
      continue;
    }

    // 解析 syntax
    if (line.startsWith('syntax')) {
      const syntaxMatch = line.match(/syntax\s*=\s*"([^"]+)"/);
      if (syntaxMatch) {
        result.syntax = syntaxMatch[1];
      }
      i++;
      continue;
    }

    // 解析 package
    if (line.startsWith('package')) {
      const packageMatch = line.match(/package\s+([a-zA-Z0-9_.]+)/);
      if (packageMatch) {
        result.packageName = packageMatch[1].replace(/;$/, '');
      }
      i++;
      continue;
    }

    // 解析 import
    if (line.startsWith('import')) {
      const importMatch = line.match(/import\s+["']([^"']+)["']/);
      if (importMatch) {
        result.imports.push(importMatch[1]);
      }
      i++;
      continue;
    }

    // 解析 message
    if (line.startsWith('message')) {
      const messageMatch = line.match(/message\s+([a-zA-Z0-9_]+)/);
      if (messageMatch) {
        const { message, nextIndex } = parseMessageDefinition(messageMatch[1], lines, i);
        result.messages.push(message);
        i = nextIndex;
        continue;
      }
    }

    // 解析 enum
    if (line.startsWith('enum')) {
      const enumMatch = line.match(/enum\s+([a-zA-Z0-9_]+)/);
      if (enumMatch) {
        const { enumDef, nextIndex } = parseEnumDefinition(enumMatch[1], lines, i);
        result.enums.push(enumDef);
        i = nextIndex;
        continue;
      }
    }

    // 解析 service
    if (line.startsWith('service')) {
      const serviceMatch = line.match(/service\s+([a-zA-Z0-9_]+)/);
      if (serviceMatch) {
        const { service, nextIndex } = parseServiceDefinition(serviceMatch[1], lines, i);
        result.services.push(service);
        i = nextIndex;
        continue;
      }
    }

    i++;
  }

  return result;
}

/**
 * 解析消息定义
 */
function parseMessageDefinition(name: string, lines: string[], startIndex: number): { message: ProtoMessage; nextIndex: number } {
  const message: ProtoMessage = {
    name,
    fields: [],
  };

  let i = startIndex;
  let braceCount = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 跳过空行和注释
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      i++;
      continue;
    }

    // 检查当前行是否包含 { (起始大括号可能在同一行)
    if (line.includes('{')) {
      braceCount++;
      // 如果在同一行，跳到下一行
      if (line === '{' || line.endsWith('{')) {
        i++;
        continue;
      }
    }

    // 查找结束大括号
    if (line === '}' || (line.includes('}') && braceCount > 0)) {
      braceCount--;
      if (braceCount === 0) {
        return { message, nextIndex: i + 1 };
      }
      i++;
      continue;
    }

    // 在消息体中，解析字段或嵌套类型
    if (braceCount > 0) {
      // 解析嵌套消息
      if (line.startsWith('message')) {
        const nestedMatch = line.match(/message\s+([a-zA-Z0-9_]+)/);
        if (nestedMatch) {
          const { message: nestedMessage, nextIndex } = parseMessageDefinition(nestedMatch[1], lines, i);
          // 将嵌套消息作为字段添加
          message.fields.push({
            name: nestedMessage.name,
            type: 'message',
            nestedType: 'message',
            messageDef: nestedMessage,
          });
          i = nextIndex;
          continue;
        }
      }

      // 解析字段: [optional|repeated] type name = number;
      const fieldMatch = line.match(/^(optional|repeated)?\s*([a-zA-Z0-9_.]+)\s+([a-zA-Z0-9_]+)\s*=\s*(\d+)(?:\s*\[\s*default\s*=\s*([^\]]+)\s*\])?;/);
      if (fieldMatch) {
        message.fields.push({
          name: fieldMatch[3],
          type: fieldMatch[2],
          number: parseInt(fieldMatch[4], 10),
          repeated: fieldMatch[1] === 'repeated',
          optional: fieldMatch[1] === 'optional',
          defaultValue: fieldMatch[5],
        });
      }
    }

    i++;
  }

  return { message, nextIndex: i };
}

/**
 * 解析枚举定义
 */
function parseEnumDefinition(name: string, lines: string[], startIndex: number): { enumDef: ProtoEnum; nextIndex: number } {
  const enumDef: ProtoEnum = {
    name,
    values: [],
  };

  let i = startIndex;
  let braceCount = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 跳过空行和注释
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      i++;
      continue;
    }

    // 检查当前行是否包含 { (起始大括号可能在同一行)
    if (line.includes('{')) {
      braceCount++;
      // 如果在同一行，跳到下一行
      if (line === '{' || line.endsWith('{')) {
        i++;
        continue;
      }
    }

    // 查找结束大括号
    if (line === '}' || (line.includes('}') && braceCount > 0)) {
      braceCount--;
      if (braceCount === 0) {
        return { enumDef, nextIndex: i + 1 };
      }
      i++;
      continue;
    }

    // 在枚举体中，解析枚举值: NAME = number;
    if (braceCount > 0) {
      const valueMatch = line.match(/^([A-Z0-9_]+)\s*=\s*(-?\d+);/);
      if (valueMatch) {
        enumDef.values.push({
          name: valueMatch[1],
          value: parseInt(valueMatch[2], 10),
        });
      }
    }

    i++;
  }

  return { enumDef, nextIndex: i };
}

/**
 * 解析服务定义
 */
function parseServiceDefinition(name: string, lines: string[], startIndex: number): { service: ProtoService; nextIndex: number } {
  const service: ProtoService = {
    name,
    methods: [],
  };

  let i = startIndex;
  let braceCount = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 跳过空行和注释
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      i++;
      continue;
    }

    // 检查当前行是否包含 { (起始大括号可能在同一行)
    if (line.includes('{')) {
      braceCount++;
      // 如果在同一行，跳到下一行
      if (line === '{' || line.endsWith('{')) {
        i++;
        continue;
      }
    }

    // 查找结束大括号
    if (line === '}' || (line.includes('}') && braceCount > 0)) {
      braceCount--;
      if (braceCount === 0) {
        return { service, nextIndex: i + 1 };
      }
      i++;
      continue;
    }

    // 在服务体中，解析rpc方法
    if (braceCount > 0 && line.startsWith('rpc')) {
      const rpcMatch = line.match(/rpc\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*returns\s*\(\s*([a-zA-Z0-9_]+)\s*\);/);
      if (rpcMatch) {
        service.methods.push({
          name: rpcMatch[1],
          requestType: rpcMatch[2],
          responseType: rpcMatch[3],
        });
      }
    }

    i++;
  }

  return { service, nextIndex: i };
}

/**
 * 提取 Proto 文件中的依赖包名
 */
export function extractDependencies(content: string): string[] {
  const deps: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // 解析 import 语句
    if (trimmed.startsWith('import')) {
      const importMatch = trimmed.match(/import\s+["']([^"']+)["']/);
      if (importMatch) {
        // 从 import 路径中提取包名
        // 例如: "common/types.proto" -> "common.types"
        const importPath = importMatch[1];
        const parts = importPath.split('/');
        const fileName = parts[parts.length - 1];
        // 去掉 .proto 扩展名
        const packageName = fileName.replace(/\.proto$/, '');
        // 替换路径分隔符为点
        const fullPackageName = parts.slice(0, parts.length - 1).concat([packageName]).join('.');

        // 验证包名格式
        if (/^[a-zA-Z0-9_.]+$/.test(fullPackageName)) {
          deps.push(fullPackageName);
        }
      }
    }
  }

  return deps;
}
