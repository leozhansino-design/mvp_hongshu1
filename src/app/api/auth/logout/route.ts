import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeader, revokeUserSession, hashToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = getTokenFromHeader(authHeader);

    if (token) {
      const tokenHash = await hashToken(token);
      await revokeUserSession(tokenHash);
    }

    return NextResponse.json({
      success: true,
      message: '已退出登录',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: true,
      message: '已退出登录',
    });
  }
}
