import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { calculateEnneagram, generateEnneagramReport } from '@/lib/enneagram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSlug, answers, level, redeemCode, orderId } = body;

    // 验证参数
    if (!testSlug || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    // 计算结果
    let resultData: Record<string, unknown> = {};

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

      resultData = {
        testSlug,
        mainType: result.mainType,
        mainTypeName: result.mainTypeName,
        mainTypeEnglishName: result.mainTypeEnglishName,
        mainTypeDescription: result.mainTypeDescription,
        wingType: result.wingType,
        wingTypeName: result.wingTypeName,
        wingCombinationName: result.wingCombinationName,
        scores: result.scores,
        scorePercentages: result.scorePercentages,
        reportLevel: level || 'basic',
        report,
        redeemCode,
        orderId,
        createdAt: new Date().toISOString(),
      };
    }

    // 生成结果ID
    const resultId = uuidv4();

    // 尝试保存到数据库（如果可用），失败也不影响返回结果
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabase = getSupabaseAdmin();

      // 获取设备ID
      const deviceId = request.headers.get('x-device-id') || 'unknown';

      // 如果有卡密，标记已使用
      if (redeemCode) {
        await supabase
          .from('redemption_codes')
          .update({
            is_used: true,
            used_by_device: deviceId,
            used_at: new Date().toISOString(),
          })
          .eq('code', redeemCode)
          .eq('is_used', false);
      }

      // 保存测试结果
      await supabase
        .from('test_results')
        .insert({
          id: resultId,
          device_id: deviceId,
          test_slug: testSlug,
          answers,
          scores: { scores: resultData.scores, scorePercentages: resultData.scorePercentages },
          result_type: `type${resultData.mainType}`,
          result_subtype: `${resultData.mainType}w${resultData.wingType}`,
          report_level: level || 'basic',
          report_data: resultData,
        });
    } catch (dbError) {
      // 数据库保存失败不影响返回结果
      console.log('数据库保存跳过（可能未配置）:', dbError);
    }

    // 返回结果数据，前端可以直接使用
    return NextResponse.json({
      success: true,
      resultId,
      result: resultData,
    });
  } catch (error) {
    console.error('提交测试失败:', error);
    return NextResponse.json(
      { success: false, error: '计算结果失败，请重试' },
      { status: 500 }
    );
  }
}
