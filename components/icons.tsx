import React from 'react';

type IconProps = {
  className?: string;
  fill?: string;
  strokeColor?: string;
};

/**
 * Awesome Icon (洗練されたグッドボタン)
 * 以前の不自然さを解消し、シンプルで力強い、誰もがわかる「いいね」の形にしました。
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
      d="M7.5 15h2.25m-4.5 0h1.372c.86 0 1.61-.586 1.819-1.42l.715-2.861c.113-.45.518-.769.98-.769h6.41c.462 0 .867.319.98.769l.715 2.861c.208.834.959 1.42 1.819 1.42H21.75c1.243 0 2.25 1.007 2.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-2.25c0-1.243 1.007-2.25 2.25-2.25z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M11.25 7.5v-1.5a1.5 1.5 0 011.5-1.5h.75a1.5 1.5 0 011.5 1.5v1.5h-3.75z" 
    />
  </svg>
);

/**
 * Hug Icon (ハートを手で抱きしめているデザイン)
 * ご要望を具現化。中央に愛の象徴であるハートを配置し、
 * それを両サイドから優しく包み込む「手」をデザインしました。
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
    {/* 中央のハート */}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
    />
    {/* ハートを抱きしめる両手 */}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M8.25 10.5h1.5a1.5 1.5 0 011.5 1.5v1.5m6.75-3h-1.5a1.5 1.5 0 00-1.5 1.5V12" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M10.5 16.5h3m-3-3.75h3" 
    />
  </svg>
);