'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '../utils/supabase/client'; // 💡 お使いのクライアント用Supabaseのパスに合わせて調整してください
import { Home, Search, PlusCircle, Bell, Send, X } from 'lucide-react';
import PostForm from './post-form'; 

const GOLD_COLOR = "#B8860B";

interface BottomNavProps {
  currentUserId: string; // 💡 ログイン中のユーザーIDを受け取ります
}

export function BottomNav({ currentUserId }: { currentUserId: string }) {
  const pathname = usePathname();
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // 🔴 未読通知のカウント用ステート
  const supabase = createClient();

  // 🛠️ Supabase のリアルタイム機能を利用して未読通知数をカウント・監視する
  useEffect(() => {
    if (!currentUserId) return;

    // 1. 初期読み込み時に未読通知の件数を取得
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    // 2. Supabase Realtime で notifications テーブルの自分宛ての変更を監視
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT も UPDATE もすべてキャッチ
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          // 新着通知が来たらカウントを増やす
          if (payload.eventType === 'INSERT') {
            setUnreadCount((prev) => prev + 1);
          }
          // 通知ページを開くなどして既読(true)にアップデートされたらカウントを減らす
          if (payload.eventType === 'UPDATE') {
            const newDoc = payload.new as any;
            const oldDoc = payload.old as any;
            if (oldDoc.is_read === false && newDoc.is_read === true) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // タブのメニュー定義
  const navItems = [
    { label: '', href: '/', icon: Home },              
    { label: '', href: '/search', icon: Search },      
    { label: '', href: '#', icon: PlusCircle, isTrigger: true }, 
    { label: '', href: '/notifications', icon: Bell },  
    { label: '', href: '/messages', icon: Send },       
  ];

  return (
    <>
      {/* 1. ボトムナビゲーションバー本体 */}
      {/* 1. ボトムナビゲーションバー本体 */}
{/* 💡 bottom-0 を bottom-3 にして地面から少し浮かせ、左右に少しマージン（px-4）を持たせて角丸（rounded-2xl）にすると、今風の洗練された浮遊ナビになります！ */}
{/* パターンB: 下を埋めたまま、高さを出す場合 */}
<div className="fixed bottom-5 left-0 right-0 z-50 px-5">
  {/* 💡 bg-[#F9F6E5]/95 で柔らかいベージュ色に（心地よい透過感）。
      角丸はiPhoneの美しい曲線にフィットする rounded-[2rem] を採用し、
      影もベージュの背景を邪魔しないソフトな陰影（shadow-[0_8px_32px_rgba(184,134,11,0.12)]）に調整しました */}
  <div className="max-w-md mx-auto flex justify-around items-center h-16 bg-[#F9F6E5]/95 backdrop-blur-md border border-[#B8860B]/10 shadow-[0_8px_32px_rgba(184,134,11,0.12)] rounded-[2rem]">
          {navItems.map((item) => {
            const Icon = item.icon;
            
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

            // 💡 通常ボタン（Home, Search, Bell, 紙飛行機DMなど）の場合の処理
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname === item.href) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 relative" // 🛠️ バッジ配置用に relative を追加
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-200 ${item.href === '/messages' && isActive ? '-rotate-12 translate-x-0.5 -translate-y-0.5' : ''}`}
                  style={{ color: isActive ? GOLD_COLOR : '#9CA3AF' }}
                  fill={isActive ? GOLD_COLOR : 'none'}
                />

                {/* 🛠️ 追記：通知ボタン（Bell）かつ未読件数が1件以上ある場合のみバッジを表示 */}
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute top-2.5 right-6 bg-rose-500 text-white text-[9px] font-black h-4 min-w-4 px-1 flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
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