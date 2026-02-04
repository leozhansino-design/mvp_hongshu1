import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少结果ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 获取测试结果
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '结果不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result: data.report_data,
    });
  } catch (error) {
    console.error('获取测试结果失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
