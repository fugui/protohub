/**
 * 词汇规范检查器
 * 集成规则匹配和 LLM 智能匹配
 */

import type { Violation } from 'protohub-shared';
import { checkTermWithLLM } from '../services/llmVocabularyService';
import { vocabularyTermRepository } from '../models/VocabularyTerm';

/**
 * 词汇检查配置
 */
interface CheckConfig {
  /** LLM 检查开关 */
  enableLLM: boolean;
  /** 置信度阈值 */
  confidenceThreshold: number;
}

/**
 * 提取所有单词（包括驼峰和下划线命名）
 */
function extractWords(text: string): string[] {
  const words = new Set<string>();

  // 匹配驼峰命名：UserInfo -> User, Info
  const camelCasePattern = /[A-Z][a-z]+/g;
  let match;
  while ((match = camelCasePattern.exec(text)) !== null) {
    words.add(match[0]);
  }

  // 匹配小写开头的驼峰：userInfo -> user, Info
  const lowerCamelPattern = /[a-z]+(?=[A-Z])/g;
  while ((match = lowerCamelPattern.exec(text)) !== null) {
    words.add(match[0]);
  }

  // 匹配下划线命名：user_id -> user, id
  const snakePattern = /[a-zA-Z]+/g;
  while ((match = snakePattern.exec(text)) !== null) {
    if (match[0].includes('_')) {
      match[0].split('_').forEach(part => words.add(part));
    } else {
      words.add(match[0]);
    }
  }

  return Array.from(words).filter(w => w.length > 1);
}

/**
 * 生成违规项
 */
function createViolation(
  _word: string,
  line: number,
  severity: 'error' | 'warning' | 'info',
  message: string,
  suggestion: string
): Violation {
  return {
    id: 0,
    ruleType: 'vocabulary',
    severity,
    fileLine: line,
    violationMessage: message,
    suggestion,
  };
}

/**
 * 从术语表中获取同义词映射
 */
function getSynonymsMap(terms: { term: string; aliases?: string | null }[]): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const { term, aliases } of terms) {
    // 添加术语本身
    map.set(term.toLowerCase(), term);
    
    // 添加同义词
    if (aliases) {
      try {
        const aliasList = JSON.parse(aliases) as string[];
        for (const alias of aliasList) {
          map.set(alias.toLowerCase(), term);
        }
      } catch {
        // 解析失败，忽略
      }
    }
  }
  
  return map;
}

/**
 * 检查 proto 文件内容中的词汇使用
 * 同步版本 - 仅使用规则匹配
 */
export function checkVocabulary(
  content: string,
  standardTerms: string[]
): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');
  const termsWithAliases = vocabularyTermRepository.getAllTermEntities();
  const synonymsMap = getSynonymsMap(termsWithAliases);
  const standardTermsLower = standardTerms.map(t => t.toLowerCase());

  lines.forEach((line, index) => {
    const words = extractWords(line);

    words.forEach((word) => {
      const wordLower = word.toLowerCase();
      
      // 忽略 proto 关键字
      const protoKeywords = [
        'package', 'message', 'enum', 'service', 'rpc', 'option',
        'optional', 'repeated', 'required', 'bool', 'string',
        'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64',
        'fixed32', 'fixed64', 'sfixed32', 'sfixed64',
        'float', 'double', 'bytes', 'map', 'oneof', 'import',
        'syntax', 'proto2', 'proto3', 'true', 'false',
      ];

      if (protoKeywords.includes(wordLower)) {
        return;
      }

      // 1. 完全匹配标准术语
      if (standardTermsLower.includes(wordLower)) {
        return; // 标准词汇，无需处理
      }

      // 2. 同义词匹配
      const synonymMatch = synonymsMap.get(wordLower);
      if (synonymMatch) {
        violations.push(createViolation(
          word,
          index + 1,
          'warning',
          `术语 "${word}" 建议使用标准词汇 "${synonymMatch}"`,
          `"${word}" 是 "${synonymMatch}" 的同义词/变体，请使用标准术语 "${synonymMatch}"`
        ));
        return;
      }

      // 3. 相似词匹配（简单字符串包含）
      const similarTerm = standardTerms.find((term) =>
        term.toLowerCase().includes(wordLower) ||
        wordLower.includes(term.toLowerCase())
      );

      if (similarTerm) {
        violations.push(createViolation(
          word,
          index + 1,
          'info',
          `术语 "${word}" 可能应为 "${similarTerm}"`,
          `是否想表达 "${similarTerm}"？请确认或使用标准术语`
        ));
        return;
      }

      // 4. 未匹配到任何标准词汇
      violations.push(createViolation(
        word,
        index + 1,
        'warning',
        `非标准术语 "${word}"`,
        '该术语不在标准词汇表中，建议添加到词汇规范或使用已有标准术语'
      ));
    });
  });

  return violations;
}

/**
 * 异步检查 - 集成 LLM 智能匹配
 * @param content proto 文件内容
 * @param standardTerms 标准术语列表
 * @param config 检查配置
 * @returns 违规项列表
 */
export async function checkVocabularyAsync(
  content: string,
  standardTerms: string[],
  config: CheckConfig = { enableLLM: true, confidenceThreshold: 0.8 }
): Promise<Violation[]> {
  // 先进行规则检查
  const violations = checkVocabulary(content, standardTerms);
  
  if (!config.enableLLM) {
    return violations;
  }

  // 提取需要 LLM 检查的术语（相似度不确定的）
  const lines = content.split('\n');
  const uncertainTerms = new Map<string, number>(); // term -> line number

  lines.forEach((line, index) => {
    const words = extractWords(line);
    words.forEach(word => {
      // 如果已经确定为违规项（非标准词汇），则交给 LLM 二次确认
      const hasViolation = violations.some(v => 
        v.fileLine === index + 1 && 
        v.violationMessage.includes(word)
      );
      if (hasViolation) {
        uncertainTerms.set(word, index + 1);
      }
    });
  });

  // 如果没有不确定术语，直接返回
  if (uncertainTerms.size === 0) {
    return violations;
  }

  // 使用 LLM 检查不确定的术语
  const llmResults = await Promise.all(
    Array.from(uncertainTerms.entries()).map(async ([term, line]) => {
      const result = await checkTermWithLLM(term, standardTerms);
      return { term, line, result };
    })
  );

  // 更新违规项（移除 LLM 认为匹配的高置信度项，更新建议）
  const updatedViolations = violations.filter(v => {
    const llmMatch = llmResults.find(r => 
      r.line === v.fileLine && 
      v.violationMessage.includes(r.term)
    );
    
    if (llmMatch && llmMatch.result.matched && llmMatch.result.confidence >= config.confidenceThreshold) {
      // LLM 认为匹配且置信度高，移除该违规项
      return false;
    }
    return true;
  });

  // 为 LLM 认为匹配但置信度中等的添加建议
  for (const { term, line, result } of llmResults) {
    if (result.matched && 
        result.confidence < config.confidenceThreshold &&
        result.suggestedTerm) {
      const existingViolation = updatedViolations.find(v => 
        v.fileLine === line && v.violationMessage.includes(term)
      );
      if (existingViolation) {
        existingViolation.suggestion = 
          `LLM 建议可能应为 "${result.suggestedTerm}"（置信度 ${(result.confidence * 100).toFixed(0)}%）`;
      }
    }
  }

  return updatedViolations;
}
