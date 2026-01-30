import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedResult,
  saveCachedResult,
  generateCacheKey,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - 检查缓存
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const name = searchParams.get('name');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const hour = searchParams.get('hour');
    const gender = searchParams.get('gender');
    const isLunar = searchParams.get('isLunar') === 'true';
    const curveMode = searchParams.get('curveMode') as 'life' | 'wealth';
    const isPaid = searchParams.get('isPaid') === 'true';

    if (!deviceId || !name || !year || !month || !day || !hour || !gender || !curveMode) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const cacheKey = generateCacheKey({
      deviceId,
      name,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      gender,
      isLunar,
      curveMode,
      isPaid,
    });

    const cached = await getCachedResult(cacheKey);

    if (cached) {
      return NextResponse.json({
        found: true,
        cacheKey,
        resultData: cached.result_data,
      });
    }

    return NextResponse.json({
      found: false,
      cacheKey,
    });
  } catch (error) {
    console.error('Cache check error:', error);
    return NextResponse.json({ error: '检查缓存失败' }, { status: 500 });
  }
}

// POST - 保存缓存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cacheKey, deviceId, curveMode, isPaid, resultData, birthInfo } = body;

    if (!cacheKey || !deviceId || !curveMode || !resultData) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    await saveCachedResult({
      cacheKey,
      deviceId,
      curveMode,
      isPaid: isPaid || false,
      resultData,
      birthInfo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cache save error:', error);
    return NextResponse.json({ error: '保存缓存失败' }, { status: 500 });
  }
}
