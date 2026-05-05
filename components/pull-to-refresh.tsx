"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isEligibleRef = useRef(false); // 更新資格があるか（一番上から開始したか）

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 余裕を持って window.scrollY < 2 くらいで判定（ブラウザの微細なズレ対策）
      if (window.scrollY <= 2) {
        startYRef.current = e.touches[0].pageY;
        isEligibleRef.current = true;
      } else {
        isEligibleRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligibleRef.current || startYRef.current === null) return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startYRef.current;

      // 下にスクロール（上向きのスワイプ）が10pxでも発生したら、その回の更新資格を剥奪
      if (diff < -10) {
        isEligibleRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEligibleRef.current || startYRef.current === null || isRefreshing) {
        startYRef.current = null;
        return;
      }

      const endY = e.changedTouches[0].pageY;
      const distance = endY - startYRef.current;

      // 【閾値をさらに大きく設定: 250px】
      // 250pxはiPhoneの画面の約3分の1以上に相当し、意図的でないと到達しません。
      if (window.scrollY <= 5 && distance > 250) {
        setIsRefreshing(true);
        
        // router.refresh() だけでなく、確実にデータを再取得させるために
        // 必要に応じて処理を追加（今回はrefreshを維持）
        router.refresh();
        
        setTimeout(() => {
          setIsRefreshing(false);
          startYRef.current = null;
          isEligibleRef.current = false;
        }, 1500);
      } else {
        startYRef.current = null;
        isEligibleRef.current = false;
      }
    };

    // イベントリスナーの登録
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="relative w-full min-h-screen">
      {/* ぐるぐるのインジケーター */}
      {isRefreshing && (
        <div className="fixed top-24 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-2xl border border-green-200 ring-8 ring-green-500/10 transition-all scale-110">
            <div className="w-6 h-6 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      
      {/* コンテンツの透過度を下げて「更新中」を視覚化 */}
      <div className={`${isRefreshing ? "opacity-30 blur-[1px] pointer-events-none" : ""} transition-all duration-500`}>
        {children}
      </div>
    </div>
  );
}