import { API_CONFIG, SYSTEM_PROMPT, FREE_VERSION_PROMPT, PAID_VERSION_PROMPT } from '@/lib/constants';
import { FreeVersionResult, PaidVersionResult, BirthInfo } from '@/types';

// 修复常见的JSON格式错误
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;

  // 修复八字柱位缺少earthlyBranch键名的问题
  // 例如: {"heavenlyStem": "癸", "巳", "fullName": "癸巳"}
  // 修复为: {"heavenlyStem": "癸", "earthlyBranch": "巳", "fullName": "癸巳"}
  const pillarPattern = /"heavenlyStem"\s*:\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"fullName"/g;
  repaired = repaired.replace(pillarPattern, '"heavenlyStem": "$1", "earthlyBranch": "$2", "fullName"');

  // 修复缺少键名的情况 - 通用模式
  // 检测 "value1", "value2", "key": 这种模式，尝试修复
  // 这种情况通常发生在连续的值之间

  // 修复多余的逗号
  repaired = repaired.replace(/,\s*,/g, ',');
  repaired = repaired.replace(/,\s*}/g, '}');
  repaired = repaired.replace(/,\s*]/g, ']');

  // 修复缺少逗号的情况
  repaired = repaired.replace(/}\s*{/g, '},{');
  repaired = repaired.replace(/]\s*\[/g, '],[');

  // 修复单引号改为双引号
  // 小心处理，只替换作为JSON字符串分隔符的单引号

  return repaired;
}

// 尝试多种方式解析JSON
function parseJSONWithRepair(content: string): unknown {
  // 第一次尝试：直接解析
  try {
    return JSON.parse(content);
  } catch {
    console.log('直接解析失败，尝试修复JSON...');
  }

  // 第二次尝试：清理并修复后解析
  let cleanedContent = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 确保从{开始
  const jsonStart = cleanedContent.indexOf('{');
  if (jsonStart > 0) {
    cleanedContent = cleanedContent.substring(jsonStart);
  }

  // 确保以}结束
  const jsonEnd = cleanedContent.lastIndexOf('}');
  if (jsonEnd > 0 && jsonEnd < cleanedContent.length - 1) {
    cleanedContent = cleanedContent.substring(0, jsonEnd + 1);
  }

  // 应用修复
  const repairedContent = repairJSON(cleanedContent);

  try {
    return JSON.parse(repairedContent);
  } catch (e) {
    console.error('修复后仍无法解析:', e);
    console.error('原始内容:', content.substring(0, 500));
    console.error('修复后内容:', repairedContent.substring(0, 500));
    throw new Error('AI返回的数据格式不正确，请重试');
  }
}

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
  const userPrompt = FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    birthInfo.hour,
    birthInfo.minute,
    birthInfo.calendarType || 'solar',
    birthInfo.birthPlace
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
      max_tokens: 30000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API错误: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // 检查是否因长度被截断
  const finishReason = data.choices[0]?.finish_reason;
  if (finishReason === 'length') {
    console.error('响应被截断:', data);
    throw new Error('AI响应被截断，请重试');
  }

  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI未返回有效内容');
  }

  const result = parseJSONWithRepair(content) as FreeVersionResult;

  if (!result.chartPoints || !Array.isArray(result.chartPoints)) {
    throw new Error('返回数据格式不正确');
  }

  return result;
}

export async function generatePaidResult(
  birthInfo: BirthInfo,
  config: APIConfig = API_CONFIG
): Promise<PaidVersionResult> {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  const userPrompt = PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    birthInfo.hour,
    birthInfo.minute,
    birthInfo.calendarType || 'solar',
    currentAge,
    birthInfo.birthPlace
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
      max_tokens: 30000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API错误: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // 检查是否因长度被截断
  const finishReason = data.choices[0]?.finish_reason;
  if (finishReason === 'length') {
    console.error('响应被截断:', data);
    throw new Error('AI响应被截断，请重试');
  }

  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI未返回有效内容');
  }

  const result = parseJSONWithRepair(content) as PaidVersionResult;

  if (!result.chartPoints || !Array.isArray(result.chartPoints)) {
    throw new Error('返回数据格式不正确');
  }

  return result;
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function getFreePrompt(birthInfo: BirthInfo): string {
  return FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    birthInfo.hour,
    birthInfo.minute,
    birthInfo.calendarType || 'solar',
    birthInfo.birthPlace
  );
}

export function getPaidPrompt(birthInfo: BirthInfo): string {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  return PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    birthInfo.month,
    birthInfo.day,
    birthInfo.hour,
    birthInfo.minute,
    birthInfo.calendarType || 'solar',
    currentAge,
    birthInfo.birthPlace
  );
}
