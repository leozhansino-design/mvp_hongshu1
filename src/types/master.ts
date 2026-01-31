// 大师测算相关类型
// Master Consultation Types

export interface Master {
  id: string;
  name: string;
  avatar?: string;
  price: number; // 分
  wordCount: number;
  followUps: number; // -1 表示不限
  years?: number;
  intro?: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 数据库返回的大师数据（snake_case）
export interface MasterDB {
  id: string;
  name: string;
  avatar?: string;
  price: number;
  word_count: number;
  follow_ups: number;
  years?: number;
  intro?: string;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 转换数据库数据到前端格式
export function dbToMaster(db: MasterDB): Master {
  return {
    id: db.id,
    name: db.name,
    avatar: db.avatar,
    price: db.price,
    wordCount: db.word_count,
    followUps: db.follow_ups,
    years: db.years,
    intro: db.intro,
    tags: db.tags || [],
    isActive: db.is_active,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// 咨询订单状态
export type ConsultationStatus = 'pending' | 'completed' | 'refunded';

// 咨询关注重点类型
export type FocusHint = 'career' | 'relationship' | 'future' | 'health';

// 根据年龄和性别获取关注重点
export function getFocusHint(birthYear: number, gender: 'male' | 'female'): { type: FocusHint; label: string; description: string } {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // 小孩（18岁以下）：看前程
  if (age < 18) {
    return {
      type: 'future',
      label: '前程发展',
      description: '学业运势、未来发展方向、天赋潜能'
    };
  }

  // 老人（60岁以上）：看健康
  if (age >= 60) {
    return {
      type: 'health',
      label: '健康运势',
      description: '身体健康、养生调理、晚年福运'
    };
  }

  // 成年人根据性别
  if (gender === 'male') {
    // 男人看事业
    return {
      type: 'career',
      label: '事业财运',
      description: '事业发展、财运走势、贵人运势'
    };
  } else {
    // 女人看感情
    return {
      type: 'relationship',
      label: '感情婚姻',
      description: '感情运势、婚姻家庭、桃花运势'
    };
  }
}

// 咨询订单
export interface Consultation {
  id: string;
  userId: string;
  userPhone?: string;
  masterId: string;
  masterName?: string;
  price: number;
  wordCount?: number;
  followUps?: number;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthTime?: string;
  gender?: string;
  name?: string;
  question?: string;
  focusHint?: string;  // 关注重点提示
  payMethod?: string;
  tradeNo?: string;
  status: ConsultationStatus;
  followUpRecords: FollowUpRecord[];
  followUpUsed: number;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  refundedAt?: string;
}

// 追问记录
export interface FollowUpRecord {
  question: string;
  answer: string;
  time: string;
}

// 数据库返回的咨询订单数据
export interface ConsultationDB {
  id: string;
  user_id: string;
  user_phone?: string;
  master_id: string;
  master_name?: string;
  price: number;
  word_count?: number;
  follow_ups?: number;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_time?: string;
  gender?: string;
  name?: string;
  question?: string;
  focus_hint?: string;  // 关注重点提示
  pay_method?: string;
  trade_no?: string;
  status: ConsultationStatus;
  follow_up_records: FollowUpRecord[];
  follow_up_used: number;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
  refunded_at?: string;
}

// 转换数据库数据到前端格式
export function dbToConsultation(db: ConsultationDB): Consultation {
  return {
    id: db.id,
    userId: db.user_id,
    userPhone: db.user_phone,
    masterId: db.master_id,
    masterName: db.master_name,
    price: db.price,
    wordCount: db.word_count,
    followUps: db.follow_ups,
    birthYear: db.birth_year,
    birthMonth: db.birth_month,
    birthDay: db.birth_day,
    birthTime: db.birth_time,
    gender: db.gender,
    name: db.name,
    question: db.question,
    focusHint: db.focus_hint,
    payMethod: db.pay_method,
    tradeNo: db.trade_no,
    status: db.status,
    followUpRecords: db.follow_up_records || [],
    followUpUsed: db.follow_up_used || 0,
    createdAt: db.created_at,
    paidAt: db.paid_at,
    completedAt: db.completed_at,
    refundedAt: db.refunded_at,
  };
}

// 创建咨询订单请求
export interface CreateConsultationRequest {
  masterId: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthTime: string;
  gender: 'male' | 'female';
  name?: string;
  question: string;
  payMethod: 'wechat' | 'alipay';
}

// 创建咨询订单响应
export interface CreateConsultationResponse {
  success: boolean;
  message?: string;
  consultationId?: string;
  paymentUrl?: string;
  qrCode?: string;
}

// 大师列表筛选参数
export interface MasterListParams {
  includeInactive?: boolean;
}

// 咨询订单列表筛选参数
export interface ConsultationListParams {
  status?: ConsultationStatus;
  masterId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// 格式化价格（分转元）
export function formatPrice(priceInCents: number): string {
  const yuan = priceInCents / 100;
  return yuan % 1 === 0 ? `${yuan}` : yuan.toFixed(1);
}

// 格式化追问次数
export function formatFollowUps(count: number): string {
  if (count === -1) return '不限';
  if (count === 0) return '无';
  return `${count}次`;
}

// 获取状态标签
export function getStatusLabel(status: ConsultationStatus): string {
  const labels: Record<ConsultationStatus, string> = {
    pending: '待处理',
    completed: '已完成',
    refunded: '已退款',
  };
  return labels[status] || status;
}

// 获取状态颜色
export function getStatusColor(status: ConsultationStatus): string {
  const colors: Record<ConsultationStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    completed: 'text-green-400 bg-green-400/10',
    refunded: 'text-red-400 bg-red-400/10',
  };
  return colors[status] || 'text-gray-400 bg-gray-400/10';
}

// 生成订单号
export function generateConsultationId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MS_${dateStr}_${random}`;
}
