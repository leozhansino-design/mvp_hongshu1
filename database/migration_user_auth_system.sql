-- ============================================
-- 用户认证系统迁移脚本
-- 手机号+密码登录，防刷机制
-- ============================================

-- 先创建 result_cache 表（如果不存在）
CREATE TABLE IF NOT EXISTS result_cache (
  id              SERIAL PRIMARY KEY,
  cache_key       TEXT UNIQUE NOT NULL,
  device_id       TEXT NOT NULL,
  curve_mode      TEXT NOT NULL,
  is_paid         BOOLEAN DEFAULT FALSE,
  result_data     JSONB NOT NULL,
  birth_info      JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_result_cache_key ON result_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_result_cache_device_id ON result_cache(device_id);

-- 修改 users 表结构（添加手机号和密码字段）
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_used_wealth INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_paid INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS migrated_device_id TEXT;

-- 创建手机号索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================
-- 设备指纹表（防刷机制）
-- ============================================
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id              SERIAL PRIMARY KEY,
  fingerprint     TEXT UNIQUE NOT NULL,    -- 设备指纹哈希
  device_info     JSONB,                   -- 设备信息（浏览器、屏幕等）
  ip_addresses    TEXT[],                  -- 使用过的IP地址列表
  user_ids        UUID[],                  -- 关联的用户ID列表
  free_used       BOOLEAN DEFAULT FALSE,   -- 是否已使用过免费次数
  first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  is_blocked      BOOLEAN DEFAULT FALSE,   -- 是否被封禁
  block_reason    TEXT                     -- 封禁原因
);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_ip ON device_fingerprints USING GIN(ip_addresses);

-- ============================================
-- IP地址追踪表（防刷机制）
-- ============================================
CREATE TABLE IF NOT EXISTS ip_tracking (
  id              SERIAL PRIMARY KEY,
  ip_address      TEXT UNIQUE NOT NULL,    -- IP地址
  fingerprints    TEXT[],                  -- 关联的设备指纹列表
  user_ids        UUID[],                  -- 关联的用户ID列表
  registration_count INTEGER DEFAULT 0,    -- 注册次数
  free_usage_count INTEGER DEFAULT 0,      -- 免费使用次数
  first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  is_blocked      BOOLEAN DEFAULT FALSE,   -- 是否被封禁
  block_reason    TEXT                     -- 封禁原因
);

CREATE INDEX IF NOT EXISTS idx_ip_tracking_ip ON ip_tracking(ip_address);

-- ============================================
-- 用户会话表（JWT token管理）
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT UNIQUE NOT NULL,    -- JWT token哈希
  device_info     JSONB,                   -- 登录设备信息
  ip_address      TEXT,                    -- 登录IP
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  is_revoked      BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- ============================================
-- 结果缓存表修改（支持用户ID）
-- ============================================
ALTER TABLE result_cache ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_result_cache_user_id ON result_cache(user_id);

-- ============================================
-- 更新 points_log 表（确保支持用户关联）
-- ============================================
-- points_log 表已经有 user_id 字段

-- ============================================
-- 更新 usage_log 表（确保支持用户关联）
-- ============================================
-- usage_log 表已经有 user_id 字段

-- ============================================
-- 系统配置表（如果不存在则创建）
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id              SERIAL PRIMARY KEY,
  key             TEXT UNIQUE NOT NULL,
  value           JSONB NOT NULL,
  description     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_config (key, value, description) VALUES
  ('overview_points', '10', '概览消耗积分'),
  ('detailed_points', '200', '精批详解消耗积分'),
  ('free_overview_limit', '1', '免费概览次数限制'),
  ('free_wealth_limit', '1', '免费财富曲线次数限制'),
  ('recharge_options', '[
    {"price": 990, "points": 100, "label": "新手体验", "sort": 1},
    {"price": 1990, "points": 220, "label": "轻度用户", "sort": 2},
    {"price": 4990, "points": 600, "label": "主力档位", "sort": 3, "recommended": true},
    {"price": 9990, "points": 1300, "label": "高频用户", "sort": 4},
    {"price": 19990, "points": 2800, "label": "重度用户", "sort": 5},
    {"price": 49990, "points": 8000, "label": "VIP用户", "sort": 6}
  ]', '充值选项配置（价格单位：分）'),
  ('anti_abuse_max_registrations_per_ip', '3', '每个IP最大注册数'),
  ('anti_abuse_max_free_per_device', '1', '每个设备最大免费次数')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- RLS 策略
-- ============================================
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on device_fingerprints" ON device_fingerprints
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ip_tracking" ON ip_tracking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on user_sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on system_config" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 完成提示
-- ============================================
-- 用户认证系统迁移完成！
