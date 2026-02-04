import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// 验证管理员身份
async function verifyAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === 'authenticated';
}

// 生成随机卡密
function generateCode(length: number = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符 O, I, L, 0, 1
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: 获取卡密列表
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const testSlug = searchParams.get('testSlug');
    const isUsed = searchParams.get('isUsed');
    const batchName = searchParams.get('batchName');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('redemption_codes')
      .select('*', { count: 'exact' });

    if (testSlug) {
      query = query.eq('test_slug', testSlug);
    }
    if (isUsed !== null && isUsed !== '') {
      query = query.eq('is_used', isUsed === 'true');
    }
    if (batchName) {
      query = query.eq('batch_name', batchName);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // 获取批次列表
    const { data: batches } = await supabase
      .from('redemption_codes')
      .select('batch_name')
      .not('batch_name', 'is', null);

    const uniqueBatches = [...new Set(batches?.map(b => b.batch_name).filter(Boolean))];

    return NextResponse.json({
      success: true,
      codes: data || [],
      total: count || 0,
      batches: uniqueBatches,
    });
  } catch (error) {
    console.error('获取卡密列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

// POST: 批量生成卡密
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { testSlug, reportLevel, count, batchName } = body;

    // 验证参数
    if (!testSlug || !reportLevel || !count) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 10000) {
      return NextResponse.json(
        { success: false, error: '生成数量需要在1-10000之间' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 生成卡密
    const codes: { code: string; test_slug: string; report_level: string; batch_name: string | null }[] = [];
    const generatedCodes = new Set<string>();

    while (codes.length < count) {
      const code = generateCode();
      if (!generatedCodes.has(code)) {
        generatedCodes.add(code);
        codes.push({
          code,
          test_slug: testSlug,
          report_level: reportLevel,
          batch_name: batchName || null,
        });
      }
    }

    // 批量插入
    const { error } = await supabase
      .from('redemption_codes')
      .insert(codes);

    if (error) {
      // 可能有重复的卡密
      console.error('批量插入卡密失败:', error);
      return NextResponse.json(
        { success: false, error: '生成失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: codes.length,
      codes: codes.map(c => c.code),
    });
  } catch (error) {
    console.error('生成卡密失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE: 删除卡密
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');
    const batchName = searchParams.get('batchName');
    const deleteUnused = searchParams.get('deleteUnused') === 'true';

    const supabase = getSupabaseAdmin();

    if (codeId) {
      // 删除单个卡密
      const { error } = await supabase
        .from('redemption_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        throw error;
      }
    } else if (batchName && deleteUnused) {
      // 删除批次中未使用的卡密
      const { error } = await supabase
        .from('redemption_codes')
        .delete()
        .eq('batch_name', batchName)
        .eq('is_used', false);

      if (error) {
        throw error;
      }
    } else {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除卡密失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
