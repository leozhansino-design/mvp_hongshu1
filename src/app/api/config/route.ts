import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 默认配置值
const DEFAULT_CONFIG = {
  unlock_points: 50,
  overview_points: 10,
  free_limit: 3,
};

// 获取公共系统配置
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value')
      .in('key', ['unlock_points', 'overview_points', 'free_limit']);

    if (error) {
      // 如果表不存在或查询失败，返回默认值
      return NextResponse.json({
        success: true,
        config: DEFAULT_CONFIG,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60', // 缓存1分钟
        },
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
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 缓存1分钟
      },
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
    });
  }
}
