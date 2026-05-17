'use client';

import React, { useState } from 'react';
import { Search, Users, MessageSquare } from 'lucide-react';

const GOLD_COLOR = "#B8860B";

interface ChatItem {
  targetUserId: string;
  targetName: string;
  avatarUrl: string;
  latestMessage: string;
  createdAt: string;
}

interface FriendItem {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface MessageClientProps {
  initialChatList: ChatItem[];
  allFriends: FriendItem[];
}

export default function MessageClient({ initialChatList, allFriends }: MessageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. チャット履歴のフィルタリング
  const filteredChats = initialChatList.filter((chat) =>
    chat.targetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. 友達一覧のフィルタリング（チャット履歴にいない人のみ）
  const existingChatUserIds = new Set(initialChatList.map(c => c.targetUserId));
  const filteredFriends = allFriends.filter((friend) => {
    const matchesSearch = friend.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const notInChatYet = !existingChatUserIds.has(friend.id);
    return matchesSearch && notInChatYet;
  });

  // 💡 写真未登録の場合に「名前の最初の1文字」をプレースホルダーとして返すコンポーネント
  const Avatar = ({ url, name, sizeClass = "w-10 h-10 text-xs" }: { url: string; name: string; sizeClass?: string }) => {
    if (url && url.trim() !== '') {
      return (
        /* 💡 修正箇所1: 画像ありアバターの枠線・背景をダーク対応 */
        <img 
          src={url} 
          alt={name} 
          className={`${sizeClass} rounded-full object-cover bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-800 shadow-sm shrink-0 transition-colors duration-200`}
          style={{ borderColor: '#B8860B33' }}
        />
      );
    }
    
    // 画像が無い場合は名前の頭文字を抽出
    const initialLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      /* 💡 修正箇所2: 画像なしイニシャルアバターの背景色・文字色をダーク対応 */
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-amber-900 dark:text-amber-200 shrink-0 shadow-sm border bg-[#F9F6E5] dark:bg-zinc-800 dark:border-zinc-700/60 transition-colors duration-200`}
        style={{ borderColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? undefined : '#B8860B33' }}
      >
        {initialLetter}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
      
      {/* 🔍 検索窓 */}
      {/* 💡 修正箇所3: 検索窓コンテナの背景、ボーダー、入力テキスト、プレースホルダーをダーク対応 */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-2 flex items-center gap-2 transition-colors duration-200">
        <Search size={18} className="text-gray-400 dark:text-zinc-500 ml-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="友達の名前やトークを検索..."
          className="w-full bg-transparent text-sm p-2 border-none outline-none text-gray-800 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 px-2"
          >
            クリア
          </button>
        )}
      </div>

      {/* 💬 チャット履歴履歴 */}
      <div className="space-y-2">
        {/* 💡 修正箇所4: セクションタイトルのテキストカラーをダーク時に調整 */}
        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5 px-1">
          <MessageSquare size={12} />
          <span>Recent Chats ({filteredChats.length})</span>
        </h3>

        {filteredChats.length > 0 ? (
          /* 💡 修正箇所5: チャットリストの外枠・区切り線をダーク対応 */
          <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden divide-y divide-gray-50 dark:divide-zinc-800/50 transition-colors duration-200">
            {filteredChats.map((chat) => (
              <a 
                key={chat.targetUserId} 
                href={`/messages/${chat.targetUserId}`}
                /* 💡 修正箇所6: リストアイテムのホバー時背景（ダーク時はzinc-800/40）と各テキスト色の変更 */
                className="flex items-center gap-4 p-4 hover:bg-[#F9F6E5]/40 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <Avatar url={chat.avatarUrl} name={chat.targetName} sizeClass="w-12 h-12 text-sm" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate group-hover:text-[#B8860B] dark:group-hover:text-[#B8860B] transition-colors">
                      {chat.targetName}
                    </h2>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0">
                      {new Date(chat.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-zinc-400 truncate pr-2">
                    {chat.latestMessage}
                  </p>
                </div>
                <div className="text-gray-300 dark:text-zinc-700 group-hover:text-[#B8860B] transition-colors pl-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          searchQuery && (
            /* 💡 修正箇所7: 検索結果なしブロックのダーク対応 */
            <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-100 dark:border-zinc-800">
              一致するチャット履歴はありません
            </p>
          )
        )}
      </div>

      {/* 👥 友達一覧（トーク未開始のユーザー） */}
      <div className="space-y-2">
        {/* 💡 修正箇所8: セクションタイトルのテキストカラーをダーク時に調整 */}
        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5 px-1">
          <Users size={12} />
          <span>Friends ({filteredFriends.length})</span>
        </h3>

        {filteredFriends.length > 0 ? (
          /* 💡 修正箇所9: 友達リストの外枠・区切り線をダーク対応 */
          <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden divide-y divide-gray-50 dark:divide-zinc-800/50 transition-colors duration-200">
            {filteredFriends.map((friend) => (
              <a 
                key={friend.id} 
                href={`/messages/${friend.id}`}
                /* 💡 修正箇所10: アイテムホバー背景とテキスト色のダーク対応 */
                className="flex items-center gap-4 p-4 hover:bg-[#F9F6E5]/40 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <Avatar url={friend.avatar_url} name={friend.full_name} sizeClass="w-10 h-10 text-xs" />
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate group-hover:text-[#B8860B] dark:group-hover:text-[#B8860B] transition-colors">
                    {friend.full_name}
                  </h2>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
                    新しくトークルームを開く
                  </p>
                </div>
                <div className="text-gray-300 dark:text-zinc-700 group-hover:text-[#B8860B] transition-colors pl-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          !searchQuery && filteredChats.length === 0 && (
            /* 💡 修正箇所11: 友達未登録時のプレースホルダーカードをダーク対応 */
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 p-6 shadow-sm transition-colors duration-200">
              <p className="text-gray-500 dark:text-zinc-400 text-[11px]">友達が登録されていません。</p>
            </div>
          )
        )}
      </div>

    </div>
  );
}