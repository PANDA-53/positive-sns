"use client"

import { useState } from 'react'

interface TimelineSwitchProps {
  // 親コンポーネント（FilteredTimeline）に状態を伝えるための関数
  onChange: (mode: 'friends' | 'public') => void;
}

export default function TimelineSwitch({ onChange }: TimelineSwitchProps) {
  // 初期状態は Public（全体）
  const [isPublic, setIsPublic] = useState(true)

  const toggle = (mode: 'friends' | 'public') => {
    if ((mode === 'public' && isPublic) || (mode === 'friends' && !isPublic)) return;
    
    const newIsPublic = mode === 'public'
    setIsPublic(newIsPublic)
    onChange(mode)
  }

  return (
    <div className="flex items-center gap-3 p-1">
      <div className="relative w-48 h-10 bg-gray-200/50 rounded-full p-1 border border-gray-200 shadow-inner flex items-center">
        {/* 背景の動くスライダー */}
        <div 
          className={`absolute w-[calc(50%-4px)] h-8 bg-white rounded-full shadow-md transition-all duration-300 ease-out ${
            isPublic ? 'translate-x-[calc(100%)]' : 'translate-x-0'
          }`}
        />
        
        {/* 友達ボタン */}
        <button
          type="button"
          onClick={() => toggle('friends')}
          className={`relative flex-1 text-[11px] font-black uppercase tracking-wider transition-colors duration-300 z-10 ${
            !isPublic ? 'text-blue-400' : 'text-gray-400'
          }`}
        >
          Friends
        </button>

        {/* パブリックボタン */}
        <button
          type="button"
          onClick={() => toggle('public')}
          className={`relative flex-1 text-[11px] font-black uppercase tracking-wider transition-colors duration-300 z-10 ${
            isPublic ? 'text-green-500' : 'text-gray-400'
          }`}
        >
          Public
        </button>
      </div>
      
      {/* 状態表示テキスト */}
      
    </div>
  )
}