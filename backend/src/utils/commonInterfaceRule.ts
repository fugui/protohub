/**
 * 公共接口抽取器
 */

import type { Violation, ViolationSeverity } from 'protohub-shared';

/**
 * 消息定义接口
 */
interface MessageDefinition {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    number: number;
  }>;
  startLine: number;
}

/**
 * 提取消息定义
 */
function extractMessageDefinitions(content: string): MessageDefinition[] {
  const messages: MessageDefinition[] = [];
  const lines = content.split('\n');
  let currentMessage: MessageDefinition | null = null;

  lines.forEach((line, index) => {
    // 匹配消息开始
    const messageMatch = line.match(/^\s*message\s+([A-Za-z0-9_]+)\s*\{/);
    if (messageMatch) {
      currentMessage = {
        name: messageMatch[1],
        fields: [],
        startLine: index,
      };
    }
    // 匹配字段定义
    else if (currentMessage) {
      const fieldMatch = line.match(/^\s*(\w+)\s+(\d+)\s*\[/);
      if (fieldMatch) {
        currentMessage.fields.push({
          name: fieldMatch[1],
          type: 'unknown', // 需要从 context 推断
          number: parseInt(fieldMatch[2], 10),
        });
      }
      // 匹配消息结束
      else if (line.trim() === '}' && currentMessage) {
        messages.push(currentMessage);
        currentMessage = null;
      }
    }
  });

  return messages;
}

/**
 * 计算两个消息的字段相似度
 */
function calculateFieldSimilarity(
  fields1: Array<{ name: string; type: string }>,
  fields2: Array<{ name: string; type: string }>
): number {
  let matchCount = 0;
  let totalCount = Math.max(fields1.length, fields2.length);

  // 比较字段名和类型
  for (const f1 of fields1) {
    for (const f2 of fields2) {
      if (
        f1.name.toLowerCase() === f2.name.toLowerCase() ||
        f1.type.toLowerCase() === f2.type.toLowerCase()
      ) {
        matchCount++;
      }
    }
  }

  return totalCount > 0 ? matchCount / totalCount : 0;
}

/**
 * 生成违规项
 */
function createViolation(
  messageName1: string,
  messageName2: string,
  line: number,
  suggestion: string
): Violation {
  return {
    id: 0,
    ruleType: 'common_interface',
    severity: 'info',
    fileLine: line,
    violationMessage: `消息 ${messageName1} 与 ${messageName2} 可能是重复定义`,
    suggestion,
  };
}

/**
 * 检查重复消息定义
 */
export function checkCommonInterfaces(
  content: string,
  similarityThreshold: number = 0.8
): Violation[] {
  const violations: Violation[] = [];
  const messages = extractMessageDefinitions(content);

  // 比较所有消息对
  for (let i = 0; i < messages.length; i++) {
    for (let j = i + 1; j < messages.length; j++) {
      const msg1 = messages[i];
      const msg2 = messages[j];

      // 跳过字段数太少的消息（小于3个字段）
      if (msg1.fields.length < 3 || msg2.fields.length < 3) {
        continue;
      }

      // 检查字段相似度
      const similarity = calculateFieldSimilarity(
        msg1.fields.map((f) => ({ name: f.name, type: f.type })),
        msg2.fields.map((f) => ({ name: f.name, type: f.type }))
      );

      // 如果相似度超过阈值，则认为可能需要抽取
      if (similarity >= similarityThreshold) {
        violations.push(
          createViolation(
            msg1.name,
            msg2.name,
            msg1.startLine,
            `建议：考虑将 ${msg1.name} 和 ${msg2.name} 合并为公共接口类型，字段相似度: ${(similarity * 100).toFixed(1)}%`
          )
        );
      }
    }
  }

  return violations;
}
