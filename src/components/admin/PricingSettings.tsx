'use client';

import { useState, useEffect } from 'react';

interface ProductPrice {
  slug: string;
  name: string;
  icon: string;
  basicPrice: number;  // 分
  fullPrice: number;   // 分
}

// 默认价格配置
const DEFAULT_PRICES: ProductPrice[] = [
  { slug: 'life-curve', name: '人生曲线', icon: '🔮', basicPrice: 198, fullPrice: 1990 },
  { slug: 'wealth-curve', name: '财富曲线', icon: '💰', basicPrice: 198, fullPrice: 1990 },
  { slug: 'enneagram', name: '九型人格', icon: '🧠', basicPrice: 198, fullPrice: 1990 },
];

const PRICE_STORAGE_KEY = 'admin_product_prices';

export default function PricingSettings() {
  const [prices, setPrices] = useState<ProductPrice[]>(DEFAULT_PRICES);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [tempBasicPrice, setTempBasicPrice] = useState('');
  const [tempFullPrice, setTempFullPrice] = useState('');
  const [saved, setSaved] = useState(false);

  // 从本地存储加载价格
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRICE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrices(parsed);
      }
    } catch (e) {
      console.error('加载价格配置失败', e);
    }
  }, []);

  // 保存价格到本地存储
  const savePrices = (newPrices: ProductPrice[]) => {
    localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(newPrices));
    setPrices(newPrices);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 开始编辑
  const startEdit = (product: ProductPrice) => {
    setEditingSlug(product.slug);
    setTempBasicPrice((product.basicPrice / 100).toString());
    setTempFullPrice((product.fullPrice / 100).toString());
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingSlug) return;

    const basicPrice = Math.round(parseFloat(tempBasicPrice || '0') * 100);
    const fullPrice = Math.round(parseFloat(tempFullPrice || '0') * 100);

    if (isNaN(basicPrice) || isNaN(fullPrice) || basicPrice < 0 || fullPrice < 0) {
      alert('请输入有效的价格');
      return;
    }

    const newPrices = prices.map(p => {
      if (p.slug === editingSlug) {
        return { ...p, basicPrice, fullPrice };
      }
      return p;
    });

    savePrices(newPrices);
    setEditingSlug(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingSlug(null);
    setTempBasicPrice('');
    setTempFullPrice('');
  };

  // 重置为默认价格
  const resetToDefault = () => {
    if (confirm('确定要重置为默认价格吗？')) {
      savePrices(DEFAULT_PRICES);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">产品价格设置</h2>
          <p className="text-gray-400 text-sm mt-1">设置各测试产品的基础版和完整版价格</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-400 text-sm">已保存</span>
          )}
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            重置默认
          </button>
        </div>
      </div>

      {/* 价格卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prices.map(product => (
          <div
            key={product.slug}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            {/* 产品标题 */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{product.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <p className="text-gray-500 text-xs">{product.slug}</p>
              </div>
            </div>

            {editingSlug === product.slug ? (
              // 编辑模式
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">基础版价格（元）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempBasicPrice}
                    onChange={(e) => setTempBasicPrice(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">完整版价格（元）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempFullPrice}
                    onChange={(e) => setTempFullPrice(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              // 显示模式
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">基础版</span>
                  <span className="text-2xl font-bold text-blue-400">
                    ¥{formatPrice(product.basicPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">完整版</span>
                  <span className="text-2xl font-bold text-purple-400">
                    ¥{formatPrice(product.fullPrice)}
                  </span>
                </div>
                <button
                  onClick={() => startEdit(product)}
                  className="w-full py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors mt-4"
                >
                  编辑价格
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 说明 */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-gray-300 font-medium mb-2">说明</h4>
        <ul className="text-gray-500 text-sm space-y-1">
          <li>• 卡密仅支持兑换基础版，完整版需要用户直接在线购买</li>
          <li>• 价格修改后会立即生效，但不会影响已支付的订单</li>
          <li>• 建议基础版定价较低以吸引用户，完整版提供更多价值</li>
        </ul>
      </div>
    </div>
  );
}
