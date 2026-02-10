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

## 2026-02-01 更新记录

### UI主题优化 - Apple极简白色风格
- 整体界面从神秘紫金风格改为Apple极简白色主题
- 更新`result/[id]/page.tsx`：白色背景、浅灰卡片、Apple蓝色强调色
- 分享按钮改为蓝色背景，可见性更高
- 使用`apple-card`样式替代原有的`mystic-card`

### 加载界面AI化
- **AnalysisLoader.tsx**：加载消息改为AI/大数据相关描述
  - "AI 正在解析命盘信息"
  - "大数据匹配相似命格"
  - "神经网络计算运势趋势"
  - "Gemini 3 Pro 生成专属分析"
- **UnlockLoader.tsx**：解锁加载消息同步更新为AI风格
- 将所有"GPT-4"引用改为"Gemini 3 Pro"

### 分数与描述匹配问题修复
- **问题**：图表显示"人生巅峰"但分数只有30分，描述与分数严重不符
- **解决方案**：
  1. **LifeCurveChart.tsx**：新增`getScoreDescription()`函数，根据实际分数生成匹配描述
     - 80+分："运势高涨，大吉之年"
     - 70-79分："运势上升，渐入佳境"
     - 60-69分："运势平稳，稳中有进"
     - 50-59分："运势平淡，宜守不宜攻"
     - 40-49分："运势低迷，需谨慎行事"
     - 40分以下："运势受阻，宜韬光养晦"
  2. **api.ts**：新增`validateAndFixChartPoints<T>()`泛型函数
     - 自动检测并修复分数与描述不匹配的问题
     - 高分词汇（巅峰、高光等）配低分时自动修正
     - 低分词汇（低迷、坎坷等）配高分时自动修正

### chartPoints分数范围约束
- **问题**：summaryScore为62分时，chartPoints却出现95-100的高分点，不合理
- **解决方案**：
  - chartPoints分数约束为 summaryScore ± 20 范围内
  - 例如：summaryScore=62 → chartPoints应在42-82之间
  - 在`api.ts`的`validateAndFixChartPoints()`中实现服务端校验
  - 更新`constants.ts`中的prompt，明确要求AI遵守此规则

### 直播页面JSX语法错误修复
- **问题**：构建失败，报错"Unterminated regexp literal"
- **原因**：多处div元素未正确闭合，导致JSX结构不平衡
- **修复位置**：
  1. "人生高光时刻"区块（约416行）：缺少`</div></div>`
  2. "财富高光"区块（约440行）：缺少`</div></div>`
  3. "综合总评"区块（约497行）：未闭合就开始了"财富分析"区块
- 共有115个`<div>`开标签但只有114个`</div>`闭标签，修复后平衡

### 直播页面导出图片功能修复
- **问题**：点击"导出图片"按钮没有反应
- **原因**：`shareRef`和`wealthShareRef`已声明但未绑定到任何JSX元素
  - `handleShare`函数检查`if (!ref) return;`直接返回
- **对比**：
  - Result页面：有隐藏分享区域`ref={shareRef}`（positioned off-screen）
  - Cele页面：`ref={shareRef}`绑定到可见的结果容器
  - Live页面：refs未绑定到任何元素
- **解决方案**：
  - 添加`maskName()`函数用于隐私保护
  - 添加人生曲线分享图隐藏区域（白色主题）
  - 添加财富曲线分享图隐藏区域（深色金色主题）
  - 两者都使用`fixed -left-[9999px]`定位在屏幕外
