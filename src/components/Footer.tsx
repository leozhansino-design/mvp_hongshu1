'use client';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Service account follow prompt */}
          <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-gold-400/10 border border-gold-400/30 rounded-lg">
            <span className="text-gold-400 text-sm">📱</span>
            <span className="text-gold-400 text-sm font-medium">关注公众号「人生曲线AI」获取更多命理资讯</span>
          </div>

          <p className="text-xs text-gray-400">
            海口波塔科技有限责任公司
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-xs text-gray-500">
            <span>客服微信: lifecurve_ai</span>
            <span className="hidden sm:inline">|</span>
            <span>邮箱: lifecurve@163.com</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            &copy; {new Date().getFullYear()} 海口波塔科技有限责任公司 All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
