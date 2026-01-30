import { NextRequest, NextResponse } from 'next/server';
import { checkCanUseFree, hasDeviceUsedFree } from '@/lib/antiAbuse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, userId } = body;

    if (!fingerprint) {
      return NextResponse.json({
        allowed: false,
        reason: '无法识别设备',
      });
    }

    // 检查是否可以使用免费
    const result = await checkCanUseFree(fingerprint, userId);

    // 额外返回设备是否已使用过免费
    const deviceUsedFree = await hasDeviceUsedFree(fingerprint);

    return NextResponse.json({
      ...result,
      deviceUsedFree,
    });
  } catch (error) {
    console.error('Check abuse error:', error);
    return NextResponse.json({
      allowed: true, // 出错时默认允许
    });
  }
}
