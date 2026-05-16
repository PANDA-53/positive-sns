'use client';

import React from 'react';
import { Star, Award } from 'lucide-react';

const GOLD_COLOR = "#B8860B";

// 「輝きの進化」をテーマにした親しみやすいランク定義（色と質感を追加）
const RANK_THRESHOLD = [
  // 【LINE STAGE】クリアで細いライン（琥珀色の差し色）
  { level: 1, name: "First Line", min: 0, max: 4, color: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-100", iconType: "line-1" },
  { level: 2, name: "Dual Line", min: 5, max: 14, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200/50", iconType: "line-2" },
  { level: 3, name: "Triple Line", min: 15, max: 39, color: "text-amber-700", bg: "bg-amber-100/40", border: "border-amber-200", iconType: "line-3" },
  
  // 【STAR STAGE】ソリッドな星の配置（ラグジュアリーな金）
  { level: 4, name: "Single Stellar", min: 40, max: 89, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-orange-50", border: "border-amber-200/60", iconType: "star-1" },
  { level: 5, name: "Twin Stellar", min: 90, max: 179, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-orange-100", border: "border-amber-300/60", iconType: "star-2" },
  { level: 6, name: "Constellation", min: 180, max: 349, color: "text-amber-700", bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-amber-100", border: "border-amber-300 shadow-sm", iconType: "star-3" },
  
  // 【EMBLEM STAGE】最高峰の輝くエンブレム
  { level: 7, name: "Apex Gold", min: 350, max: 649, color: "text-amber-700 font-black", bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-200/50", border: "border-amber-400/60 shadow-sm", iconType: "crown-minimal" },
  { level: 8, name: "Eternal Gold", min: 650, max: 999, color: "text-amber-800 font-black", bg: "bg-gradient-to-br from-amber-100/40 via-amber-50 to-yellow-200/60", border: "border-amber-400 shadow-md", iconType: "crown-double" },
  { level: 9, name: "The Absolute", min: 1000, max: 99999, color: "text-amber-900 font-black tracking-wider", bg: "bg-gradient-to-br from-yellow-100 via-amber-50 to-amber-300/40", border: "border-yellow-500 shadow-lg border-2", iconType: "absolute" },
];

interface UserRankBadgeProps {
  totalAwesome: number;
}

export function UserRankBadge({ totalAwesome = 0 }: UserRankBadgeProps) {
  const currentRank = RANK_THRESHOLD.find(
    (r) => totalAwesome >= r.min && totalAwesome <= r.max
  ) || RANK_THRESHOLD[0];

  const progress = currentRank.level === 9 
    ? 100 
    : ((totalAwesome - currentRank.min) / (currentRank.max - currentRank.min)) * 100;

  // クリアで光沢感のある幾何学グラフィック群
  const renderGeometry = () => {
    const strokeWidth = 2; // 少し細めの線で上品に
    const color = currentRank.color;

    // 線のデザイン：琥珀色のクリアな質感
    const lineStyle = "h-[3px] bg-amber-400 rounded-full transition-colors duration-300 animate-pulse-subtle";

    switch (currentRank.iconType) {
      case "line-1":
        return <div className={`${lineStyle} w-5`} />;
      case "line-2":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center">
            <div className={`${lineStyle} w-5`} />
            <div className={`${lineStyle} w-5`} />
          </div>
        );
      case "line-3":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center">
            <div className={`${lineStyle} w-5`} />
            <div className={`${lineStyle} w-5`} />
            <div className={`${lineStyle} w-5`} />
          </div>
        );
      case "star-1":
        return <Star size={14} className={`${color} fill-amber-100/50`} strokeWidth={1} />;
      case "star-2":
        return (
          <div className="flex gap-1 justify-center items-center">
            <Star size={13} className={`${color} fill-amber-100/50`} strokeWidth={1} />
            <Star size={13} className={`${color} fill-amber-100/50`} strokeWidth={1} />
          </div>
        );
      case "star-3":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative">
            <Star size={12} className={`${color} fill-amber-100/50 animate-bounce-subtle`} strokeWidth={1} />
            <div className="flex gap-1.5">
              <Star size={10} className={`${color} fill-amber-100/50`} strokeWidth={1} />
              <Star size={10} className={`${color} fill-amber-100/50`} strokeWidth={1} />
            </div>
          </div>
        );
      case "crown-minimal":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative">
            <div className="w-4 h-[2px] bg-amber-600 rounded-full animate-pulse-subtle" />
            <Star size={13} className={`${color} fill-current`} strokeWidth={1} />
          </div>
        );
      case "crown-double":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative animate-pulse-subtle">
            <div className="flex gap-1">
              <Star size={11} className={`${color} fill-current`} strokeWidth={1} />
              <Star size={11} className={`${color} fill-current`} strokeWidth={1} />
            </div>
            <div className="w-5 h-[2px] bg-amber-700 rounded-full animate-bounce-subtle" />
          </div>
        );
      case "absolute":
        return (
          <div className="relative p-1 flex items-center justify-center animate-bounce-subtle">
            <Award size={18} className={`${color} fill-amber-100/50 animate-pulse-subtle`} strokeWidth={1.5} />
          </div>
        );
      default:
        return <div className={`${lineStyle} w-5`} />;
    }
  };

  return (
    <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm w-full text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* クリアで光沢感のあるグレー/ゴールド台座 */}
          <div className={`w-10 h-10 flex items-center justify-center rounded-2xl border ${currentRank.bg} ${currentRank.border} transition-all duration-300`}>
            {renderGeometry()}
          </div>
          <div className="flex flex-col">
            <span className="text-[8.5px] text-gray-400 font-black uppercase tracking-[0.15em] leading-none mb-1">Awesome Rank</span>
            <span className="text-[13px] font-black text-neutral-800 tracking-tight leading-tight">{currentRank.name}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[16px] font-black tracking-tight" style={{ color: GOLD_COLOR }}>{totalAwesome}</span>
          <span className="text-[9px] text-gray-400 font-bold ml-0.5 tracking-wider">Awesome</span>
        </div>
      </div>

      {currentRank.level < 9 ? (
        <div className="space-y-1.5">
          <div className="w-full bg-neutral-50 h-1 rounded-full overflow-hidden border border-neutral-100">
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: GOLD_COLOR }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-gray-400 font-bold px-0.5 tracking-widest uppercase">
            <span>GRADE {currentRank.level}</span>
            <span>Next in {currentRank.max - totalAwesome + 1} Awesome</span>
          </div>
        </div>
      ) : (
        <div className="text-center pt-1 text-[8px] font-black tracking-[0.25em] text-amber-700/80 uppercase">
          ★ POSITIVES SUPREME HONOR ★
        </div>
      )}

      <style jsx global>{`
        @keyframes subtlePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.98); } }
        @keyframes dtBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
        .animate-pulse-subtle { animation: subtlePulse 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: dtBounce 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}