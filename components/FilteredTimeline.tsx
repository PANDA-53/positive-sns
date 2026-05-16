'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ReactionButtons } from './reaction-buttons'
import { ReplyActionButtons } from './reply-action-buttons' 
import { toast } from 'sonner'
import { deletePost, reportPost } from '@/app/actions'
import { useRouter } from 'next/navigation'
import ReplyForm from './ReplyForm'
import { Globe, Lock, MessageCircle, Trash2, AlertTriangle, X } from 'lucide-react'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
const GOLD_COLOR = "#B8860B"; 

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
  
  // 🎬 画像・動画のフルスクリーンポップアップを一元管理するステートに変更
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  
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

          // 💡 Awesome数の安全な取得
          const totalAwesome = 
            post.authorProfile?.total_awesome ?? 
            post.authorProfile?.totalAwesomeCount ?? 
            post.authorProfile?.totalAwesome ?? 0;

          // ❤️ Hug数の安全な取得
          const totalHug = 
            post.authorProfile?.total_hug ?? 
            post.authorProfile?.totalHugCount ?? 
            post.authorProfile?.totalHug ?? 0;

          // 📈 ルート（平方根）計算の経験値システム（最大999）
          const calculatedLevel = Math.min(999, Math.max(1, Math.floor(Math.sqrt(totalAwesome)) + 1));

          return (
            <div key={`timeline-item-${post.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5 relative">
              <div className="flex items-center justify-between mb-4">
                <Link href={`/users/${post.user_id}`} className="flex items-center gap-3">
                  <img src={post.authorProfile?.avatar_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-50" alt="" />
                  <div className="flex flex-col">
                    
                    {/* ユーザーネームとステータステキスト */}
                    <span className="text-[13px] font-bold text-gray-800 flex items-center flex-wrap gap-x-1.5 gap-y-1">
                      {post.authorProfile?.full_name}
                      
                      {/* Awesomeレベル */}
                      <span className="text-[9px] font-black tracking-tighter text-amber-600 bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-100/70 shadow-[0_1px_1px_rgba(0,0,0,0.01)] ml-0.5">
                        Lv.{calculatedLevel}
                      </span>

                      {/* Hugスコア */}
                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50/70 border border-rose-100/60 px-1.5 py-0.5 rounded-full shadow-[0_1px_1px_rgba(244,63,94,0.01)]">
                        {totalHug} <span className="text-[8px] font-medium text-rose-400/80">hugged</span>
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400 font-bold">
                        {new Date(post.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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

              {/* メディア表示エリア */}
              {post.video_url ? (
                <div 
                  onClick={() => setActiveMedia({ type: 'video', url: post.video_url })}
                  className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black cursor-pointer relative group overflow-hidden"
                >
                  {/* 中央に表示されるカスタム再生オーバーレイ */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-md transform scale-95 group-hover:scale-100 transition-transform duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <video src={post.video_url} muted loop autoPlay playsInline className="w-full h-auto block pointer-events-none" />
                </div>
              ) : post.image_url && (
                /* 🛠️ タイムラインの画像表示エリアも、ホバーアニメーション ＆ タップ対応に拡張 */
                <div 
                  onClick={() => setActiveMedia({ type: 'image', url: post.image_url })}
                  className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 cursor-pointer relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center">
                    <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                      拡大する
                    </div>
                  </div>
                  <img src={post.image_url} alt="" className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
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

                      const replyHug = 
                        reply.authorProfile?.total_hug ?? 
                        reply.authorProfile?.totalHugCount ?? 
                        reply.authorProfile?.totalHug ?? 0;

                      const replyCalculatedLevel = Math.min(999, Math.max(1, Math.floor(Math.sqrt(replyAwesome)) + 1));

                      return (
                        <div key={`reply-${reply.id}`} className="flex gap-3 pl-2">
                          <img src={reply.authorProfile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-50" alt="" />
                          <div className="flex-1 bg-gray-50/80 p-3 rounded-2xl relative text-gray-800">
                            
                            <span className="text-[11px] font-bold flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mb-1.5" style={{ color: GOLD_COLOR }}>
                              <span className="text-gray-800">{reply.authorProfile?.full_name}</span>
                              
                              <span className="text-[8px] font-black tracking-tighter text-amber-600 bg-amber-50/90 px-1.5 py-0.2 rounded border border-amber-100/70">
                                Lv.{replyCalculatedLevel}
                              </span>

                              <span className="text-[8px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded-full">
                                {replyHug} <span className="text-[7px] font-medium text-rose-400/80">hugged</span>
                              </span>
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

      {/* 🎬 フルスクリーン・マルチメディアポップアップビューア (画像・動画両対応) */}
      {activeMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveMedia(null)} // 背景タップで閉じる
        >
          {/* 閉じるボタン */}
          <button 
            onClick={() => setActiveMedia(null)}
            className="absolute top-4 right-4 z-50 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          {/* メディアコンテナ */}
          <div 
            className="w-full max-w-4xl max-h-[85vh] px-4 flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // メディア本体のタップで閉じてしまうバグを防ぐ
          >
            {activeMedia.type === 'video' ? (
              <video 
                src={activeMedia.url} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain bg-black"
              />
            ) : (
              <img 
                src={activeMedia.url} 
                alt="" 
                className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain bg-black animate-in fade-in duration-300"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}