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
        <img 
          src={url} 
          alt={name} 
          className={`${sizeClass} rounded-full object-cover bg-gray-50 border shadow-sm shrink-0`}
          style={{ borderColor: '#B8860B33' }}
        />
      );
    }
    
    // 画像が無い場合は名前の頭文字を抽出
    const initialLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-amber-900 shrink-0 shadow-sm border`}
        style={{ backgroundColor: '#F9F6E5', borderColor: '#B8860B33' }}
      >
        {initialLetter}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
      
      {/* 🔍 検索窓 */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex items-center gap-2">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="友達の名前やトークを検索..."
          className="w-full bg-transparent text-sm p-2 border-none outline-none text-gray-800 placeholder-gray-400 font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-xs text-gray-400 hover:text-gray-600 px-2"
          >
            クリア
          </button>
        )}
      </div>

      {/* 💬 チャット履歴履歴 */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
          <MessageSquare size={12} />
          <span>Recent Chats ({filteredChats.length})</span>
        </h3>

        {filteredChats.length > 0 ? (
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {filteredChats.map((chat) => (
              <a 
                key={chat.targetUserId} 
                href={`/messages/${chat.targetUserId}`}
                className="flex items-center gap-4 p-4 hover:bg-[#F9F6E5]/40 transition-colors group"
              >
                {/* 💡 共通アバターコンポーネントを適用 */}
                <Avatar url={chat.avatarUrl} name={chat.targetName} sizeClass="w-12 h-12 text-sm" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h2 className="text-sm font-bold text-gray-800 truncate group-hover:text-[#B8860B] transition-colors">
                      {chat.targetName}
                    </h2>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(chat.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 truncate pr-2">
                    {chat.latestMessage}
                  </p>
                </div>
                <div className="text-gray-300 group-hover:text-[#B8860B] transition-colors pl-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          searchQuery && (
            <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-2xl border border-dashed border-gray-100">
              一致するチャット履歴はありません
            </p>
          )
        )}
      </div>

      {/* 👥 友達一覧（トーク未開始のユーザー） */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
          <Users size={12} />
          <span>Friends ({filteredFriends.length})</span>
        </h3>

        {filteredFriends.length > 0 ? (
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {filteredFriends.map((friend) => (
              <a 
                key={friend.id} 
                href={`/messages/${friend.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[#F9F6E5]/40 transition-colors group"
              >
                {/* 💡 共通アバターコンポーネントを適用 */}
                <Avatar url={friend.avatar_url} name={friend.full_name} sizeClass="w-10 h-10 text-xs" />
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-800 truncate group-hover:text-[#B8860B] transition-colors">
                    {friend.full_name}
                  </h2>
                  <p className="text-[11px] text-gray-400 truncate">
                    新しくトークルームを開く
                  </p>
                </div>
                <div className="text-gray-300 group-hover:text-[#B8860B] transition-colors pl-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          !searchQuery && filteredChats.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm">
              <p className="text-gray-500 text-[11px]">友達が登録されていません。</p>
            </div>
          )
        )}
      </div>

    </div>
  );
}