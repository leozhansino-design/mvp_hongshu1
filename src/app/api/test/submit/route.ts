import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { calculateEnneagram, generateEnneagramReport } from '@/lib/enneagram';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSlug, answers, level, redeemCode } = body;

    // 验证参数
    if (!testSlug || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    // 获取设备ID
    const deviceId = request.headers.get('x-device-id') || 'unknown';

    const supabase = getSupabaseAdmin();

    // 如果有卡密，验证并使用
    if (redeemCode) {
      const { data: codeData, error: codeError } = await supabase
        .from('redemption_codes')
        .select('*')
        .eq('code', redeemCode)
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        return NextResponse.json(
          { success: false, error: '卡密无效或已被使用' },
          { status: 400 }
        );
      }

      // 验证卡密是否匹配测试
      if (codeData.test_slug && codeData.test_slug !== testSlug) {
        return NextResponse.json(
          { success: false, error: '此卡密不适用于该测试' },
          { status: 400 }
        );
      }

      // 标记卡密已使用
      await supabase
        .from('redemption_codes')
        .update({
          is_used: true,
          used_by_device: deviceId,
          used_at: new Date().toISOString(),
        })
        .eq('code', redeemCode);
    }

    // 计算结果
    let resultType = '';
    let resultSubtype = '';
    let scores = {};
    let reportData = {};

    if (testSlug === 'enneagram') {
      // 九型人格测试
      if (answers.length !== 144) {
        return NextResponse.json(
          { success: false, error: '答案数量不正确，需要144题' },
          { status: 400 }
        );
      }

      const result = calculateEnneagram(answers);
      const report = generateEnneagramReport(result);

      resultType = `type${result.mainType}`;
      resultSubtype = `${result.mainType}w${result.wingType}`;
      scores = {
        scores: result.scores,
        scorePercentages: result.scorePercentages,
      };
      reportData = {
        mainType: result.mainType,
        mainTypeName: result.mainTypeName,
        mainTypeEnglishName: result.mainTypeEnglishName,
        wingType: result.wingType,
        wingTypeName: result.wingTypeName,
        wingCombinationName: result.wingCombinationName,
        scores: result.scores,
        scorePercentages: result.scorePercentages,
        reportLevel: level || 'basic',
      };
    }

    // 生成结果ID
    const resultId = uuidv4();

    // 保存测试结果
    const { error: insertError } = await supabase
      .from('test_results')
      .insert({
        id: resultId,
        device_id: deviceId,
        test_slug: testSlug,
        answers,
        scores,
        result_type: resultType,
        result_subtype: resultSubtype,
        report_level: level || 'basic',
        report_data: reportData,
      });

    if (insertError) {
      console.error('保存测试结果失败:', insertError);
      return NextResponse.json(
        { success: false, error: '保存结果失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resultId,
    });
  } catch (error) {
    console.error('提交测试失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
