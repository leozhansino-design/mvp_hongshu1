import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 默认配置值
const DEFAULT_CONFIG = {
  unlock_points: 50,
  overview_points: 10,
  free_limit: 3,
};

// 获取系统配置
export async function GET() {
  // 验证管理员身份
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_config')
      .select('*');

    if (error) {
      console.error('获取系统配置失败:', error);
      // 如果表不存在，返回默认值
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
      });
    }

    // 将数据转换为对象格式
    const config: Record<string, number> = { ...DEFAULT_CONFIG };
    data?.forEach((item: { key: string; value: string }) => {
      config[item.key] = parseInt(item.value, 10);
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
    });
  }
}

// 更新系统配置
export async function PUT(request: NextRequest) {
  // 验证管理员身份
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session?.value) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: '缺少配置数据' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 更新每个配置项
    const updates = Object.entries(config).map(async ([key, value]) => {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) {
        console.error(`更新配置 ${key} 失败:`, error);
        throw error;
      }
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: '配置已保存',
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
