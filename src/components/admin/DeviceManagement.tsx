'use client';

import { useState, useEffect, useCallback } from 'react';

interface Device {
  id: number;
  device_id: string;
  free_used: number;
  points: number;
  created_at: string;
  updated_at: string;
  total_consumed: number;
  report_count: number;
}

interface PointsLog {
  id: number;
  device_id: string;
  type: 'recharge' | 'consume';
  points: number;
  balance: number;
  description: string;
  related_key: string | null;
  created_at: string;
}

interface UsageLog {
  id: number;
  device_id: string;
  action: string;
  points_cost: number;
  birth_info: {
    name?: string;
    gender: string;
    year: number;
    month: number;
    day: number;
  } | null;
  result_id: string | null;
  curve_mode: string;
  created_at: string;
}

interface DeviceDetail {
  device: Device & { total_recharged: number };
  pointsLogs: PointsLog[];
  usageLogs: UsageLog[];
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<DeviceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/devices?page=${page}&pageSize=50`);
      const data = await response.json();

      if (data.success) {
        setDevices(data.devices);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const loadDeviceDetail = async (deviceId: string) => {
    setLoadingDetail(true);
    setSelectedDevice(deviceId);
    try {
      const response = await fetch(`/api/admin/devices/${encodeURIComponent(deviceId)}`);
      const data = await response.json();

      if (data.success) {
        setDeviceDetail(data);
      }
    } catch (error) {
      console.error('Failed to load device detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedDevice(null);
    setDeviceDetail(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortId = (id: string) => {
    if (id.length > 16) {
      return id.substring(0, 8) + '...' + id.substring(id.length - 4);
    }
    return id;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">总设备数</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">有积分设备</p>
          <p className="text-2xl font-bold text-green-400">
            {devices.filter(d => d.points > 0).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">今日活跃</p>
          <p className="text-2xl font-bold text-blue-400">
            {devices.filter(d => {
              const today = new Date().toDateString();
              return new Date(d.updated_at).toDateString() === today;
            }).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1">总报告数</p>
          <p className="text-2xl font-bold text-purple-400">
            {devices.reduce((sum, d) => sum + d.report_count, 0)}
          </p>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-medium">设备列表</h3>
          <button
            onClick={loadDevices}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无设备数据</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      设备ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      积分
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      已消费
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                      报告数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      最后活跃
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono text-sm text-white">
                        {formatShortId(device.device_id)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono ${device.points > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                          {device.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-yellow-400">
                          {device.total_consumed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-blue-400">
                          {device.report_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(device.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadDeviceDetail(device.device_id)}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  第 {page} / {totalPages} 页，共 {total} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 设备详情弹窗 */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeDetail}></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                设备详情
                <span className="ml-2 text-sm text-gray-400 font-mono">
                  {formatShortId(selectedDevice)}
                </span>
              </h3>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : deviceDetail ? (
              <div className="p-6 space-y-6">
                {/* 设备概览 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">当前积分</p>
                    <p className="text-2xl font-bold text-green-400">{deviceDetail.device.points}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">累计充值</p>
                    <p className="text-2xl font-bold text-blue-400">{deviceDetail.device.total_recharged}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">累计消费</p>
                    <p className="text-2xl font-bold text-yellow-400">{deviceDetail.device.total_consumed}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">免费已用</p>
                    <p className="text-2xl font-bold text-purple-400">{deviceDetail.device.free_used}/3</p>
                  </div>
                </div>

                {/* 积分记录 */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h4 className="text-white font-medium">积分记录</h4>
                  </div>
                  {deviceDetail.pointsLogs.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">暂无记录</div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-300">时间</th>
                            <th className="px-3 py-2 text-left text-gray-300">类型</th>
                            <th className="px-3 py-2 text-right text-gray-300">变动</th>
                            <th className="px-3 py-2 text-right text-gray-300">余额</th>
                            <th className="px-3 py-2 text-left text-gray-300">说明</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {deviceDetail.pointsLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-3 py-2 text-gray-300">{formatDate(log.created_at)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 text-xs rounded ${log.type === 'recharge' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {log.type === 'recharge' ? '充值' : '消费'}
                                </span>
                              </td>
                              <td className={`px-3 py-2 text-right font-mono ${log.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {log.points > 0 ? '+' : ''}{log.points}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-gray-300">{log.balance}</td>
                              <td className="px-3 py-2 text-gray-400">{log.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 报告历史 */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h4 className="text-white font-medium">报告历史</h4>
                  </div>
                  {deviceDetail.usageLogs.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">暂无记录</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-300">时间</th>
                            <th className="px-3 py-2 text-left text-gray-300">类型</th>
                            <th className="px-3 py-2 text-left text-gray-300">模式</th>
                            <th className="px-3 py-2 text-right text-gray-300">消耗</th>
                            <th className="px-3 py-2 text-left text-gray-300">生辰信息</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {deviceDetail.usageLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-3 py-2 text-gray-300">{formatDate(log.created_at)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  log.action === 'free_overview' ? 'bg-gray-600 text-gray-200' :
                                  log.action === 'paid_overview' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {log.action === 'free_overview' ? '免费概览' :
                                   log.action === 'paid_overview' ? '积分概览' : '精批详解'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  log.curve_mode === 'wealth' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {log.curve_mode === 'wealth' ? '财富' : '人生'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-yellow-400">
                                {log.points_cost > 0 ? `-${log.points_cost}` : '免费'}
                              </td>
                              <td className="px-3 py-2 text-gray-400">
                                {log.birth_info ? (
                                  <span>
                                    {log.birth_info.name || '匿名'} ·
                                    {log.birth_info.gender === 'male' ? '男' : '女'} ·
                                    {log.birth_info.year}/{log.birth_info.month}/{log.birth_info.day}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">加载失败</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
