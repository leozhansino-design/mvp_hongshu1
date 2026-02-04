'use client';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Service account follow prompt */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-gray-600 text-sm">📱</span>
            <span className="text-gray-700 text-sm font-medium">关注公众号「人生曲线AI」获取更多命理资讯</span>
          </div>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2">
            <span className="text-sm text-gray-600">客服微信: <span className="text-gray-900 font-medium">lifecurveai</span></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-sm text-gray-600">邮箱: <span className="text-gray-900 font-medium">lifecurve@163.com</span></span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            海口波塔科技有限责任公司
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} 海口波塔科技有限责任公司 All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
