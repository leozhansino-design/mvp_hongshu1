-- ============================================================
-- 支付系统数据库迁移脚本
-- 描述: 创建订单表、充值选项表，并扩展设备使用表
-- 日期: 2026-01-27
-- ============================================================

-- ============================================================
-- 1. 创建订单表 (orders)
--    用于记录所有充值订单信息，包括支付状态和退款信息
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,           -- 订单号: ORD_时间戳_随机数
  device_id       TEXT NOT NULL,              -- 设备ID
  amount          INTEGER NOT NULL,           -- 金额（分）
  points          INTEGER NOT NULL,           -- 积分数量
  pay_method      TEXT,                       -- 支付方式: wechat / alipay
  status          TEXT DEFAULT 'pending',     -- 订单状态: pending/paid/failed/refunded
  trade_no        TEXT,                       -- 第三方交易号
  refund_no       TEXT,                       -- 退款单号
  refund_amount   INTEGER,                    -- 退款金额（分）
  refund_time     TIMESTAMPTZ,               -- 退款时间
  created_at      TIMESTAMPTZ DEFAULT NOW(),  -- 创建时间
  paid_at         TIMESTAMPTZ,               -- 支付时间
  expire_at       TIMESTAMPTZ                -- 订单过期时间
);

-- 订单表索引：按设备ID查询
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);

-- 订单表索引：按订单状态查询
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 订单表索引：按创建时间倒序查询（用于订单列表分页）
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- 2. 创建充值选项表 (recharge_options)
--    用于配置前端展示的充值档位，支持动态排序和启用/禁用
-- ============================================================
CREATE TABLE IF NOT EXISTS recharge_options (
  id              SERIAL PRIMARY KEY,         -- 自增主键
  price           INTEGER NOT NULL,           -- 价格（分）
  points          INTEGER NOT NULL,           -- 积分数量
  sort_order      INTEGER DEFAULT 0,          -- 排序（升序排列）
  is_active       BOOLEAN DEFAULT true,       -- 是否启用
  created_at      TIMESTAMPTZ DEFAULT NOW(),  -- 创建时间
  updated_at      TIMESTAMPTZ DEFAULT NOW()   -- 更新时间
);

-- 插入默认充值档位数据
--   9.90元  -> 100积分
--   29.90元 -> 350积分
--   49.90元 -> 600积分
--   99.90元 -> 1300积分
--  199.90元 -> 2800积分
--  499.90元 -> 7500积分
INSERT INTO recharge_options (price, points, sort_order) VALUES
(990,   100,  1),
(2990,  350,  2),
(4990,  600,  3),
(9990,  1300, 4),
(19990, 2800, 5),
(49990, 7500, 6);

-- ============================================================
-- 3. 扩展设备使用表 (device_usage)
--    新增 total_paid 字段，记录设备累计充值金额（分）
-- ============================================================
ALTER TABLE device_usage ADD COLUMN IF NOT EXISTS total_paid INTEGER DEFAULT 0;

-- ============================================================
-- 4. 创建管理员操作日志表 (admin_logs)
--    记录退款、调整积分等管理员操作
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id              SERIAL PRIMARY KEY,           -- 自增主键
  action          TEXT NOT NULL,                 -- 操作类型: refund / adjust_points
  target_id       TEXT,                          -- 操作目标ID（订单号或设备ID）
  detail          JSONB,                         -- 操作详情
  created_at      TIMESTAMPTZ DEFAULT NOW()      -- 操作时间
);

-- 管理员日志索引：按创建时间倒序
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
