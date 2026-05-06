'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import { toast } from 'sonner'
import { deletePost } from '@/app/actions'
import { useRouter } from 'next/navigation'
import ReplyForm from './ReplyForm'
// Lucideアイコンをインポート
import { Globe, Lock, MessageCircle, Trash2 } from 'lucide-react'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
const GOLD_COLOR = "#B8860B"; 

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

  if (!Array.isArray(mainPosts)) {
    return (
      <div className="text-center py-10 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
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
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1.5 rounded-full flex gap-1 border border-gray-100 shadow-sm">
          <button 
            onClick={() => setViewMode('all')} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'text-white shadow-md' : 'text-gray-400'}`}
            style={viewMode === 'all' ? { backgroundColor: GOLD_COLOR } : {}}
          >
            Public Feed
          </button>
          <button 
            onClick={() => setViewMode('friends')} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'friends' ? 'text-white shadow-md' : 'text-gray-400'}`}
            style={viewMode === 'friends' ? { backgroundColor: GOLD_COLOR } : {}}
          >
            Friends Only
          </button>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-20 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
          No posts to show
        </div>
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400 font-bold">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {/* プライバシーアイコンを Lucide アイコンに変更 */}
                      <span className="opacity-80" style={{ color: GOLD_COLOR }}>
                        {post.privacy_level === 'public' ? (
                          <Globe size={13} strokeWidth={2.5} />
                        ) : (
                          <Lock size={13} strokeWidth={2.5} />
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
                {post.user_id === user?.id && (
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-300 hover:text-rose-400 transition-colors">
                    {/* ゴミ箱も Lucide の Trash2 に変更すると統一感が出ます */}
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                )}
              </div>

              <p className="text-[15px] text-gray-800 mb-4 whitespace-pre-wrap leading-snug">{post.content}</p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
                
                <button 
                  onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${isCommentOpen ? 'bg-amber-50' : 'text-gray-400'}`}
                  style={isCommentOpen ? { color: GOLD_COLOR } : {}}
                >
                  {/* コメントアイコンを Lucide の MessageCircle に変更 */}
                  <MessageCircle size={18} strokeWidth={2} fill={isCommentOpen ? "currentColor" : "none"} />
                  <span className="text-xs font-black">{postReplies.length}</span>
                </button>
              </div>

              {isCommentOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-6">
                    {postReplies.map((reply: any) => (
                      <div key={`reply-${reply.id}`} className="flex gap-3 pl-2">
                        <img src={reply.authorProfile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-50" alt="" />
                        <div className="flex-1 bg-gray-50/80 p-3 rounded-2xl relative text-gray-800">
                          <span className="text-[11px] font-bold block mb-1" style={{ color: GOLD_COLOR }}>{reply.authorProfile?.full_name}</span>
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