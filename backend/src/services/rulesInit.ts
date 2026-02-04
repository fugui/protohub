/**
 * 规则初始化模块
 * 注册所有检查规则到检查引擎
 */

import { registerRule } from './checkEngine';
import {
  checkFilename,
  checkPackageName,
  checkMessageNames,
  checkFieldNames,
  checkServiceNames,
} from '../utils/namingRules';
import { checkVocabulary } from '../utils/vocabularyRule';
import { checkCommonInterfaces } from '../utils/commonInterfaceRule';

/**
 * 初始化并注册所有检查规则
 */
export function initCheckRules(): void {
  // 注册命名规则
  registerRule({
    name: 'naming_file',
    type: 'naming_file',
    check: (content) => checkFilename(content),
    severity: 'error',
  });

  registerRule({
    name: 'naming_package',
    type: 'naming_package',
    check: (content) => checkPackageName(content),
    severity: 'error',
  });

  registerRule({
    name: 'naming_message',
    type: 'naming_message',
    check: (content) => checkMessageNames(content),
    severity: 'error',
  });

  registerRule({
    name: 'naming_field',
    type: 'naming_field',
    check: (content) => checkFieldNames(content),
    severity: 'error',
  });

  registerRule({
    name: 'naming_service',
    type: 'naming_service',
    check: (content) => checkServiceNames(content),
    severity: 'warning',
  });

  // 注册词汇规则
  registerRule({
    name: 'vocabulary',
    type: 'vocabulary',
    check: (content, vocabularyTerms) => checkVocabulary(content, vocabularyTerms),
    severity: 'warning',
  });

  // 注册公共接口规则
  registerRule({
    name: 'common_interface',
    type: 'common_interface',
    check: (content) => checkCommonInterfaces(content),
    severity: 'info',
  });
}
