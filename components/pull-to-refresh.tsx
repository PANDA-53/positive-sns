"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0); // 変数の保持に useRef を使用

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 厳格にチェック: ページ最上部（scrollYがほぼ0）の時だけ開始座標を記録
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].pageY;
      } else {
        startYRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === 0) return;

      const currentY = e.touches[0].pageY;
      const pullDistance = currentY - startYRef.current;

      // 1. 下方向に引っ張っている（pullDistance > 0）
      // 2. かつ、スクロール位置がトップである
      if (pullDistance > 0 && window.scrollY <= 0) {
        // ブラウザ標準の「引っ張って更新」やバウンスを止める
        if (e.cancelable) e.preventDefault();
      } else if (pullDistance < 0) {
        // 上にスワイプ（下へスクロール）した瞬間にリフレッシュ対象から除外
        startYRef.current = 0;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startYRef.current === 0 || isRefreshing) return;

      const endY = e.changedTouches[0].pageY;
      const distance = endY - startYRef.current;

      // しきい値を 120px に引き上げ（誤作動防止）
      if (window.scrollY <= 5 && distance > 120) {
        setIsRefreshing(true);
        router.refresh();
        
        setTimeout(() => {
          setIsRefreshing(false);
          startYRef.current = 0;
        }, 1500);
      } else {
        startYRef.current = 0;
      }
    };

    // passive: false を指定して preventDefault を有効にする
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="relative">
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-3 border border-green-100 animate-bounce">
            <svg className="animate-spin h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}