/**
 * 获取大师列表接口
 * GET /api/masters
 */

import { NextResponse } from 'next/server';
import { getMasters } from '@/lib/supabase';
import { dbToMaster } from '@/types/master';

export async function GET() {
  try {
    const mastersDB = await getMasters(false); // 只获取上架的
    const masters = mastersDB.map(dbToMaster);

    return NextResponse.json({
      success: true,
      masters,
    });
  } catch (error) {
    console.error('Get masters error:', error);

    // 返回默认大师列表作为降级方案
    return NextResponse.json({
      success: true,
      masters: [
        {
          id: 'master_001',
          name: '小灵',
          price: 2990,
          wordCount: 300,
          followUps: 0,
          years: 3,
          intro: '用心解答每一个问题',
          tags: ['新人推荐'],
          isActive: true,
          sortOrder: 1,
        },
        {
          id: 'master_002',
          name: '玄明居士',
          price: 6800,
          wordCount: 500,
          followUps: 1,
          years: 18,
          intro: '命理不是宿命，而是认识自己的工具',
          tags: ['好评最多'],
          isActive: true,
          sortOrder: 2,
        },
        {
          id: 'master_003',
          name: '云山道长',
          price: 12800,
          wordCount: 800,
          followUps: 2,
          years: 25,
          intro: '顺势而为，择时而动',
          tags: [],
          isActive: true,
          sortOrder: 3,
        },
        {
          id: 'master_004',
          name: '静心师傅',
          price: 19800,
          wordCount: 1200,
          followUps: 3,
          years: 15,
          intro: '缘分天定，但也需要用心经营',
          tags: [],
          isActive: true,
          sortOrder: 4,
        },
        {
          id: 'master_005',
          name: '天机真人',
          price: 29800,
          wordCount: 1500,
          followUps: 5,
          years: 30,
          intro: '洞察天机，指引迷津',
          tags: [],
          isActive: true,
          sortOrder: 5,
        },
        {
          id: 'master_006',
          name: '无极上师',
          price: 59800,
          wordCount: 2000,
          followUps: -1,
          years: 40,
          intro: '大道至简，顺应自然',
          tags: [],
          isActive: true,
          sortOrder: 6,
        },
      ],
    });
  }
}
