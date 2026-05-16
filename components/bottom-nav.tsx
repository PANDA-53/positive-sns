'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 💡 MessageSquare を除外し、紙飛行機アイコン用の Send を追加インポート
import { Home, Search, PlusCircle, Bell, Send, X } from 'lucide-react';
import PostForm from './post-form'; 

const GOLD_COLOR = "#B8860B";

export function BottomNav() {
  const pathname = usePathname();
  // 投稿ポップアップの開閉状態を管理するステート
  const [isPostOpen, setIsPostOpen] = useState(false);

  // タブのメニュー定義
  const navItems = [
    { label: '', href: '/', icon: Home },              // app/page.tsx (トップ画面)
    { label: '', href: '/search', icon: Search },      // app/search フォルダ
    { label: '', href: '#', icon: PlusCircle, isTrigger: true }, // ポップアップトリガー
    { label: '', href: '/notifications', icon: Bell },  // 通知画面用（仮）
    { label: '', href: '/messages', icon: Send },       // 💡 アイコンを MessageSquare から Send（紙飛行機）に変更
  ];

  return (
    <>
      {/* 1. ボトムナビゲーションバー本体 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            // 現在アクティブなタブかどうかの判定（/messages 配下でもアクティブになります）
            const isActive = item.isTrigger 
              ? isPostOpen 
              : (pathname === item.href || pathname.startsWith(item.href + '/'));

            // 💡 ポスト（投稿）ボタンの場合の処理
            if (item.isTrigger) {
              return (
                <button
                  key={item.href}
                  onClick={() => setIsPostOpen(!isPostOpen)}
                  className="flex flex-col items-center justify-center w-full h-full transition-all active:scale-95"
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-colors duration-200"
                    style={{ color: isActive ? GOLD_COLOR : '#9CA3AF' }}
                  />
                </button>
              );
            }

            // 💡 通常ボタン（Home, Search, 紙飛行機DMなど）の場合の処理
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // すでにそのページにいる状態でボタンが押されたら最上部へスクロール
                  if (pathname === item.href) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex flex-col items-center justify-center w-full h-full transition-all active:scale-95"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  // 💡 紙飛行機アイコンが右斜め上をきれいに向くよう、アクティブ時のみ少し傾きと色を調整
                  className={`transition-all duration-200 ${item.href === '/messages' && isActive ? '-rotate-12 translate-x-0.5 -translate-y-0.5' : ''}`}
                  style={{ color: isActive ? GOLD_COLOR : '#9CA3AF' }}
                  fill={isActive ? GOLD_COLOR : 'none'}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. 投稿ポップアップ（下からせり上がるモーダル） */}
      {isPostOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          
          {/* 背景の黒いマスク */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsPostOpen(false)} 
          />
          
          {/* フォームの白枠コンテンツエリア */}
          <div 
            className="relative w-full max-w-md bg-white rounded-t-[2rem] p-6 shadow-2xl pb-safe max-h-[85vh] overflow-y-auto transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* ポップアップのヘッダー部分 */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Create New Post
              </span>
              {/* 右上の閉じる(✕)ボタン */}
              <button 
                onClick={() => setIsPostOpen(false)}
                className="p-1 rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ポストフォーム */}
            <PostForm onSuccess={() => setIsPostOpen(false)} />
          </div>

        </div>
      )}
    </>
  );
}