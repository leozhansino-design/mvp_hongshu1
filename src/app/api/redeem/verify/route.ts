import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, testSlug } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: '请输入卡密' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 查询卡密
    const { data, error } = await supabase
      .from('redemption_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '卡密不存在' },
        { status: 400 }
      );
    }

    // 检查是否已使用
    if (data.is_used) {
      return NextResponse.json(
        { success: false, error: '卡密已被使用' },
        { status: 400 }
      );
    }

    // 检查是否匹配测试类型
    if (data.test_slug && data.test_slug !== testSlug) {
      return NextResponse.json(
        { success: false, error: `此卡密仅适用于${data.test_slug}测试` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reportLevel: data.report_level,
    });
  } catch (error) {
    console.error('验证卡密失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
