/**
 * LLM 词汇智能检查服务
 * 使用 OpenAI 兼容接口进行术语智能匹配
 */

import { OPENAI_API_URL, OPENAI_API_KEY, OPENAI_MODEL, LLM_ENABLED } from '../config/llm';

/**
 * LLM 匹配结果
 */
export interface LLMMatchResult {
  /** 是否匹配到标准术语 */
  matched: boolean;
  /** 推荐的标准术语（如果匹配） */
  suggestedTerm?: string;
  /** 匹配置信度 0-1 */
  confidence: number;
  /** 匹配原因/说明 */
  reason?: string;
}

/**
 * 使用 LLM 检查术语是否匹配标准术语表
 * @param userTerm 用户使用的术语
 * @param standardTerms 标准术语列表
 * @returns 匹配结果
 */
export async function checkTermWithLLM(
  userTerm: string,
  standardTerms: string[]
): Promise<LLMMatchResult> {
  // 如果 LLM 未启用，直接返回不匹配
  if (!LLM_ENABLED) {
    return {
      matched: false,
      confidence: 0,
      reason: 'LLM 未配置，跳过智能检查',
    };
  }

  // 如果标准术语表为空，直接返回不匹配
  if (!standardTerms || standardTerms.length === 0) {
    return {
      matched: false,
      confidence: 0,
      reason: '标准术语表为空',
    };
  }

  const prompt = buildPrompt(userTerm, standardTerms);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的产品命名规范检查助手。你的任务是判断用户使用的术语是否与标准术语表中的某个术语含义相同或相近。请只返回 JSON 格式的结果，不要包含其他解释。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // 低温度以获得更确定的结果
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API 调用失败:', response.status, errorText);
      return {
        matched: false,
        confidence: 0,
        reason: `API 错误: ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        matched: false,
        confidence: 0,
        reason: 'LLM 返回为空',
      };
    }

    // 解析 LLM 返回的 JSON
    return parseLLMResponse(content, standardTerms);
  } catch (error) {
    console.error('LLM 检查术语时出错:', error);
    return {
      matched: false,
      confidence: 0,
      reason: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 构建提示词
 */
function buildPrompt(userTerm: string, standardTerms: string[]): string {
  const termsList = standardTerms.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return `请判断用户使用的术语"${userTerm}"是否与以下标准术语表中的某个术语含义相同或相近。

标准术语表：
${termsList}

请按以下 JSON 格式返回结果：
{
  "matched": true/false,  // 是否找到匹配的标准术语
  "suggestedTerm": "",   // 如果匹配，填写推荐的标准术语；如果不匹配，为空字符串
  "confidence": 0.0-1.0,  // 匹配的置信度，1.0 表示完全确定
  "reason": ""           // 简要说明匹配原因或不匹配的原因
}

注意事项：
1. 考虑术语的同义词、缩写、常见变体
2. 置信度高于 0.8 时才建议匹配
3. 如果不确定，建议返回 matched: false
4. 必须返回合法的 JSON 格式，不要包含 markdown 代码块标记`;
}

/**
 * 解析 LLM 返回的响应
 */
function parseLLMResponse(content: string, standardTerms: string[]): LLMMatchResult {
  try {
    // 尝试直接解析
    let jsonStr = content;

    // 如果内容被 markdown 代码块包裹，尝试提取
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const result = JSON.parse(jsonStr) as Partial<LLMMatchResult>;

    // 验证返回的建议术语是否在标准列表中
    if (result.matched && result.suggestedTerm) {
      const isValidTerm = standardTerms.some(
        (t) => t.toLowerCase() === result.suggestedTerm?.toLowerCase()
      );
      if (!isValidTerm) {
        return {
          matched: false,
          confidence: 0,
          reason: 'LLM 推荐的术语不在标准术语表中',
        };
      }
    }

    return {
      matched: result.matched === true,
      suggestedTerm: result.suggestedTerm,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      reason: result.reason,
    };
  } catch (error) {
    console.error('解析 LLM 响应失败:', content, error);
    return {
      matched: false,
      confidence: 0,
      reason: '无法解析 LLM 响应',
    };
  }
}

/**
 * 批量检查多个术语
 * @param userTerms 用户使用的术语列表
 * @param standardTerms 标准术语列表
 * @returns 每个术语的匹配结果
 */
export async function checkTermsWithLLM(
  userTerms: string[],
  standardTerms: string[]
): Promise<Map<string, LLMMatchResult>> {
  const results = new Map<string, LLMMatchResult>();

  // 依次检查每个术语（避免一次性发送太多请求）
  for (const term of userTerms) {
    const result = await checkTermWithLLM(term, standardTerms);
    results.set(term, result);
  }

  return results;
}
