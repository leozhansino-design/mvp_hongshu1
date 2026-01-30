# 人生曲线 / 财富曲线 项目总结

## 项目概述

这是一个基于八字命理的人生曲线和财富曲线预测应用，用户输入出生信息后可以生成命盘报告，查看人生各阶段的运势走向和财富趋势。

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS + Framer Motion
- **数据库**: Supabase (PostgreSQL)
- **图表**: Recharts
- **支付**: 微信支付 + 支付宝
- **其他**: TypeScript, JWT认证, html2canvas (分享图生成)

## 核心功能

### 1. 命盘报告生成
- **人生曲线**: 基于八字命理计算百年运势走向
- **财富曲线**: 预测财富积累趋势和高光/低谷年份
- 支持农历/公历输入
- 免费版和完整版（200积分解锁）

### 2. 用户系统
- 手机号+密码登录（新用户自动注册）
- 设备指纹识别防刷
- 积分系统（充值/消费）
- 每种曲线模式1次免费体验

### 3. 支付功能
- 微信支付（Native扫码）
- 支付宝支付
- 充值选项配置（后台可调）
- 订单管理

### 4. 大师测算
- 付费咨询功能
- 大师管理（后台添加/编辑）
- 咨询订单管理
- 退款功能

### 5. 管理后台
- 路径: `/admin`
- 功能:
  - 数据统计（收入、用户、订单）
  - 订单管理
  - 用户/设备管理
  - 大师管理
  - 咨询订单管理
  - 系统设置

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   │   ├── admin/         # 管理后台 API
│   │   ├── auth/          # 认证相关 API
│   │   ├── consultations/ # 咨询订单 API
│   │   ├── masters/       # 大师相关 API
│   │   ├── pay/           # 支付相关 API
│   │   └── stats/         # 统计 API
│   ├── admin/             # 管理后台页面
│   ├── masters/           # 大师测算页面
│   ├── my/                # 我的报告页面
│   └── result/[id]/       # 报告详情页面
├── components/            # React 组件
│   ├── admin/             # 管理后台组件
│   └── ...                # 通用组件
├── contexts/              # React Context
│   └── AuthContext.tsx    # 全局认证状态
├── lib/                   # 工具库
│   ├── bazi.ts           # 八字计算
│   ├── supabase.ts       # 数据库操作
│   ├── wechat-pay.ts     # 微信支付
│   └── alipay.ts         # 支付宝支付
├── services/              # 业务服务
│   ├── api.ts            # AI 报告生成
│   ├── auth.ts           # 认证服务
│   └── storage.ts        # 本地存储
└── types/                 # TypeScript 类型定义
```

## 数据库表

- `users` - 用户表
- `device_usage` - 设备使用记录
- `orders` - 充值订单
- `points_logs` - 积分日志
- `usage_logs` - 使用日志
- `result_cache` - 结果缓存
- `recharge_options` - 充值选项配置
- `masters` - 大师列表
- `consultations` - 咨询订单
- `site_stats` - 全站统计

## 定价策略

### 解锁价格
- 完整版报告: 200积分（约¥20）

### 充值选项
- ¥9.9 → 100积分
- ¥19.9 → 220积分
- ¥49.9 → 600积分
- ¥99.9 → 1300积分
- ¥199.9 → 2800积分
- ¥499.9 → 8000积分

## 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI API
OPENAI_API_KEY=
OPENAI_BASE_URL=

# 微信支付
WECHAT_MCH_ID=
WECHAT_SERIAL_NO=
WECHAT_API_KEY_V3=
WECHAT_PRIVATE_KEY=
WECHAT_NOTIFY_URL=

# 支付宝
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=
```

## 部署

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 最近更新

- 解锁价格调整为200积分
- 分享图片用户名脱敏（隐私保护）
- 删除MVP演示版相关文字
- 修复我的报告页面曲线类型显示
- 修复登录状态同步问题
- 添加生成次数数据库统计（基础值41512）
- 大师测算入口移至导航栏左侧
