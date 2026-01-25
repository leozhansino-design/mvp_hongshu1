import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '@/lib/supabase';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Dianzi123';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
    }

    // 创建会话
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('admin_sessions').insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });
    } catch {
      // 如果数据库不可用，仍然允许登录（开发模式）
      console.warn('Database not available, using local session');
    }

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: '登录失败' }, { status: 500 });
  }
}

