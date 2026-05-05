"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 完全に一番上にいるときだけ、指の開始位置を記録
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].pageY;
      } else {
        startYRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;

      const endY = e.changedTouches[0].pageY;
      const distance = endY - startYRef.current;

      // 【重要】しきい値を大きく（160px）設定
      // かつ、現在のスクロール位置が「確実に0以下」であることを再確認
      if (window.scrollY <= 0 && distance > 160) {
        setIsRefreshing(true);
        router.refresh();
        
        // 更新中のぐるぐるを表示
        setTimeout(() => {
          setIsRefreshing(false);
          startYRef.current = null;
        }, 1500);
      } else {
        startYRef.current = null;
      }
    };

    // passive: true でスクロール性能を確保
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="w-full min-h-screen">
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-[999] pointer-events-none">
          <div className="bg-white p-2 rounded-full shadow-xl border border-green-100 ring-4 ring-green-50/50">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      <div className={`${isRefreshing ? "opacity-50 pointer-events-none" : ""} transition-opacity duration-300`}>
        {children}
      </div>
    </div>
  );
}