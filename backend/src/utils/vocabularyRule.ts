/**
 * 词汇规范检查器
 */

import type { Violation } from 'protohub-shared';

/**
 * 提取所有单词（包括驼峰和下划线命名）
 */
function extractWords(text: string): string[] {
  // 匹配驼峰命名：UserInfo -> [User, Info]
  const camelCaseMatches = text.match(/[A-Z][a-z]+/g) || [];
  // 匹配下划线命名：user_id -> [user, id]
  const snakeCaseMatches = text.match(/[a-z]+_[a-z]+/g) || [];

  const words = new Set<string>();

  for (const match of camelCaseMatches) {
    const word = match.slice(0, -1); // 去掉最后一个字母
    words.add(word);
  }

  for (const match of snakeCaseMatches) {
    const parts = match.split('_');
    parts.forEach((part) => words.add(part));
  }

  return Array.from(words);
}

/**
 * 生成违规项
 */
function createViolation(
  word: string,
  line: number,
  suggestion: string
): Violation {
  return {
    id: 0,
    ruleType: 'vocabulary',
    severity: 'warning',
    fileLine: line,
    violationMessage: `非标准词汇"${word}"`,
    suggestion,
  };
}

/**
 * 检查 proto 文件内容中的词汇使用
 */
export function checkVocabulary(
  content: string,
  standardTerms: string[]
): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const words = extractWords(line);

    words.forEach((word) => {
      // 忽略 proto 关键字
      const protoKeywords = [
        'package',
        'message',
        'enum',
        'service',
        'rpc',
        'option',
        'optional',
        'repeated',
        'required',
        'bool',
        'string',
        'int32',
        'int64',
        'float',
        'double',
        'map',
        'oneof',
        'import',
        'syntax',
        'proto2',
        'proto3',
      ];

      if (protoKeywords.includes(word)) {
        return;
      }

      // 检查是否为标准词汇
      const isStandard = standardTerms.some((term) =>
        term.toLowerCase() === word.toLowerCase()
      );

      if (!isStandard) {
        // 在标准词汇表中查找最相似的术语
        const similarTerm = standardTerms.find((term) =>
          term.toLowerCase().includes(word.toLowerCase()) ||
          word.toLowerCase().includes(term.toLowerCase())
        );

        const suggestion = similarTerm
          ? `建议使用标准词汇：${similarTerm}`
          : '建议添加到词汇规范表';

        violations.push(createViolation(word, index + 1, suggestion));
      }
    });
  });

  return violations;
}
