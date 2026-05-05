"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isTopRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 遊びを一切排除：完全に 0 の時だけフラグを立てる
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].pageY;
        isTopRef.current = true;
      } else {
        isTopRef.current = false;
        startYRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTopRef.current || startYRef.current === 0) return;

      const currentY = e.touches[0].pageY;
      const pullDistance = currentY - startYRef.current;

      // 1. 少しでも上にスクロール（下から上へのスワイプ）した瞬間に、リフレッシュ対象から除外
      if (pullDistance < 0) {
        isTopRef.current = false;
        return;
      }

      // 2. 下に引っ張っている時、ブラウザ標準の「戻る」や「更新」のバウンスを抑制
      // これをしないと、ブラウザ自身の更新機能が先に動いてしまいます
      if (pullDistance > 10) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTopRef.current || startYRef.current === 0 || isRefreshing) return;

      const endY = e.changedTouches[0].pageY;
      const distance = endY - startYRef.current;

      // しきい値を 150px にアップ（かなり意識して引かないと反応しない設定）
      if (distance > 150) {
        setIsRefreshing(true);
        router.refresh();
        
        setTimeout(() => {
          setIsRefreshing(false);
          startYRef.current = 0;
          isTopRef.current = false;
        }, 1500);
      } else {
        startYRef.current = 0;
        isTopRef.current = false;
      }
    };

    // passive: false が非常に重要です（これがないとスクロールを止められない）
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="relative w-full">
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-[999] pointer-events-none">
          <div className="bg-white/95 backdrop-blur shadow-2xl rounded-full p-3 border border-green-200 animate-bounce">
            <svg className="animate-spin h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      )}
      <div className={isRefreshing ? "opacity-50 transition-opacity" : ""}>
        {children}
      </div>
    </div>
  );
}