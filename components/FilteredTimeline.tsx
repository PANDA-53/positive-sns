'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import { toast } from 'sonner'
import { deletePost } from '@/app/actions'
import { useRouter } from 'next/navigation'
import ReplyForm from './ReplyForm'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

interface FilteredTimelineProps {
  mainPosts: any[];
  replies: any[];
  user: any;
  friendIds: string[];
  onSuccess?: () => void; 
}

export default function FilteredTimeline({ 
  mainPosts = [], 
  replies = [], 
  user, 
  friendIds = [], 
  onSuccess 
}: FilteredTimelineProps) {
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all');
  const router = useRouter();

  // ★【究極のガード】
  // mainPostsが「配列」として認識されるまで、以下の処理（filterなど）を絶対にさせない
  if (!Array.isArray(mainPosts)) {
    return (
      <div className="text-center py-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
        Syncing Timeline...
      </div>
    );
  }

  const visiblePosts = mainPosts.filter((post: any) => {
    if (!post) return false;
    const hasPermission = 
      post.privacy_level === 'public' || 
      post.user_id === user?.id || 
      (post.privacy_level === 'friends' && friendIds?.includes(post.user_id));
    
    if (!hasPermission) return false;
    return viewMode === 'friends' ? post.privacy_level === 'friends' : true;
  });

  const handleDelete = async (postId: number) => {
    if (!window.confirm('この投稿を削除してもよろしいですか？')) return;
    const formData = new FormData();
    formData.append('postId', postId.toString());
    try {
      await deletePost(formData);
      toast.success('投稿を削除しました');
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* フィード切り替え */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100/80 p-1 rounded-full flex gap-1 border border-gray-200 shadow-inner">
          <button onClick={() => setViewMode('all')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}>Public Feed</button>
          <button onClick={() => setViewMode('friends')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'friends' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400'}`}>Friends Only</button>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-20 text-gray-300 text-[10px] font-bold uppercase tracking-widest">No posts to show</div>
      ) : (
        visiblePosts.map((post: any) => {
          const isCommentOpen = activeCommentId === post.id;
          const postReplies = (replies || []).filter((r: any) => r.parent_id === post.id);

          return (
            <div key={`timeline-item-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5 relative">
              <div className="flex items-center justify-between mb-4">
                 <Link href={`/users/${post.user_id}`} className="flex items-center gap-3">
                  <img src={post.authorProfile?.avatar_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-50" alt="" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-800">{post.authorProfile?.full_name}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                {post.user_id === user?.id && (
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-300 hover:text-rose-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                )}
              </div>

              <p className="text-[15px] text-gray-800 mb-4 whitespace-pre-wrap leading-snug">{post.content}</p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
                <button onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${isCommentOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isCommentOpen ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0 00.19.23c.242.214.582.3.882.232a4.797 4.797 0 001.353-.434c.54-.23.97-.4 1.36-.5a10.06 10.06 0 002.28.216z" /></svg>
                  <span className="text-xs font-bold">{postReplies.length}</span>
                </button>
              </div>

              {isCommentOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-6">
                    {postReplies.map((reply: any) => (
                      <div key={`reply-${reply.id}`} className="flex gap-3 pl-2">
                        <img src={reply.authorProfile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-50" alt="" />
                        <div className="flex-1 bg-gray-50/80 p-3 rounded-2xl relative text-gray-800">
                          <span className="text-[11px] font-bold block mb-1">{reply.authorProfile?.full_name}</span>
                          <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <ReplyForm 
                    parentId={post.id} 
                    onSuccess={() => {
                      if (onSuccess) onSuccess(); 
                    }} 
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  )
}