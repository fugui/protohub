/**
 * 词汇管理服务
 */

import { vocabularyTermRepository } from '../models/VocabularyTerm';
import type { VocabularyTerm } from 'protohub-shared';

/**
 * 获取所有术语
 */
export function getAllTerms(): VocabularyTerm[] {
  const entities = vocabularyTermRepository.getAllTerms();
  return entities.map((entity) => ({
    id: entity.id,
    term: entity.term,
    description: entity.description || undefined,
    category: entity.category || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 根据分类获取术语
 */
export function getTermsByCategory(category: string): VocabularyTerm[] {
  const entities = vocabularyTermRepository.findByCategory(category);
  return entities.map((entity) => ({
    id: entity.id,
    term: entity.term,
    description: entity.description || undefined,
    category: entity.category || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 搜索术语
 */
export function searchTerms(keyword: string): VocabularyTerm[] {
  const entities = vocabularyTermRepository.search(keyword);
  return entities.map((entity) => ({
    id: entity.id,
    term: entity.term,
    description: entity.description || undefined,
    category: entity.category || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 获取所有术语（用于检查规则）
 */
export function getTermsForChecking(): string[] {
  return vocabularyTermRepository.getAllTerms();
}

/**
 * 创建术语
 */
export function createTerm(data: {
  term: string;
  description?: string;
  category?: string;
}): VocabularyTerm {
  // 验证术语是否已存在
  const existing = vocabularyTermRepository.findByTerm(data.term);
  if (existing) {
    throw new Error('术语已存在');
  }

  const termId = vocabularyTermRepository.create({
    term: data.term,
    description: data.description || null,
    category: data.category || null,
  });

  const entity = vocabularyTermRepository.findById(termId);
  if (!entity) {
    throw new Error('术语创建失败');
  }

  return {
    id: entity.id,
    term: entity.term,
    description: entity.description || undefined,
    category: entity.category || undefined,
    createdAt: entity.created_at,
  };
}

/**
 * 更新术语
 */
export function updateTerm(
  id: number,
  data: { term?: string; description?: string; category?: string }
): VocabularyTerm {
  const existing = vocabularyTermRepository.findById(id);
  if (!existing) {
    throw new Error('术语不存在');
  }

  vocabularyTermRepository.updateTerm(id, data);

  const updated = vocabularyTermRepository.findById(id);
  if (!updated) {
    throw new Error('术语更新失败');
  }

  return {
    id: updated.id,
    term: updated.term,
    description: updated.description || undefined,
    category: updated.category || undefined,
    createdAt: updated.created_at,
  };
}

/**
 * 删除术语
 */
export function deleteTerm(id: number): void {
  const existing = vocabularyTermRepository.findById(id);
  if (!existing) {
    throw new Error('术语不存在');
  }

  vocabularyTermRepository.deleteMany({ id });

  // TODO: 需要添加 delete 方法到 Repository
}
