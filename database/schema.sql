-- ============================================
-- 人生曲线 - Supabase 数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wechat_openid   TEXT UNIQUE,              -- 微信OpenID
  nickname        TEXT,                      -- 微信昵称
  avatar          TEXT,                      -- 微信头像
  points          INTEGER DEFAULT 0,         -- 当前积分
  total_recharged INTEGER DEFAULT 0,         -- 累计充值积分
  total_consumed  INTEGER DEFAULT 0,         -- 累计消费积分
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);

-- ============================================
-- 2. 卡密表 (keys)
-- ============================================
CREATE TABLE IF NOT EXISTS keys (
  id              SERIAL PRIMARY KEY,
  key_code        TEXT UNIQUE NOT NULL,      -- 卡密
  points          INTEGER NOT NULL,          -- 积分值
  status          TEXT DEFAULT 'unused',     -- unused/used/disabled
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  used_at         TIMESTAMPTZ,
  used_by         UUID REFERENCES users(id),
  used_by_device  TEXT,                      -- 使用者设备ID（未登录时）
  used_by_info    TEXT                       -- 使用者信息（备用）
);

-- 卡密表索引
CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status);
CREATE INDEX IF NOT EXISTS idx_keys_points ON keys(points);
CREATE INDEX IF NOT EXISTS idx_keys_key_code ON keys(key_code);

-- ============================================
-- 3. 设备使用记录表 (device_usage)
-- ============================================
CREATE TABLE IF NOT EXISTS device_usage (
  id              SERIAL PRIMARY KEY,
  device_id       TEXT UNIQUE NOT NULL,      -- 设备ID
  free_used       INTEGER DEFAULT 0,         -- 已用免费次数
  points          INTEGER DEFAULT 0,         -- 设备积分（未登录时）
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 设备表索引
CREATE INDEX IF NOT EXISTS idx_device_usage_device_id ON device_usage(device_id);

-- ============================================
-- 4. 积分记录表 (points_log)
-- ============================================
CREATE TABLE IF NOT EXISTS points_log (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  device_id       TEXT,                      -- 设备ID（未登录时）
  type            TEXT NOT NULL,             -- recharge/consume
  points          INTEGER NOT NULL,          -- 变动值（+充值/-消费）
  balance         INTEGER NOT NULL,          -- 变动后余额
  description     TEXT,                      -- 描述
  related_key     TEXT,                      -- 关联卡密（充值时）
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 积分记录索引
CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_device_id ON points_log(device_id);

-- ============================================
-- 5. 使用记录表 (usage_log)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_log (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id), -- 可空（未登录）
  device_id       TEXT,
  action          TEXT NOT NULL,             -- free_overview/paid_overview/detailed
  points_cost     INTEGER DEFAULT 0,
  birth_info      JSONB,                     -- 测试的生辰信息
  result_id       TEXT,                      -- 关联的结果ID
  curve_mode      TEXT DEFAULT 'life',       -- life/wealth
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 使用记录索引
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_device_id ON usage_log(device_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_created_at ON usage_log(created_at);

-- ============================================
-- 6. 管理员会话表 (admin_sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id              SERIAL PRIMARY KEY,
  session_token   TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL
);

-- ============================================
-- 7. RLS (行级安全策略)
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 服务端策略（允许服务端完全访问）
CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on keys" ON keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on device_usage" ON device_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on points_log" ON points_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on usage_log" ON usage_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on admin_sessions" ON admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 8. 函数：生成卡密
-- ============================================
CREATE OR REPLACE FUNCTION generate_key_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'LC-';
  i INTEGER;
  j INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    FOR j IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    IF i < 3 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. 函数：批量生成卡密
-- ============================================
CREATE OR REPLACE FUNCTION batch_generate_keys(
  p_points INTEGER,
  p_count INTEGER
)
RETURNS TABLE(key_code TEXT) AS $$
DECLARE
  i INTEGER;
  new_key TEXT;
BEGIN
  FOR i IN 1..p_count LOOP
    LOOP
      new_key := generate_key_code();
      -- 检查是否重复
      IF NOT EXISTS (SELECT 1 FROM keys WHERE keys.key_code = new_key) THEN
        EXIT;
      END IF;
    END LOOP;

    INSERT INTO keys (key_code, points, status)
    VALUES (new_key, p_points, 'unused');

    key_code := new_key;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. 视图：卡密统计
-- ============================================
CREATE OR REPLACE VIEW keys_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'unused') as unused_count,
  COUNT(*) FILTER (WHERE status = 'used') as used_count,
  COUNT(*) FILTER (WHERE status = 'disabled') as disabled_count,
  COUNT(*) as total_count,
  COALESCE(SUM(points) FILTER (WHERE status = 'used'), 0) as total_points_used,
  COALESCE(SUM(points) FILTER (WHERE status = 'unused'), 0) as total_points_unused,
  -- 按档位统计
  COUNT(*) FILTER (WHERE points = 10 AND status = 'unused') as unused_10,
  COUNT(*) FILTER (WHERE points = 10 AND status = 'used') as used_10,
  COUNT(*) FILTER (WHERE points = 200 AND status = 'unused') as unused_200,
  COUNT(*) FILTER (WHERE points = 200 AND status = 'used') as used_200,
  COUNT(*) FILTER (WHERE points = 1000 AND status = 'unused') as unused_1000,
  COUNT(*) FILTER (WHERE points = 1000 AND status = 'used') as used_1000
FROM keys;

-- ============================================
-- 完成提示
-- ============================================
-- 数据库初始化完成！
