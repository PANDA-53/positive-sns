'use client';

import React from 'react';
import { Star, Award } from 'lucide-react';

// Awesome数に応じたシンプルなアイコン判定ロジック
export function UserRankIcon({ totalAwesome = 0 }: { totalAwesome: number }) {
  const lineStyle = "h-[2px] bg-amber-500 rounded-full inline-block align-middle";

  if (totalAwesome <= 4) {
    // LEVEL 1: 1本線
    return <span className={`${lineStyle} w-3 ml-1`} />;
  }
  if (totalAwesome <= 14) {
    // LEVEL 2: 2本線
    return (
      <span className="inline-flex flex-col gap-[1px] ml-1 align-middle">
        <span className={`${lineStyle} w-3`} />
        <span className={`${lineStyle} w-3`} />
      </span>
    );
  }
  if (totalAwesome <= 39) {
    // LEVEL 3: 3本線
    return (
      <span className="inline-flex flex-col gap-[1px] ml-1 align-middle">
        <span className={`${lineStyle} w-3`} />
        <span className={`${lineStyle} w-3`} />
        <span className={`${lineStyle} w-3`} />
      </span>
    );
  }
  if (totalAwesome <= 89) {
    // LEVEL 4: 星1つ
    return <Star size={13} className="text-amber-500 fill-amber-100/50 inline ml-1 align-middle" strokeWidth={1.5} />;
  }
  if (totalAwesome <= 179) {
    // LEVEL 5: 星2つ
    return (
      <span className="inline-flex gap-[1px] ml-1 align-middle">
        <Star size={11} className="text-amber-500 fill-amber-100/50" strokeWidth={1.5} />
        <Star size={11} className="text-amber-500 fill-amber-100/50" strokeWidth={1.5} />
      </span>
    );
  }
  if (totalAwesome <= 349) {
    // LEVEL 6: 星3つ（星座）
    return (
      <span className="inline-flex flex-col gap-[1px] items-center ml-1 align-middle">
        <Star size={9} className="text-amber-600 fill-amber-100/50" strokeWidth={1.5} />
        <span className="inline-flex gap-[1px]">
          <Star size={8} className="text-amber-600 fill-amber-100/50" strokeWidth={1.5} />
          <Star size={8} className="text-amber-600 fill-amber-100/50" strokeWidth={1.5} />
        </span>
      </span>
    );
  }
  // LEVEL 7以上: アワード・エンブレム
  return <Award size={14} className="text-amber-600 fill-amber-100/50 inline ml-1 align-middle" strokeWidth={1.5} />;
}