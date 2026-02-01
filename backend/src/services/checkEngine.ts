/**
 * 检查规则引擎
 */

import type { Violation, RuleType, ViolationSeverity } from 'protohub-shared';

/**
 * 检查规则接口
 */
export interface CheckRule {
  name: string;
  type: RuleType;
  check: (content: string, vocabularyTerms: string[]) => Violation[];
  severity: ViolationSeverity;
}

/**
 * 检查规则注册表
 */
const rulesRegistry = new Map<string, CheckRule>();

/**
 * 注册检查规则
 */
export function registerRule(rule: CheckRule): void {
  rulesRegistry.set(rule.name, rule);
}

/**
 * 执行所有检查规则
 */
export function runAllRules(
  content: string,
  vocabularyTerms: string[]
): Violation[] {
  const allViolations: Violation[] = [];

  for (const rule of rulesRegistry.values()) {
    try {
      const violations = rule.check(content, vocabularyTerms);
      allViolations.push(...violations);
    } catch (error: any) {
      console.error(`规则 ${rule.name} 执行失败:`, error);
    }
  }

  return allViolations;
}

/**
 * 清空所有规则
 */
export function clearRules(): void {
  rulesRegistry.clear();
}

/**
 * 获取已注册的规则列表
 */
export function getRegisteredRules(): string[] {
  return Array.from(rulesRegistry.keys());
}
