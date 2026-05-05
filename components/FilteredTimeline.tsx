'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import PostForm from './post-form'

export default function FilteredTimeline({ mainPosts, replies, user, friendIds }: any) {
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all');

  const visiblePosts = mainPosts.filter((post: any) => {
    const hasPermission = 
      post.privacy_level === 'public' || 
      post.user_id === user.id || 
      (post.privacy_level === 'friends' && friendIds?.includes(post.user_id));
    
    if (!hasPermission) return false;
    if (viewMode === 'friends') return post.privacy_level === 'friends';
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      
      {/* --- タイムライン切替スイッチ --- */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100/80 p-1 rounded-full flex gap-1 border border-gray-200 shadow-inner">
          <button
            onClick={() => setViewMode('all')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewMode === 'all' 
                ? 'bg-green-500 text-white shadow-md scale-105' // 緑色に変更
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setViewMode('friends')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewMode === 'friends' 
                ? 'bg-blue-500 text-white shadow-md scale-105' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Friends Only
          </button>
        </div>
      </div>

      {/* 投稿リスト表示部分 */}
      {visiblePosts.length > 0 ? (
        visiblePosts.map((post: any) => {
          const isCommentOpen = activeCommentId === post.id;
          const replyCount = replies?.filter((r: any) => r.parent_id === post.id).length || 0;

          return (
            <div key={`timeline-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <Link href={`/users/${post.user_id}`} className="flex items-center gap-3 active:opacity-70">
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
                </Link>
              </div>

              <Link href={`/posts/${post.id}`}>
                <p className="text-[15px] text-gray-800 mb-4 leading-snug whitespace-pre-wrap active:opacity-60 transition-opacity">
                  {post.content}
                </p>
                {post.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={post.image_url} alt="" className="w-full h-auto block" />
                  </div>
                )}
              </Link>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <ReactionButtons 
                  postId={post.id} 
                  awesomeCount={post.awesomeCount}
                  hugCount={post.hugCount}
                  initialMyReaction={post.myReaction} 
                />
                
                <button 
                  onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all active:scale-90 ${
                    isCommentOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isCommentOpen ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0 00.19.23c.242.214.582.3.882.232a4.797 4.797 0 001.353-.434c.54-.23.97-.4 1.36-.5a10.06 10.06 0 002.28.216z" />
                  </svg>
                  <span className="text-xs font-bold">{replyCount}</span>
                </button>
              </div>

              {isCommentOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                   <PostForm parentId={post.id} />
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-20 bg-white/50 rounded-[1.5rem] border border-dashed border-gray-300 text-gray-400 text-xs font-black uppercase tracking-widest">
          No Posts Found
        </div>
      )}
    </div>
  )
}