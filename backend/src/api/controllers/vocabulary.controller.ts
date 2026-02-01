/**
 * 词汇管理控制器
 */

import {
  getAllTerms as getVocabularyTerms,
  getTermsByCategory as getVocabByCategory,
  createTerm as createVocabTerm,
  updateTerm as updateVocabTerm,
  deleteTerm as deleteVocabTerm,
} from '../../services/vocabularyService';

/**
 * 获取所有术语
 */
export async function getAllTerms() {
  return await getVocabularyTerms();
}

/**
 * 根据分类获取术语
 */
export async function getTermsByCategory(category: string) {
  return await getVocabByCategory(category);
}

/**
 * 创建术语
 */
export async function createTerm(data: {
  term: string;
  description?: string;
  category?: string;
}) {
  return await createVocabTerm(data);
}

/**
 * 更新术语
 */
export async function updateTerm(id: number, data: {
  term?: string;
  description?: string;
  category?: string;
}) {
  return await updateVocabTerm(id, data);
}

/**
 * 删除术语
 */
export async function deleteTerm(id: number) {
  return await deleteVocabTerm(id);
}
