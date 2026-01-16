import { API_CONFIG, SYSTEM_PROMPT, FREE_VERSION_PROMPT, PAID_VERSION_PROMPT } from '@/lib/constants';
import { FreeVersionResult, PaidVersionResult, BirthInfo, HOUR_LABELS } from '@/types';

interface APIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function testAPIConnection(config: APIConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'user', content: '请回复"连接成功"' }
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `API错误: ${response.status} - ${error}` };
    }

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return { success: true, message: '连接成功' };
    }
    return { success: false, message: '响应格式异常' };
  } catch (error) {
    return { success: false, message: `网络错误: ${error instanceof Error ? error.message : '未知错误'}` };
  }
}

export async function generateFreeResult(
  birthInfo: BirthInfo,
  config: APIConfig = API_CONFIG
): Promise<FreeVersionResult> {
  const hourLabel = HOUR_LABELS[birthInfo.hour] || birthInfo.hour;
  const userPrompt = FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    hourLabel,
    birthInfo.province,
    birthInfo.city
  );

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI未返回有效内容');
  }

  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent) as FreeVersionResult;

    if (!result.klineData || !Array.isArray(result.klineData)) {
      throw new Error('返回数据格式不正确');
    }

    return result;
  } catch {
    console.error('JSON解析失败:', content);
    throw new Error('AI返回的数据格式不正确');
  }
}

export async function generatePaidResult(
  birthInfo: BirthInfo,
  config: APIConfig = API_CONFIG
): Promise<PaidVersionResult> {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  const hourLabel = HOUR_LABELS[birthInfo.hour] || birthInfo.hour;

  const userPrompt = PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    hourLabel,
    currentAge,
    birthInfo.province,
    birthInfo.city
  );

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI未返回有效内容');
  }

  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent) as PaidVersionResult;

    if (!result.klineData || !Array.isArray(result.klineData)) {
      throw new Error('返回数据格式不正确');
    }

    return result;
  } catch {
    console.error('JSON解析失败:', content);
    throw new Error('AI返回的数据格式不正确');
  }
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function getFreePrompt(birthInfo: BirthInfo): string {
  const hourLabel = HOUR_LABELS[birthInfo.hour] || birthInfo.hour;
  return FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    hourLabel,
    birthInfo.province,
    birthInfo.city
  );
}

export function getPaidPrompt(birthInfo: BirthInfo): string {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  const hourLabel = HOUR_LABELS[birthInfo.hour] || birthInfo.hour;
  return PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    hourLabel,
    currentAge,
    birthInfo.province,
    birthInfo.city
  );
}
