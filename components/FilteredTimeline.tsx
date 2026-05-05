'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import PostForm from './post-form'
import { toast } from 'sonner'
import { reportPost } from '@/app/actions'

export default function FilteredTimeline({ mainPosts, replies, user, friendIds }: any) {
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const visiblePosts = mainPosts.filter((post: any) => {
    const hasPermission = 
      post.privacy_level === 'public' || 
      post.user_id === user.id || 
      (post.privacy_level === 'friends' && friendIds?.includes(post.user_id));
    
    if (!hasPermission) return false;
    if (viewMode === 'friends') return post.privacy_level === 'friends';
    return true;
  });

  const handleReport = async (postId: number) => {
    const confirmed = window.confirm('この投稿に「チクチク（攻撃性）」を感じましたか？運営に報告します。');
    if (confirmed) {
      try {
        const result = await reportPost(postId);
        if (result.success) {
          toast.success('報告ありがとうございます。運営が内容を確認します。');
        } else {
          toast.error('報告の送信に失敗しました。');
        }
      } catch (error) {
        toast.error('エラーが発生しました。');
      }
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* タイムライン切替スイッチ */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100/80 p-1 rounded-full flex gap-1 border border-gray-200 shadow-inner">
          <button
            onClick={() => setViewMode('all')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewMode === 'all' ? 'bg-green-500 text-white shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setViewMode('friends')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              viewMode === 'friends' ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Friends Only
          </button>
        </div>
      </div>

      {visiblePosts.map((post: any) => {
        const isCommentOpen = activeCommentId === post.id;
        const isMenuOpen = openMenuId === post.id;
        const replyCount = replies?.filter((r: any) => r.parent_id === post.id).length || 0;

        return (
          <div key={`timeline-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5 relative">
            <div className="flex items-center justify-between mb-4">
              <Link href={`/users/${post.user_id}`} className="flex items-center gap-3 active:opacity-70">
                <img src={post.authorProfile?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-800">{post.authorProfile?.full_name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-gray-400">
                      {new Date(post.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    {/* 公開範囲アイコンの表示 */}
                    {post.privacy_level === 'public' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-green-500/70">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-blue-500/70">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </Link>

              {post.user_id !== user.id && (
                <div className="relative">
                  <button onClick={(e) => { e.preventDefault(); setOpenMenuId(isMenuOpen ? null : post.id); }} className="p-2 text-gray-300 active:text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 mt-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => { handleReport(post.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-rose-500 active:bg-rose-50 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-400">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          チクチクした投稿…
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link href={`/posts/${post.id}`}>
              <p className="text-[15px] text-gray-800 mb-4 whitespace-pre-wrap leading-snug">{post.content}</p>
              {post.image_url && <div className="mb-4 rounded-xl overflow-hidden border border-gray-100"><img src={post.image_url} alt="" className="w-full" /></div>}
            </Link>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
              <button onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${isCommentOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={isCommentOpen ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0 00.19.23c.242.214.582.3.882.232a4.797 4.797 0 001.353-.434c.54-.23.97-.4 1.36-.5a10.06 10.06 0 002.28.216z" />
                </svg>
                <span className="text-xs font-bold">{replyCount}</span>
              </button>
            </div>
            {isCommentOpen && <div className="mt-4 pt-4 border-t border-gray-100"><PostForm parentId={post.id} /></div>}
          </div>
        );
      })}
    </div>
  )
}