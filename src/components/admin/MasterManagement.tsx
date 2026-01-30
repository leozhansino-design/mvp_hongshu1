'use client';

import { useState, useEffect, useRef } from 'react';
import { Master, formatPrice, formatFollowUps } from '@/types/master';

// 裁剪并压缩头像图片
async function cropAndResizeImage(file: File, size: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        // 计算裁剪参数，取中心正方形区域
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        // 设置输出尺寸
        canvas.width = size;
        canvas.height = size;

        // 裁剪并缩放
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // 转为 base64，使用较高质量
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export default function MasterManagement() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state (移除了 sortOrder，添加了 avatar)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    wordCount: '',
    followUps: '0',
    years: '',
    intro: '',
    tags: [] as string[],
    avatar: '', // base64 头像
  });

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const response = await fetch('/api/admin/masters');
      const data = await response.json();
      if (data.success) {
        setMasters(data.masters);
      }
    } catch (error) {
      console.error('Failed to fetch masters:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMaster(null);
    setFormData({
      name: '',
      price: '',
      wordCount: '',
      followUps: '0',
      years: '',
      intro: '',
      tags: [],
      avatar: '',
    });
    setShowModal(true);
  };

  const openEditModal = (master: Master) => {
    setEditingMaster(master);
    setFormData({
      name: master.name,
      price: (master.price / 100).toString(),
      wordCount: master.wordCount.toString(),
      followUps: master.followUps.toString(),
      years: master.years?.toString() || '',
      intro: master.intro || '',
      tags: master.tags || [],
      avatar: (master as Master & { avatar?: string }).avatar || '',
    });
    setShowModal(true);
  };

  // 处理头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await cropAndResizeImage(file, 200);
      setFormData(prev => ({ ...prev, avatar: base64 }));
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('头像处理失败，请重试');
    } finally {
      setUploadingAvatar(false);
      // 清空文件输入，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        wordCount: parseInt(formData.wordCount),
        followUps: parseInt(formData.followUps),
        years: formData.years ? parseInt(formData.years) : undefined,
        intro: formData.intro || undefined,
        tags: formData.tags,
        avatar: formData.avatar || undefined, // 头像 base64
      };

      let response;
      if (editingMaster) {
        response = await fetch(`/api/admin/masters/${editingMaster.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/admin/masters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        fetchMasters();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save master:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (master: Master) => {
    try {
      const response = await fetch(`/api/admin/masters/${master.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !master.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMasters();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to toggle master:', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (master: Master) => {
    if (!confirm(`确定要删除大师"${master.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/masters/${master.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchMasters();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete master:', error);
      alert('删除失败');
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">大师管理</h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + 添加大师
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">头像</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">价格</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">字数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">追问</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {masters.map((master) => (
                <tr key={master.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    {(master as Master & { avatar?: string }).avatar ? (
                      <img
                        src={(master as Master & { avatar?: string }).avatar}
                        alt={master.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400/30 to-purple-500/30 flex items-center justify-center text-sm font-medium text-gold-400">
                        {master.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{master.name}</div>
                    {master.intro && (
                      <div className="text-gray-400 text-xs truncate max-w-[200px]">{master.intro}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gold-400">¥{formatPrice(master.price)}</span>
                    <span className="text-gray-500 text-xs ml-1">({Math.round(master.price / 100 * 10)}积分)</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{master.wordCount}字</td>
                  <td className="px-4 py-3 text-gray-300">{formatFollowUps(master.followUps)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      master.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {master.isActive ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(master)}
                        className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggleActive(master)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          master.isActive
                            ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                      >
                        {master.isActive ? '下架' : '上架'}
                      </button>
                      <button
                        onClick={() => handleDelete(master)}
                        className="px-3 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {masters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    暂无大师数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {editingMaster ? '编辑大师' : '添加大师'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如：玄明居士"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">价格（元）*</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如：68"
                />
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">报告字数 *</label>
                <input
                  type="number"
                  value={formData.wordCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, wordCount: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如：500"
                />
              </div>

              {/* Follow Ups */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">追问次数（-1表示不限）</label>
                <input
                  type="number"
                  value={formData.followUps}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUps: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如：1"
                />
              </div>

              {/* Years */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">从业年限</label>
                <input
                  type="number"
                  value={formData.years}
                  onChange={(e) => setFormData(prev => ({ ...prev, years: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如：18"
                />
              </div>

              {/* Intro */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">简介/格言</label>
                <textarea
                  value={formData.intro}
                  onChange={(e) => setFormData(prev => ({ ...prev, intro: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="如：命理不是宿命，而是认识自己的工具"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {['新人推荐', '好评最多', '限时优惠'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formData.tags.includes(tag)
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">头像</label>
                <div className="flex items-center gap-4">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="预览"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`inline-block px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                        uploadingAvatar
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {uploadingAvatar ? '处理中...' : formData.avatar ? '更换头像' : '上传头像'}
                    </label>
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        删除
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">支持 jpg/png，最大 5MB，自动裁剪为正方形</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 提示：大师按价格从低到高自动排序，无需手动设置排序
              </p>
            </div>

            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.price || !formData.wordCount}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
