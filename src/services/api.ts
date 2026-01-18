import { API_CONFIG, SYSTEM_PROMPT, FREE_VERSION_PROMPT, PAID_VERSION_PROMPT, WEALTH_CURVE_PROMPT, BaziForPrompt, DaYunForPrompt } from '@/lib/constants';
import { FreeVersionResult, PaidVersionResult, BirthInfo, WealthCurveData } from '@/types';
import { calculateBazi, calculateDaYun, BaziResult, DaYunItem } from '@/lib/bazi';

// 将计算结果转换为prompt格式
function toBaziForPrompt(bazi: BaziResult): BaziForPrompt {
  return {
    yearPillar: bazi.chart.yearPillar.fullName,
    monthPillar: bazi.chart.monthPillar.fullName,
    dayPillar: bazi.chart.dayPillar.fullName,
    hourPillar: bazi.chart.hourPillar.fullName,
    zodiac: bazi.chart.zodiac,
    lunarDate: bazi.chart.lunarDate,
  };
}

function toDaYunForPrompt(daYunList: DaYunItem[]): DaYunForPrompt[] {
  return daYunList.map(d => ({
    ganZhi: d.ganZhi,
    startAge: d.startAge,
    endAge: d.endAge,
  }));
}

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
  // 预计算八字
  const isLunar = birthInfo.calendarType === 'lunar';
  const baziResult = calculateBazi(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, isLunar
  );

  if (!baziResult) {
    throw new Error('八字计算失败，请检查出生信息');
  }

  // 预计算大运
  const daYunResult = calculateDaYun(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
  );

  if (!daYunResult) {
    throw new Error('大运计算失败，请检查出生信息');
  }

  const baziForPrompt = toBaziForPrompt(baziResult);
  const daYunForPrompt = toDaYunForPrompt(daYunResult.daYunList);

  // Calculate current age
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  const userPrompt = FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    baziForPrompt,
    daYunForPrompt,
    currentAge
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

  const aiResult = parseJSONWithRepair(content) as Partial<FreeVersionResult>;

  if (!aiResult.chartPoints || !Array.isArray(aiResult.chartPoints)) {
    throw new Error('返回数据格式不正确');
  }

  // 使用预计算的八字，不依赖AI返回
  const result: FreeVersionResult = {
    ...aiResult as FreeVersionResult,
    baziChart: baziResult.chart,
  };

  return result;
}

export async function generatePaidResult(
  birthInfo: BirthInfo,
  config: APIConfig = API_CONFIG,
  existingFreeResult?: FreeVersionResult // 升级时传入现有数据以保持一致性
): Promise<PaidVersionResult> {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  // 预计算八字
  const isLunar = birthInfo.calendarType === 'lunar';
  const baziResult = calculateBazi(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, isLunar
  );

  if (!baziResult) {
    throw new Error('八字计算失败，请检查出生信息');
  }

  // 预计算大运
  const daYunResult = calculateDaYun(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
  );

  if (!daYunResult) {
    throw new Error('大运计算失败，请检查出生信息');
  }

  const baziForPrompt = toBaziForPrompt(baziResult);
  const daYunForPrompt = toDaYunForPrompt(daYunResult.daYunList);

  const userPrompt = PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    baziForPrompt,
    daYunForPrompt,
    currentAge,
    existingFreeResult // 传入现有数据
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

  const aiResult = parseJSONWithRepair(content) as Partial<PaidVersionResult>;

  if (!aiResult.chartPoints || !Array.isArray(aiResult.chartPoints)) {
    throw new Error('返回数据格式不正确');
  }

  // 使用预计算的八字，不依赖AI返回
  const result: PaidVersionResult = {
    ...aiResult as PaidVersionResult,
    baziChart: baziResult.chart,
  };

  return result;
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

// 这些函数用于调试，需要先计算八字大运
export function getFreePrompt(birthInfo: BirthInfo): string {
  const isLunar = birthInfo.calendarType === 'lunar';
  const baziResult = calculateBazi(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, isLunar
  );
  const daYunResult = calculateDaYun(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
  );

  if (!baziResult || !daYunResult) {
    return '八字计算失败';
  }

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;

  return FREE_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    toBaziForPrompt(baziResult),
    toDaYunForPrompt(daYunResult.daYunList),
    currentAge
  );
}

export function getPaidPrompt(birthInfo: BirthInfo): string {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthInfo.year + 1;
  const isLunar = birthInfo.calendarType === 'lunar';
  const baziResult = calculateBazi(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, isLunar
  );
  const daYunResult = calculateDaYun(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
  );

  if (!baziResult || !daYunResult) {
    return '八字计算失败';
  }

  return PAID_VERSION_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    toBaziForPrompt(baziResult),
    toDaYunForPrompt(daYunResult.daYunList),
    currentAge
  );
}

// 生成财富曲线
export async function generateWealthCurve(
  birthInfo: BirthInfo,
  isPaid: boolean = false,
  config: APIConfig = API_CONFIG,
  existingData?: WealthCurveData // 升级时传入现有数据以保持一致性
): Promise<WealthCurveData> {
  // 预计算八字
  const isLunar = birthInfo.calendarType === 'lunar';
  const baziResult = calculateBazi(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, isLunar
  );

  if (!baziResult) {
    throw new Error('八字计算失败，请检查出生信息');
  }

  // 预计算大运
  const daYunResult = calculateDaYun(
    birthInfo.year, birthInfo.month, birthInfo.day,
    birthInfo.hour, birthInfo.minute, birthInfo.gender, isLunar
  );

  if (!daYunResult) {
    throw new Error('大运计算失败，请检查出生信息');
  }

  const baziForPrompt = toBaziForPrompt(baziResult);
  const daYunForPrompt = toDaYunForPrompt(daYunResult.daYunList);

  const userPrompt = WEALTH_CURVE_PROMPT(
    birthInfo.gender,
    birthInfo.year,
    baziForPrompt,
    daYunForPrompt,
    isPaid,
    existingData // 传入现有数据
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
      max_tokens: 20000,
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

  const aiResult = parseJSONWithRepair(content) as Partial<WealthCurveData>;

  // Debug: 输出AI返回的财富数据
  console.log('=== 财富曲线AI返回数据 ===');
  console.log('财富类型:', aiResult.wealthType);
  console.log('财富范围:', aiResult.wealthRange);
  console.log('高光时刻:', aiResult.highlights);
  console.log('数据点数量:', aiResult.dataPoints?.length);
  console.log('数据点:', aiResult.dataPoints);
  console.log('========================');

  if (!aiResult.dataPoints || !Array.isArray(aiResult.dataPoints)) {
    throw new Error('返回数据格式不正确');
  }

  return aiResult as WealthCurveData;
}
