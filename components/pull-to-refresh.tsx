"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].pageY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].pageY;
      const distance = touchEndY - touchStartY.current;

      // 完全にページトップにいて、かつ下に150px以上グイッと引いた時だけ
      if (window.scrollY <= 0 && distance > 150 && !isRefreshing) {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1500);
      }
    };

    // passive: true にすることでスクロールの滑らかさを損なわない
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, isRefreshing]);

  return (
    <div className="w-full">
      {isRefreshing && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg border border-green-100">
            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      <div className={isRefreshing ? "opacity-60 transition-opacity" : ""}>
        {children}
      </div>
    </div>
  );
}