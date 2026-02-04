import fs from 'fs';
import path from 'path';
import { logger } from '../middlewares/logger';

/**
 * 文件系统工具类
 * 处理 Proto 文件的存储、读取等操作
 */
export class FileSystem {
  private readonly storageDir: string;

  constructor() {
    this.storageDir = process.env.PROTO_STORAGE_DIR || path.resolve(__dirname, '../../../storage/proto-files');
  }

  /**
   * 确保 Proto 文件目录存在
   */
  async ensureStorageDir(): Promise<void> {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
        logger.info(`Proto 文件存储目录已创建: ${this.storageDir}`);
      }
    } catch (error) {
      logger.error('创建存储目录失败', error);
      throw error;
    }
  }

  /**
   * 保存 Proto 文件
   */
  async saveProtoFile(filename: string, content: string): Promise<string> {
    try {
      await this.ensureStorageDir();
      const filePath = path.join(this.storageDir, filename);
      fs.writeFileSync(filePath, content, 'utf-8');
      logger.info(`Proto 文件已保存: ${filename}`);
      return filePath;
    } catch (error) {
      logger.error('保存 Proto 文件失败', error);
      throw error;
    }
  }

  /**
   * 读取 Proto 文件
   */
  async readProtoFile(filename: string): Promise<string> {
    try {
      await this.ensureStorageDir();
      const filePath = path.join(this.storageDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      logger.debug(`Proto 文件已读取: ${filename}`);
      return content;
    } catch (error) {
      logger.error('读取 Proto 文件失败', error);
      throw error;
    }
  }

  /**
   * 删除 Proto 文件
   */
  async deleteProtoFile(filename: string): Promise<boolean> {
    try {
      await this.ensureStorageDir();
      const filePath = path.join(this.storageDir, filename);

      if (!fs.existsSync(filePath)) {
        logger.warn(`Proto 文件不存在: ${filename}`);
        return false;
      }

      fs.unlinkSync(filePath);
      logger.info(`Proto 文件已删除: ${filename}`);
      return true;
    } catch (error) {
      logger.error('删除 Proto 文件失败', error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      await this.ensureStorageDir();
      const filePath = path.join(this.storageDir, filename);
      return fs.existsSync(filePath);
    } catch (error) {
      logger.error('检查文件存在失败', error);
      throw error;
    }
  }

  /**
   * 获取所有 Proto 文件列表
   */
  async listProtoFiles(): Promise<string[]> {
    try {
      await this.ensureStorageDir();
      const files = fs.readdirSync(this.storageDir);
      return files.filter(f => f.endsWith('.proto'));
    } catch (error) {
      logger.error('获取 Proto 文件列表失败', error);
      throw error;
    }
  }
}
