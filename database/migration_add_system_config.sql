-- ============================================
-- 系统配置表迁移
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_config (key, value, description) VALUES
  ('unlock_points', '50', '解锁详细版需要的积分'),
  ('overview_points', '10', '免费次数用完后，概览消耗的积分'),
  ('free_limit', '3', '每个设备每种曲线的免费次数')
ON CONFLICT (key) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_config_timestamp ON system_config;
CREATE TRIGGER trigger_update_system_config_timestamp
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_timestamp();
