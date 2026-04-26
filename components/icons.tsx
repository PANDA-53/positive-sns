import React from 'react';

type IconProps = {
  className?: string;
  fill?: string;
  strokeColor?: string;
};

/**
 * Awesome Icon (親指を立てたグッドボタン)
 * 視認性を高め、シンプルで力強いデザインに修正しました。
 */
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
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5v2.25a3 3 0 00-3 3v2.25m-9 9l.08-.08c.212-.212.507-.33.821-.33H12a3 3 0 013 3 3 3 0 003-3H21a.75.75 0 01.75.75v10.5a3.75 3.75 0 01-3.75 3.75h-13.5a3.75 3.75 0 01-3.75-3.75V10.5z" 
    />
  </svg>
);

/**
 * Hug Icon (抱きしめているボタン)
 * ハートのラインを腕に見立て、中央の頭を優しく包み込むデザインです。
 * 以前の「気持ち悪さ」を解消し、かわいらしく仕上げました。
 */
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
    {/* 中央の丸い頭 */}
    <circle cx="12" cy="7.5" r="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* 抱きしめる大きな腕（ハートのフォルム） */}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 21.75c-1.12-1.1-6-5.87-6-9a3 3 0 013-3c.83 0 1.5.34 2.1 1l.9 1 .9-1c.6-.66 1.27-1 2.1-1a3 3 0 013 3c0 3.13-4.88 7.9-6 9z" 
    />
    
    {/* 左右から添える腕のライン */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5a4.5 4.5 0 014.5-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 13.5a4.5 4.5 0 00-4.5-4.5" />
  </svg>
);