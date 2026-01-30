import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByPhone,
  createUser,
  getUserPasswordHash,
  hashPassword,
  verifyPassword,
  generateToken,
  updateLastLogin,
  saveUserSession,
  hashToken,
} from '@/lib/auth';
import {
  checkRegistrationEligibility,
  recordDeviceFingerprint,
  recordIpAddress,
} from '@/lib/antiAbuse';
import { isValidPhone, isValidPassword } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, fingerprint, deviceInfo } = body;

    // 验证必填字段
    if (!phone || !password || !fingerprint) {
      return NextResponse.json(
        { success: false, message: '请填写完整的登录信息' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, message: '请输入正确的手机号' },
        { status: 400 }
      );
    }

    // 验证密码格式
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, message: '密码长度需要6-20位' },
        { status: 400 }
      );
    }

    // 获取客户端IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // 检查用户是否存在
    const existingUser = await findUserByPhone(phone);

    if (existingUser) {
      // 用户存在，验证密码登录
      const storedHash = await getUserPasswordHash(phone);
      if (!storedHash) {
        return NextResponse.json(
          { success: false, message: '账号异常，请联系客服' },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(password, storedHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: '密码错误' },
          { status: 401 }
        );
      }

      // 登录成功
      await updateLastLogin(existingUser.id);

      // 记录设备和IP
      await recordDeviceFingerprint(fingerprint, ip, existingUser.id, deviceInfo);
      await recordIpAddress(ip, fingerprint, existingUser.id);

      // 生成token
      const token = generateToken(existingUser.id, existingUser.phone);
      const tokenHash = await hashToken(token);

      // 保存会话
      await saveUserSession(existingUser.id, tokenHash, deviceInfo || {}, ip);

      return NextResponse.json({
        success: true,
        message: '登录成功',
        user: existingUser,
        token,
        isNewUser: false,
      });
    } else {
      // 用户不存在，检查是否可以注册
      const eligibility = await checkRegistrationEligibility(fingerprint, ip);

      if (!eligibility.allowed) {
        return NextResponse.json(
          { success: false, message: eligibility.reason },
          { status: 403 }
        );
      }

      // 创建新用户
      const passwordHash = await hashPassword(password);
      const newUser = await createUser(phone, passwordHash, fingerprint);

      if (!newUser) {
        return NextResponse.json(
          { success: false, message: '注册失败，请稍后重试' },
          { status: 500 }
        );
      }

      // 如果设备已经使用过免费次数，新用户的免费次数设为1（表示已用完）
      if (eligibility.hasUsedFree) {
        // 更新用户的免费次数为已使用状态
        const { getSupabaseAdmin } = await import('@/lib/supabase');
        await getSupabaseAdmin()
          .from('users')
          .update({ free_used: 1, free_used_wealth: 1 })
          .eq('id', newUser.id);

        newUser.freeUsed = 1;
        newUser.freeUsedWealth = 1;
      }

      // 记录设备和IP（标记为注册）
      await recordDeviceFingerprint(fingerprint, ip, newUser.id, deviceInfo);
      await recordIpAddress(ip, fingerprint, newUser.id, true);

      // 生成token
      const token = generateToken(newUser.id, newUser.phone);
      const tokenHash = await hashToken(token);

      // 保存会话
      await saveUserSession(newUser.id, tokenHash, deviceInfo || {}, ip);

      return NextResponse.json({
        success: true,
        message: '注册成功',
        user: newUser,
        token,
        isNewUser: true,
      });
    }
  } catch (error) {
    console.error('Login/Register error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
