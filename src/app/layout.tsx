import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "人生曲线 | Life Curve",
  description: "用一张K线图看清你这辈子什么时候最顺",
  keywords: ["人生曲线", "命理", "运势", "K线图"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <StarBackground />
        </div>
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}

function StarBackground() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 6}s`,
    duration: `${4 + Math.random() * 4}s`,
    size: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
  }));

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-gold-400 opacity-40"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            animationDuration: star.duration,
            animation: `star-float ${star.duration} ease-in-out infinite`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(157, 78, 221, 0.3) 0%, transparent 50%)`,
        }}
      />
    </>
  );
}
