-- 大师测算功能数据库迁移
-- Master Consultation Feature Database Migration

-- =====================================================
-- 1. 大师表 (Masters Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS masters (
  id              TEXT PRIMARY KEY,        -- 大师ID: master_xxxxx
  name            TEXT NOT NULL,           -- 名称
  avatar          TEXT,                    -- 头像URL
  price           INTEGER NOT NULL,        -- 价格（分）
  word_count      INTEGER NOT NULL,        -- 报告字数
  follow_ups      INTEGER DEFAULT 0,       -- 追问次数（-1=不限）
  years           INTEGER,                 -- 从业年限
  intro           TEXT,                    -- 简介/格言
  tags            TEXT[] DEFAULT '{}',     -- 标签：新人推荐/好评最多/限时优惠
  is_active       BOOLEAN DEFAULT true,    -- 是否上架
  sort_order      INTEGER DEFAULT 0,       -- 排序（越小越前）
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 默认大师数据
INSERT INTO masters (id, name, price, word_count, follow_ups, years, intro, tags, sort_order) VALUES
('master_001', '小灵', 2990, 300, 0, 3, '用心解答每一个问题', ARRAY['新人推荐'], 1),
('master_002', '玄明居士', 6800, 500, 1, 18, '命理不是宿命，而是认识自己的工具', ARRAY['好评最多'], 2),
('master_003', '云山道长', 12800, 800, 2, 25, '顺势而为，择时而动', '{}', 3),
('master_004', '静心师傅', 19800, 1200, 3, 15, '缘分天定，但也需要用心经营', '{}', 4),
('master_005', '天机真人', 29800, 1500, 5, 30, '洞察天机，指引迷津', '{}', 5),
('master_006', '无极上师', 59800, 2000, -1, 40, '大道至简，顺应自然', '{}', 6)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. 咨询订单表 (Consultations Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS consultations (
  id              TEXT PRIMARY KEY,        -- 订单号: MS_日期_随机
  user_id         TEXT NOT NULL,           -- 用户ID
  user_phone      TEXT,                    -- 用户手机号
  master_id       TEXT NOT NULL,           -- 大师ID
  master_name     TEXT,                    -- 大师名称（冗余，方便显示）

  price           INTEGER NOT NULL,        -- 支付金额（分）
  word_count      INTEGER,                 -- 报告字数
  follow_ups      INTEGER,                 -- 追问次数

  -- 用户提交信息
  birth_year      INTEGER,
  birth_month     INTEGER,
  birth_day       INTEGER,
  birth_time      TEXT,                    -- 如 "10:30"
  gender          TEXT,                    -- male/female
  name            TEXT,                    -- 用户姓名
  question        TEXT,                    -- 用户问题（500字内）

  -- 支付信息
  pay_method      TEXT,                    -- wechat/alipay
  trade_no        TEXT,                    -- 第三方交易号

  -- 状态
  status          TEXT DEFAULT 'pending',  -- pending(待处理)/completed(已完成)/refunded(已退款)

  -- 追问记录（JSON数组）
  follow_up_records JSONB DEFAULT '[]',    -- [{question: "", answer: "", time: ""}]
  follow_up_used  INTEGER DEFAULT 0,       -- 已用追问次数

  -- 时间
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at         TIMESTAMP WITH TIME ZONE,
  completed_at    TIMESTAMP WITH TIME ZONE,
  refunded_at     TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_master FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_master ON consultations(master_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at DESC);

-- =====================================================
-- 3. 更新时间触发器
-- =====================================================

-- 大师表更新时间触发器
CREATE OR REPLACE FUNCTION update_masters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_masters_updated_at ON masters;
CREATE TRIGGER trigger_masters_updated_at
  BEFORE UPDATE ON masters
  FOR EACH ROW
  EXECUTE FUNCTION update_masters_updated_at();

-- =====================================================
-- 4. RLS策略 (Row Level Security)
-- =====================================================

-- 启用RLS
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Masters表策略 - 公开读取上架的大师
CREATE POLICY masters_select_active ON masters
  FOR SELECT USING (is_active = true);

-- 允许service role完全访问
CREATE POLICY masters_service_all ON masters
  FOR ALL USING (auth.role() = 'service_role');

-- Consultations表策略 - 用户只能查看自己的订单
CREATE POLICY consultations_select_own ON consultations
  FOR SELECT USING (user_id = auth.uid()::text);

-- 允许service role完全访问
CREATE POLICY consultations_service_all ON consultations
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. 系统配置 - 公众号二维码
-- =====================================================

INSERT INTO system_config (key, value, description) VALUES
('wechat_qrcode_url', '"/images/wechat-qrcode.png"', '公众号二维码图片URL'),
('wechat_account_name', '"人生曲线"', '公众号名称'),
('consultation_reply_hours', '24', '承诺回复时间（小时）')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
