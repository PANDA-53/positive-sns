'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import { ReplyActionButtons } from './reply-action-buttons' 
import { toast } from 'sonner'
import { deletePost, reportPost } from '@/app/actions'
import { useRouter } from 'next/navigation'
import ReplyForm from './ReplyForm'
import { Globe, Lock, MessageCircle, Trash2, AlertTriangle, Star, Award } from 'lucide-react'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
const GOLD_COLOR = "#B8860B"; 

// 🏆 ご提示いただいた「輝きの進化」ランク定義
const RANK_THRESHOLD = [
  { level: 1, name: "First Line", min: 0, max: 4, color: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-100", iconType: "line-1" },
  { level: 2, name: "Dual Line", min: 5, max: 14, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200/50", iconType: "line-2" },
  { level: 3, name: "Triple Line", min: 15, max: 39, color: "text-amber-700", bg: "bg-amber-100/40", border: "border-amber-200", iconType: "line-3" },
  { level: 4, name: "Single Stellar", min: 40, max: 89, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-orange-50", border: "border-amber-200/60", iconType: "star-1" },
  { level: 5, name: "Twin Stellar", min: 90, max: 179, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-orange-100", border: "border-amber-300/60", iconType: "star-2" },
  { level: 6, name: "Constellation", min: 180, max: 349, color: "text-amber-700", bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-amber-100", border: "border-amber-300 shadow-sm", iconType: "star-3" },
  { level: 7, name: "Apex Gold", min: 350, max: 649, color: "text-amber-700 font-black", bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-200/50", border: "border-amber-400/60 shadow-sm", iconType: "crown-minimal" },
  { level: 8, name: "Eternal Gold", min: 650, max: 999, color: "text-amber-800 font-black", bg: "bg-gradient-to-br from-amber-100/40 via-amber-50 to-yellow-200/60", border: "border-amber-400 shadow-md", iconType: "crown-double" },
  { level: 9, name: "The Absolute", min: 1000, max: 99999, color: "text-amber-900 font-black tracking-wider", bg: "bg-gradient-to-br from-yellow-100 via-amber-50 to-amber-300/40", border: "border-yellow-500 shadow-lg border-2", iconType: "absolute" },
];

// ✨ ご提示いただいた美しい幾何学ロジックを、名前の横（インライン）に完全に適合させたコンポーネント
function EmbeddedRankBadge({ totalAwesome = 0 }: { totalAwesome: number }) {
  const currentRank = RANK_THRESHOLD.find(
    (r) => totalAwesome >= r.min && totalAwesome <= r.max
  ) || RANK_THRESHOLD[0];

  const color = currentRank.color;
  const lineStyle = "h-[2.5px] bg-amber-400 rounded-full transition-colors duration-300";

  const renderGeometry = () => {
    switch (currentRank.iconType) {
      case "line-1":
        return <div className={`${lineStyle} w-3.5 inline-block`} />;
      case "line-2":
        return (
          <div className="flex flex-col gap-[1.5px] items-center justify-center h-3">
            <div className={`${lineStyle} w-3.5`} />
            <div className={`${lineStyle} w-3.5`} />
          </div>
        );
      case "line-3":
        return (
          <div className="flex flex-col gap-[1.5px] items-center justify-center h-4">
            <div className={`${lineStyle} w-3.5`} />
            <div className={`${lineStyle} w-3.5`} />
            <div className={`${lineStyle} w-3.5`} />
          </div>
        );
      case "star-1":
        return <Star size={11} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />;
      case "star-2":
        return (
          <div className="flex gap-0.5 justify-center items-center">
            <Star size={10} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />
            <Star size={10} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />
          </div>
        );
      case "star-3":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative">
            <Star size={9} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />
            <div className="flex gap-0.5">
              <Star size={8} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />
              <Star size={8} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />
            </div>
          </div>
        );
      case "crown-minimal":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative">
            <div className="w-3.5 h-[1.5px] bg-amber-600 rounded-full" />
            <Star size={10} className={`${color} fill-current`} strokeWidth={1} />
          </div>
        );
      case "crown-double":
        return (
          <div className="flex flex-col gap-0.5 items-center justify-center relative">
            <div className="flex gap-0.5">
              <Star size={8} className={`${color} fill-current`} strokeWidth={1} />
              <Star size={8} className={`${color} fill-current`} strokeWidth={1} />
            </div>
            <div className="w-3.5 h-[1.5px] bg-amber-700 rounded-full" />
          </div>
        );
      case "absolute":
        return <Award size={13} className={`${color} fill-amber-100/50`} strokeWidth={1.5} />;
      default:
        return <div className={`${lineStyle} w-3.5`} />;
    }
  };

  return (
    <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border min-w-[20px] min-h-[20px] ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${currentRank.bg} ${currentRank.border}`}>
      {renderGeometry()}
    </div>
  )
}

interface FilteredTimelineProps {
  mainPosts: any[];
  replies: any[];
  user: any;
  friendIds: string[];
  onSuccess?: () => void; 
  viewModeProp?: 'all' | 'friends'; 
}

export default function FilteredTimeline({ 
  mainPosts = [], 
  replies = [], 
  user, 
  friendIds = [], 
  onSuccess,
  viewModeProp = 'all'
}: FilteredTimelineProps) {
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<Record<number, boolean>>({});
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
    if (viewModeProp === 'friends') {
      return friendIds?.includes(post.user_id) || post.user_id === user?.id;
    }
    return true;
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

  const handleReportPost = async (postId: number) => {
    if (!window.confirm('この投稿に悪意を感じますか？\n不適切な表現がある場合、確認の上対処いたします。')) return;
    setReportedPostIds(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await reportPost(postId);
      if (res.success) {
        toast.success('通報を受け付けました。ご協力ありがとうございます。');
      } else {
        setReportedPostIds(prev => ({ ...prev, [postId]: false }));
        toast.error(res.message || '処理に失敗しました');
      }
    } catch (error) {
      setReportedPostIds(prev => ({ ...prev, [postId]: false }));
      toast.error('エラーが発生しました');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {visiblePosts.length === 0 ? (
        <div className="text-center py-20 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
          No posts to show
        </div>
      ) : (
        visiblePosts.map((post: any) => {
          const isCommentOpen = activeCommentId === post.id;
          const postReplies = (replies || []).filter((r: any) => r.parent_id === post.id);
          const isPostReported = !!reportedPostIds[post.id];

          // 💡 ブレを防ぐため、存在し得るすべてのAwesome数のフィールド名を安全にフォールバック取得
          const totalAwesome = 
            post.authorProfile?.total_awesome ?? 
            post.authorProfile?.totalAwesomeCount ?? 
            post.authorProfile?.totalAwesome ?? 0;

          return (
            <div key={`timeline-item-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5 relative">
              <div className="flex items-center justify-between mb-4">
                <Link href={`/users/${post.user_id}`} className="flex items-center gap-3">
                  <img src={post.authorProfile?.avatar_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-50" alt="" />
                  <div className="flex flex-col">
                    {/* 🛠️ 名前の真横に、クリアな質感の台座枠付きで幾何学バッジをマウント */}
                    <span className="text-[13px] font-bold text-gray-800 flex items-center">
                      {post.authorProfile?.full_name}
                      <EmbeddedRankBadge totalAwesome={totalAwesome} />
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400 font-bold">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="opacity-80" style={{ color: GOLD_COLOR }}>
                        {post.privacy_level === 'public' ? <Globe size={13} strokeWidth={2.5} /> : <Lock size={13} strokeWidth={2.5} />}
                      </span>
                    </div>
                  </div>
                </Link>
                
                {post.user_id === user?.id ? (
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-300 hover:text-rose-400 transition-colors">
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReportPost(post.id)} 
                    disabled={isPostReported}
                    className={`flex items-center gap-1 p-2 text-[10px] font-bold transition-all active:scale-95 ${isPostReported ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-rose-400'}`}
                  >
                    <AlertTriangle size={14} strokeWidth={2.5} />
                    <span>{isPostReported ? '報告済み' : '報告する'}</span>
                  </button>
                )}
              </div>

              <p className="text-[15px] text-gray-800 mb-4 whitespace-pre-wrap leading-snug px-1">
                {post.content}
              </p>

              {post.video_url ? (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                  <video src={post.video_url} controls muted loop autoPlay playsInline className="w-full h-auto block" />
                </div>
              ) : post.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                  <img src={post.image_url} alt="" className="w-full h-auto block" loading="lazy" />
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <ReactionButtons 
                  postId={post.id} 
                  awesomeCount={post.awesomeCount} 
                  hugCount={post.hugCount} 
                  initialMyReaction={post.myReaction} 
                  isOwnPost={post.user_id === user?.id} 
                />
                
                <button 
                  onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${isCommentOpen ? 'bg-amber-50' : 'text-gray-400'}`}
                  style={isCommentOpen ? { color: GOLD_COLOR } : {}}
                >
                  <MessageCircle size={18} strokeWidth={2} fill={isCommentOpen ? "currentColor" : "none"} />
                  <span className="text-xs font-black">{postReplies.length}</span>
                </button>
              </div>

              {isCommentOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3 mb-6">
                    {postReplies.map((reply: any) => {
                      const replyAwesome = 
                        reply.authorProfile?.total_awesome ?? 
                        reply.authorProfile?.totalAwesomeCount ?? 
                        reply.authorProfile?.totalAwesome ?? 0;

                      return (
                        <div key={`reply-${reply.id}`} className="flex gap-3 pl-2">
                          <img src={reply.authorProfile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-50" alt="" />
                          <div className="flex-1 bg-gray-50/80 p-3 rounded-2xl relative text-gray-800">
                            {/* リプライエリアの名前の横にも同じ台座バッジをインライン結合 */}
                            <span className="text-[11px] font-bold flex items-center mb-1" style={{ color: GOLD_COLOR }}>
                              {reply.authorProfile?.full_name}
                              <EmbeddedRankBadge totalAwesome={replyAwesome} />
                            </span>
                            <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                            <ReplyActionButtons 
                              replyId={reply.id}
                              awesomeCount={reply.awesomeCount}
                              initialIsAwesome={reply.myReaction === 'awesome'}
                              isMyComment={reply.user_id === user?.id}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ReplyForm parentId={post.id} onSuccess={() => { if (onSuccess) onSuccess(); }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  )
}