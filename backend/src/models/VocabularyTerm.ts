/**
 * 词汇规范数据模型
 */

import type { VocabularyTermEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import { getDatabase } from '../config/db';

export class VocabularyTermRepository extends BaseRepository<VocabularyTermEntity> {
  constructor() {
    super(getDatabase(), 'vocabulary_terms', 'id');
  }

  /**
   * 根据术语查找
   */
  findByTerm(term: string): VocabularyTermEntity | undefined {
    return this.findOne({ term });
  }

  /**
   * 根据分类查找
   */
  findByCategory(category: string): VocabularyTermEntity[] {
    return this.findMany({ category });
  }

  /**
   * 搜索术语
   */
  search(keyword: string): VocabularyTermEntity[] {
    const db = getDatabase();
    const pattern = `%${keyword}%`;
    return db
      .prepare(`
        SELECT * FROM vocabulary_terms
        WHERE term LIKE ? OR description LIKE ?
        ORDER BY term
      `)
      .all(pattern, pattern) as VocabularyTermEntity[];
  }

  /**
   * 获取所有术语（用于验证）
   */
  getAllTerms(): string[] {
    const all = this.findAll();
    return all.map((t) => t.term);
  }

  /**
   * 创建术语
   */
  create(data: Omit<VocabularyTermEntity, 'id' | 'created_at'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新术语
   */
  updateTerm(id: number, data: Partial<Omit<VocabularyTermEntity, 'id' | 'created_at'>>): void {
    this.update(id, data);
  }
}

// 导出单例
export const vocabularyTermRepository = new VocabularyTermRepository();
