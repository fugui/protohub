/**
 * 词汇管理服务
 */

import { vocabularyTermRepository } from '../models/VocabularyTerm';
import type { VocabularyTerm, PaginatedResponse } from 'protohub-shared';

/**
 * 将实体转换为 API 类型
 */
function toVocabularyTerm(entity: {
  id: number;
  term: string;
  description?: string | null;
  description_en?: string | null;
  aliases?: string | null;
  similar_terms?: string | null;
  domain?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}): VocabularyTerm {
  return {
    id: entity.id,
    term: entity.term,
    description: entity.description || undefined,
    descriptionEn: entity.description_en || undefined,
    aliases: entity.aliases ? JSON.parse(entity.aliases) as string[] : undefined,
    similarTerms: entity.similar_terms ? JSON.parse(entity.similar_terms) as string[] : undefined,
    domain: entity.domain || undefined,
    category: entity.category || undefined,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

/**
 * 获取所有术语
 */
export function getAllTerms(): PaginatedResponse<VocabularyTerm> {
  const entities = vocabularyTermRepository.getAllTermEntities();
  const data = entities.map(toVocabularyTerm);

  return {
    data,
    total: data.length,
    page: 1,
    pageSize: data.length,
  };
}

/**
 * 根据分类获取术语
 */
export function getTermsByCategory(category: string): VocabularyTerm[] {
  const entities = vocabularyTermRepository.findByCategory(category);
  return entities.map(toVocabularyTerm);
}

/**
 * 搜索术语
 */
export function searchTerms(keyword: string): VocabularyTerm[] {
  const entities = vocabularyTermRepository.search(keyword);
  return entities.map(toVocabularyTerm);
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
  descriptionEn?: string;
  aliases?: string[];
  similarTerms?: string[];
  domain?: string;
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
    description_en: data.descriptionEn || null,
    aliases: data.aliases ? JSON.stringify(data.aliases) : null,
    similar_terms: data.similarTerms ? JSON.stringify(data.similarTerms) : null,
    domain: data.domain || null,
    category: data.category || null,
    updated_at: new Date().toISOString(),
  });

  const entity = vocabularyTermRepository.findById(termId);
  if (!entity) {
    throw new Error('术语创建失败');
  }

  return toVocabularyTerm(entity);
}

/**
 * 更新术语
 */
export function updateTerm(
  id: number,
  data: { 
    term?: string; 
    description?: string; 
    descriptionEn?: string;
    aliases?: string[];
    similarTerms?: string[];
    domain?: string;
    category?: string; 
  }
): VocabularyTerm {
  const existing = vocabularyTermRepository.findById(id);
  if (!existing) {
    throw new Error('术语不存在');
  }

  const updateData: Record<string, any> = {};
  if (data.term !== undefined) updateData.term = data.term;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.descriptionEn !== undefined) updateData.description_en = data.descriptionEn;
  if (data.aliases !== undefined) updateData.aliases = JSON.stringify(data.aliases);
  if (data.similarTerms !== undefined) updateData.similar_terms = JSON.stringify(data.similarTerms);
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.category !== undefined) updateData.category = data.category;
  updateData.updated_at = new Date().toISOString();

  vocabularyTermRepository.updateTerm(id, updateData);

  const updated = vocabularyTermRepository.findById(id);
  if (!updated) {
    throw new Error('术语更新失败');
  }

  return toVocabularyTerm(updated);
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
