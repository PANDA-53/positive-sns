"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false); // 引っ張り中かどうかを管理

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 厳密に一番上の時だけ記録。1pxでもスクロールしてたら無視。
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].pageY;
        isPullingRef.current = true;
      } else {
        startYRef.current = null;
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      
      const currentY = e.touches[0].pageY;
      const diff = currentY - startYRef.current;

      // 【重要】もし指が「上向き」に動いたら、それは通常のスクロール（下を見る動作）
      // なので、その時点で引っ張り判定を即キャンセルする。
      if (diff < 0) {
        isPullingRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // 途中でスクロール動作（上向き移動）があった場合は何もしない
      if (startYRef.current === null || isRefreshing || !isPullingRef.current) {
        startYRef.current = null;
        return;
      }

      const endY = e.changedTouches[0].pageY;
      const distance = endY - startYRef.current;

      // しきい値を 180px にさらに強化（これくらいがスマホで自然です）
      if (window.scrollY <= 0 && distance > 180) {
        setIsRefreshing(true);
        router.refresh();
        
        setTimeout(() => {
          setIsRefreshing(false);
          startYRef.current = null;
          isPullingRef.current = false;
        }, 1200);
      } else {
        startYRef.current = null;
        isPullingRef.current = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true }); // moveを監視
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="relative w-full min-h-full">
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-[999] pointer-events-none">
          <div className="bg-white p-2 rounded-full shadow-xl border border-green-100 ring-4 ring-green-50/50">
            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      <div className={`${isRefreshing ? "opacity-40 select-none" : ""} transition-opacity duration-300`}>
        {children}
      </div>
    </div>
  );
}