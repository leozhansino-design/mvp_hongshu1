-- 测试产品系统迁移脚本
-- 包含测试产品表、题目表、测试结果表、卡密表

-- ============================================
-- 1. 测试产品表 (tests)
-- ============================================
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,        -- 如 'enneagram', 'life-curve'
  name VARCHAR(100) NOT NULL,              -- 如 '九型人格测试'
  subtitle VARCHAR(200),                   -- 如 '探索你的核心人格类型'
  description TEXT,                        -- 详细介绍
  icon VARCHAR(10),                        -- emoji图标
  cover_color VARCHAR(20),                 -- 卡片背景色 如 '#F5F0FF'
  question_count INTEGER,                  -- 题目数量
  duration VARCHAR(20),                    -- 预计时长 如 '15-20分钟'
  price_basic INTEGER DEFAULT 100,         -- 基础版价格（分）如 100 = 1元
  price_full INTEGER DEFAULT 1990,         -- 完整版价格（分）如 1990 = 19.9元
  category VARCHAR(50),                    -- 分类：personality/career/love/fun
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取测试产品
CREATE POLICY "Allow public read tests" ON tests
  FOR SELECT USING (true);

-- 允许 service role 完全访问
CREATE POLICY "Allow service role full access to tests" ON tests
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 2. 测试题目表 (questions)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_slug VARCHAR(50) NOT NULL REFERENCES tests(slug) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT,                           -- 选项A文字
  option_b TEXT,                           -- 选项B文字
  score_mapping JSONB,                     -- 计分映射
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_slug, question_number)
);

-- 启用 RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取题目
CREATE POLICY "Allow public read questions" ON questions
  FOR SELECT USING (true);

-- 允许 service role 完全访问
CREATE POLICY "Allow service role full access to questions" ON questions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 3. 用户测试记录表 (test_results)
-- ============================================
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id VARCHAR(100),                  -- 设备ID
  user_id UUID,                            -- 用户ID（可选）
  test_slug VARCHAR(50) NOT NULL REFERENCES tests(slug),
  answers JSONB,                           -- 用户答案
  scores JSONB,                            -- 各维度得分
  result_type VARCHAR(50),                 -- 结果类型 如 'type4'
  result_subtype VARCHAR(50),              -- 子类型/侧翼
  report_level VARCHAR(10) DEFAULT 'basic', -- basic/full
  report_data JSONB,                       -- 生成的报告数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_results_device_id ON test_results(device_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_slug ON test_results(test_slug);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);

-- 启用 RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- 允许 service role 完全访问
CREATE POLICY "Allow service role full access to test_results" ON test_results
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 4. 卡密表 (redemption_codes)
-- ============================================
CREATE TABLE IF NOT EXISTS redemption_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,        -- 卡密码
  test_slug VARCHAR(50) REFERENCES tests(slug), -- 绑定的测试
  report_level VARCHAR(10) NOT NULL,       -- basic/full
  is_used BOOLEAN DEFAULT false,
  used_by_device VARCHAR(100),             -- 使用的设备ID
  used_by_user UUID,                       -- 使用的用户ID
  used_at TIMESTAMPTZ,
  batch_name VARCHAR(100),                 -- 批次名 如 '拼多多-202502'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_test_slug ON redemption_codes(test_slug);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_batch_name ON redemption_codes(batch_name);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_is_used ON redemption_codes(is_used);

-- 启用 RLS
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;

-- 允许 service role 完全访问
CREATE POLICY "Allow service role full access to redemption_codes" ON redemption_codes
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 5. 测试订单表 (test_orders)
-- ============================================
CREATE TABLE IF NOT EXISTS test_orders (
  id VARCHAR(50) PRIMARY KEY,              -- 订单号
  device_id VARCHAR(100) NOT NULL,
  user_id UUID,
  test_slug VARCHAR(50) NOT NULL REFERENCES tests(slug),
  report_level VARCHAR(10) NOT NULL,       -- basic/full
  amount INTEGER NOT NULL,                 -- 金额（分）
  pay_method VARCHAR(20),                  -- wechat/alipay
  status VARCHAR(20) DEFAULT 'pending',    -- pending/paid/failed/refunded
  trade_no VARCHAR(100),                   -- 第三方交易号
  test_result_id UUID REFERENCES test_results(id), -- 关联的测试结果
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_orders_device_id ON test_orders(device_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_status ON test_orders(status);
CREATE INDEX IF NOT EXISTS idx_test_orders_test_slug ON test_orders(test_slug);

-- 启用 RLS
ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;

-- 允许 service role 完全访问
CREATE POLICY "Allow service role full access to test_orders" ON test_orders
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 6. 初始化测试产品数据
-- ============================================
INSERT INTO tests (slug, name, subtitle, description, icon, cover_color, question_count, duration, price_basic, price_full, category, is_active, is_new, sort_order) VALUES
('life-curve', '人生曲线', '探索您的人生发展趋势', '基于八字命理，分析您一生中的运势起伏，找出人生高峰和低谷时期。', '🔮', '#FFF5F5', NULL, '3分钟', 100, 1990, 'fun', true, false, 1),
('wealth-curve', '财富曲线', '预测您的财富发展走势', '分析您的财运走势，找出财富增长的关键时期和需要注意的阶段。', '💰', '#FFFFF0', NULL, '3分钟', 100, 1990, 'fun', true, false, 2),
('enneagram', '九型人格', '探索你的核心人格类型', '九型人格将人的性格分为九种核心类型，揭示你内在最深层的价值观、恐惧和渴望。通过144道题目的测试，发现真实的自己。', '🧠', '#F5F0FF', 144, '15-20分钟', 100, 1990, 'personality', true, true, 3),
('mbti', 'MBTI', '16型人格·职业性格匹配', '世界上最流行的性格测试，帮助你了解自己的性格类型和最适合的职业方向。', '🎯', '#F0F5FF', 93, '10-15分钟', 100, 1990, 'career', false, false, 4),
('disc', 'DISC', '职场沟通与领导力风格', '了解你在职场中的沟通方式和领导风格，提升团队协作效率。', '📊', '#F0FFF5', 40, '8-10分钟', 100, 1990, 'career', false, false, 5),
('love-language', '爱情语言', '发现你表达爱的方式', '了解你表达和接收爱的方式，改善亲密关系。', '❤️', '#FFF0F5', 30, '5-8分钟', 100, 1990, 'love', false, false, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  cover_color = EXCLUDED.cover_color,
  question_count = EXCLUDED.question_count,
  duration = EXCLUDED.duration,
  price_basic = EXCLUDED.price_basic,
  price_full = EXCLUDED.price_full,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  is_new = EXCLUDED.is_new,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
