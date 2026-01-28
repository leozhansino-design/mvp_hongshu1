'use client';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-gray-400">
            海口波塔科技有限责任公司
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-xs text-gray-500">
            <span>客服微信: 18689959960</span>
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
