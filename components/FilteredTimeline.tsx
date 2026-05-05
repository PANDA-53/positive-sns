'use client'

import React from 'react'
import { ReactionButtons } from './reaction-buttons'

export default function FilteredTimeline({ mainPosts, replies, user, friendIds }: any) {
  // 表示可能な投稿をフィルタリング
  const visiblePosts = mainPosts.filter((post: any) => {
    if (post.privacy_level === 'public') return true;
    if (post.user_id === user.id) return true;
    if (post.privacy_level === 'friends' && friendIds?.includes(post.user_id)) return true;
    return false;
  });

  return (
    <div className="space-y-4 pb-24">
      {visiblePosts.length > 0 ? (
        visiblePosts.map((post: any) => (
          /* カード外枠：角を大きく丸く(rounded-[1.5rem])、内側に余白(p-5) */
          <div key={`timeline-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5">
            
            {/* ヘッダー：アイコンと名前、日付 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={post.authorProfile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                  alt="" 
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-800">{post.authorProfile?.full_name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-gray-400">
                      {new Date(post.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    {post.privacy_level === 'friends' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-500">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 本文テキスト */}
            <p className="text-[15px] text-gray-800 mb-4 leading-snug whitespace-pre-wrap">{post.content}</p>
            
            {/* メディア表示領域：ユーザーページと同じく「枠の内側」で「角丸」にする */}
            {post.video_url ? (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                <video 
                  src={post.video_url} 
                  controls 
                  muted 
                  loop 
                  autoPlay 
                  playsInline 
                  className="w-full h-auto block" 
                />
              </div>
            ) : post.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                <img 
                  src={post.image_url} 
                  alt="" 
                  className="w-full h-auto block" 
                />
              </div>
            )}

            {/* リアクションボタン */}
            <div className="flex items-center">
              <ReactionButtons 
                postId={post.id} 
                awesomeCount={post.awesomeCount}
                hugCount={post.hugCount}
                initialMyReaction={post.myReaction} 
              />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white/50 rounded-[1.5rem] border border-dashed border-gray-300 text-gray-400 text-xs">
          表示できる投稿がありません
        </div>
      )}
    </div>
  )
}