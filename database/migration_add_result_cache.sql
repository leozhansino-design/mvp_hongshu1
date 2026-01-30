-- ============================================
-- 迁移脚本：添加结果缓存表
-- 用于存储相同设备+信息的测算结果，确保一致性
-- ============================================

-- 创建结果缓存表
CREATE TABLE IF NOT EXISTS result_cache (
  id              SERIAL PRIMARY KEY,
  cache_key       TEXT UNIQUE NOT NULL,      -- SHA256(deviceId + name + birthInfo + curveMode + isPaid)
  device_id       TEXT NOT NULL,             -- 设备ID
  curve_mode      TEXT NOT NULL,             -- 'life' 或 'wealth'
  is_paid         BOOLEAN DEFAULT FALSE,     -- 是否付费版本
  result_data     JSONB NOT NULL,            -- 完整的生成结果
  birth_info      JSONB,                     -- 用于调试的原始输入
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_result_cache_key ON result_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_result_cache_device_id ON result_cache(device_id);

-- 启用 RLS
ALTER TABLE result_cache ENABLE ROW LEVEL SECURITY;

-- 服务端策略
CREATE POLICY "Service role full access on result_cache" ON result_cache
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 完成提示
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本
