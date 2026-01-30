-- 全站统计数据表
-- 用于存储全站的统计数据，如总生成次数等

CREATE TABLE IF NOT EXISTS site_stats (
  id SERIAL PRIMARY KEY,
  stat_key VARCHAR(50) UNIQUE NOT NULL,  -- 统计项名称
  stat_value BIGINT NOT NULL DEFAULT 0,  -- 统计值
  description TEXT,                       -- 描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化总生成次数（基础值 41512）
INSERT INTO site_stats (stat_key, stat_value, description)
VALUES ('total_generated', 41512, '命盘报告总生成次数')
ON CONFLICT (stat_key) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_site_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_site_stats_updated_at ON site_stats;
CREATE TRIGGER trigger_site_stats_updated_at
  BEFORE UPDATE ON site_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_site_stats_updated_at();

-- 创建原子增加函数（防止并发问题）
CREATE OR REPLACE FUNCTION increment_stat(p_stat_key VARCHAR(50), p_increment INTEGER DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  new_value BIGINT;
BEGIN
  UPDATE site_stats
  SET stat_value = stat_value + p_increment
  WHERE stat_key = p_stat_key
  RETURNING stat_value INTO new_value;

  RETURN new_value;
END;
$$ LANGUAGE plpgsql;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_site_stats_key ON site_stats(stat_key);
