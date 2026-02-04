import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// 验证管理员身份
async function verifyAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === 'authenticated';
}

// GET: 导出卡密
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const batchName = searchParams.get('batchName');
    const testSlug = searchParams.get('testSlug');
    const onlyUnused = searchParams.get('onlyUnused') === 'true';

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('redemption_codes')
      .select('code, test_slug, report_level, batch_name, is_used, created_at');

    if (batchName) {
      query = query.eq('batch_name', batchName);
    }
    if (testSlug) {
      query = query.eq('test_slug', testSlug);
    }
    if (onlyUnused) {
      query = query.eq('is_used', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 生成CSV内容
    const headers = ['卡密', '测试类型', '报告级别', '批次', '是否已用', '创建时间'];
    const rows = (data || []).map(code => [
      code.code,
      code.test_slug,
      code.report_level === 'full' ? '完整版' : '基础版',
      code.batch_name || '',
      code.is_used ? '是' : '否',
      new Date(code.created_at).toLocaleString('zh-CN'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // 返回CSV文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=codes_${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error('导出卡密失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    );
  }
}
