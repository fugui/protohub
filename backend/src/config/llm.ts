/**
 * LLM 配置
 * 用于词汇智能检查服务
 */

/**
 * OpenAI API URL
 * 默认使用 OpenAI 官方 API，可配置为兼容接口（如 Azure、本地模型等）
 */
export const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

/**
 * OpenAI API Key
 * 用于认证 API 请求
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * OpenAI Model
 * 默认使用 gpt-3.5-turbo，可根据需要更换为其他模型
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * LLM 功能开关
 * 当未配置 API Key 时，LLM 检查将自动跳过
 */
export const LLM_ENABLED = !!OPENAI_API_KEY;
