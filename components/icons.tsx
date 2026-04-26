import React from 'react';

type IconProps = {
  className?: string;
  fill?: string;
  strokeColor?: string; // ストロークの色も調整できるように追加
};

// --- Awesome Icon (しっかりした親指のグッド) ---
export const AwesomeIcon = ({ 
  className = "w-6 h-6", 
  fill = "none", 
  strokeColor = "currentColor" 
}: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill={fill} 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke={strokeColor} 
    className={className}
  >
    {/* 親指 */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m-4.5 0h1.372c.86 0 1.61-.586 1.819-1.42l.715-2.861c.113-.45.518-.769.98-.769h6.41c.462 0 .867.319.98.769l.715 2.861c.208.834.959 1.42 1.819 1.42H21.75c1.243 0 2.25 1.007 2.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-2.25c0-1.243 1.007-2.25 2.25-2.25z" />
    {/* 手首部分 */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 7.5v-1.5a1.5 1.5 0 011.5-1.5h.75a1.5 1.5 0 011.5 1.5v1.5h-3.75z" />
  </svg>
);

// --- Hug Icon (両腕で抱きしめているデザイン) ---
export const HugIcon = ({ 
  className = "w-6 h-6", 
  fill = "none", 
  strokeColor = "currentColor" 
}: IconProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill={fill} 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke={strokeColor} 
    className={className}
  >
    {/* 顔部分 */}
    <circle cx="12" cy="9" r="4.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* 右腕（抱きしめる） */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a3.75 3.75 0 00-3.75 3.75v3.75A3.75 3.75 0 0112 23.25a3.75 3.75 0 01-3.75-3.75V15.75A3.75 3.75 0 004.5 12" />
    {/* 左腕（抱きしめる） */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a3.75 3.75 0 013.75-3.75" />
    {/* 腕が重なる部分の調整 */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a3.75 3.75 0 00-3.75-3.75" />
  </svg>
);