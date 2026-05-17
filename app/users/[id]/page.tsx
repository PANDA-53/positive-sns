"use client";

import { useState, useEffect } from 'react';
import { fetchUserProfileData } from '@/app/actions';
import { createClient } from '@/utils/supabase/client'; // 💡 ログアウト用でクライアント側も使用
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation'; // 💡 ログアウト後の遷移用に useRouter を追加
import { ReactionButtons } from '@/components/reaction-buttons';
import { ReplyActionButtons } from '@/components/reply-action-buttons'; 
import Link from 'next/link';
import PullToRefresh from '@/components/pull-to-refresh';
import ReplyForm from '@/components/ReplyForm';
import { MessageSquare, MessageCircle, Globe, Lock, X, LogOut } from 'lucide-react'; // 💡 LogOut アイコンを追加

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";
const GOLD_COLOR = "#B8860B";

function UserPageContent({ targetId, currentUserId }: { targetId: string, currentUserId: string }) {
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const router = useRouter();
  const supabase = createClient(); // 💡 Supabase クライアントの初期化

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-profile', targetId, currentUserId],
    queryFn: () => fetchUserProfileData(targetId, currentUserId),
    staleTime: 1000 * 60,
    enabled: !!targetId && !!currentUserId,
  });

  // 💡 ログアウト処理ハンドラー
  const handleSignOut = async () => {
    const confirmLogout = window.confirm("ログアウトしますか？");
    if (!confirmLogout) return;

    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh(); // キャッシュをクリアして完全にログイン画面へ戻す
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 animate-pulse pt-4">
        <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] h-48 mb-6 border border-gray-100 dark:border-zinc-800"></div>
        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] h-32 border border-gray-100 dark:border-zinc-800"></div>
          <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] h-32 border border-gray-100 dark:border-zinc-800"></div>
        </div>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="text-center py-20 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
        User Not Found
      </div>
    );
  }

  const profile = data.profile;
  const mainPosts = data.mainPosts || []
  const isMe = data.isMe;
  const totalAwesomeCount = data.totalAwesomeCount || 0;
  const replies = (data as any).replies || [];
  const totalHugCount = profile.total_hug ?? (profile as any).totalHugCount ?? (profile as any).totalHug ?? 0;
  const calculatedLevel = Math.min(999, Math.max(1, Math.floor(Math.sqrt(totalAwesomeCount)) + 1));

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      {/* プロフィールカード */}
      <section className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 mb-6 text-center relative overflow-hidden flex flex-col items-center transition-colors duration-200">
        <div className="relative inline-block mb-3">
          <img 
            src={profile.avatar_url || defaultAvatar} 
            className="w-20 h-20 rounded-full object-cover border-2 shadow-sm mx-auto bg-gray-50 dark:bg-zinc-800"
            style={{ borderColor: GOLD_COLOR }}
            alt={profile.full_name}
          />
        </div>
        <h1 className="text-xl font-black mb-1" style={{ color: GOLD_COLOR }}>{profile.full_name}</h1>
        <p className="text-gray-500 dark:text-zinc-400 text-[11px] mb-4 max-w-md mx-auto whitespace-pre-wrap leading-relaxed italic transition-colors duration-200">
          {profile.bio || "自己紹介はまだありません。"}
        </p>

        {/* ステータス表示 */}
        <div className="flex items-center justify-center gap-2 mb-5 w-full max-w-sm">
          <span className="text-[10px] font-black tracking-wider text-amber-600 bg-amber-50/80 dark:bg-amber-950/40 px-3 py-1 rounded-md border border-amber-100/70 dark:border-amber-900/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            Lv.{calculatedLevel}
          </span>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100/60 dark:border-rose-900/40 px-3 py-1 rounded-full shadow-[0_1px_2px_rgba(244,63,94,0.01)]">
            {totalHugCount} <span className="text-[9px] font-medium text-rose-400/80">hugged</span>
          </span>
        </div>

        {/* ボタン表示エリア */}
        {/* 💡 修正箇所1: 自分のページの場合、編集とログアウトを綺麗に横並び(flex-row)で配置 */}
        <div className="flex justify-center w-full gap-3">
          {isMe ? (
            <>
              <Link 
                href="/profile" 
                className="flex-1 max-w-[160px] flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold border transition-all active:scale-95 shadow-sm bg-[#F9F6E5] dark:bg-zinc-800 dark:border-zinc-700/80"
                style={{ color: GOLD_COLOR }}
              >
                <span>編集する</span>
              </Link>
              <button 
                type="button"
                onClick={handleSignOut}
                className="flex-1 max-w-[160px] flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold border border-rose-100 dark:border-rose-900/40 transition-all active:scale-95 shadow-sm bg-rose-50/40 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut size={11} strokeWidth={2.5} />
                <span>ログアウト</span>
              </button>
            </>
          ) : (
            <Link 
              href={`/messages/${targetId}`}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold text-white transition-all active:scale-95 shadow-sm hover:opacity-90"
              style={{ backgroundColor: GOLD_COLOR }}
            >
              <MessageSquare size={12} strokeWidth={2.5} />
              <span>DMを送る</span>
            </Link>
          )}
        </div>
      </section>

      {/* 投稿履歴の見出し */}
      <div className="px-1 mb-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_COLOR }}>Posts</h2>
      </div>

      <div className="space-y-3 pb-20">
        {mainPosts.length > 0 ? (
          mainPosts.map((post: any) => {
            const isCommentOpen = activeCommentId === post.id;
            const postReplies = replies.filter((r: any) => r.parent_id === post.id);

            return (
              <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 p-5 transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500">
                      {new Date(post.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="opacity-80" style={{ color: GOLD_COLOR }}>
                      {post.privacy_level === 'public' ? <Globe size={11} strokeWidth={2.5} /> : <Lock size={11} strokeWidth={2.5} />}
                    </span>
                  </div>
                </div>
                <p className="text-[15px] text-gray-800 dark:text-zinc-100 mb-4 leading-snug whitespace-pre-wrap transition-colors duration-200">{post.content}</p>
                
                {/* メディア表示エリア */}
                {post.video_url ? (
                  <div 
                    onClick={() => setActiveMedia({ type: 'video', url: post.video_url })}
                    className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm bg-black cursor-pointer relative group"
                  >
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
                  <div 
                    onClick={() => setActiveMedia({ type: 'image', url: post.image_url })}
                    className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm bg-gray-50 dark:bg-zinc-900/50 cursor-pointer relative group"
                  >
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center">
                      <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                        拡大する
                      </div>
                    </div>
                    <img src={post.image_url} alt="" className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" />
                  </div>
                )}

                {/* リアクションとリプライボタン */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-zinc-800/60">
                  <ReactionButtons 
                    postId={post.id} 
                    awesomeCount={post.awesomeCount}
                    hugCount={post.hugCount}
                    initialMyReaction={post.myReaction} 
                    isOwnPost={post.user_id === currentUserId}
                  />
                  
                  <button 
                    onClick={() => setActiveCommentId(isCommentOpen ? null : post.id)} 
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${isCommentOpen ? 'bg-amber-50 dark:bg-amber-950/30' : 'text-gray-400 dark:text-zinc-500'}`}
                    style={isCommentOpen ? { color: GOLD_COLOR } : {}}
                  >
                    <MessageCircle size={18} strokeWidth={2} fill={isCommentOpen ? "currentColor" : "none"} />
                    <span className="text-xs font-black">{postReplies.length}</span>
                  </button>
                </div>

                {/* コメント展開エリア */}
                {isCommentOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3 mb-6">
                      {postReplies.map((reply: any) => {
                        const replyAwesome = reply.authorProfile?.total_awesome ?? reply.authorProfile?.totalAwesomeCount ?? 0;
                        const replyHug = reply.authorProfile?.total_hug ?? reply.authorProfile?.totalHugCount ?? 0;
                        const replyCalculatedLevel = Math.min(999, Math.max(1, Math.floor(Math.sqrt(replyAwesome)) + 1));

                        return (
                          <div key={`reply-${reply.id}`} className="flex gap-3 pl-2 text-left">
                            <img src={reply.authorProfile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-50 dark:border-zinc-800" alt="" />
                            <div className="flex-1 bg-gray-50/80 dark:bg-zinc-950 p-3 rounded-2xl relative text-gray-800 dark:text-zinc-100 border border-transparent dark:border-zinc-800/40">
                              
                              <span className="text-[11px] font-bold flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mb-1.5" style={{ color: GOLD_COLOR }}>
                                <span className="text-gray-800 dark:text-zinc-100">{reply.authorProfile?.full_name}</span>
                                
                                <span className="text-[8px] font-black tracking-tighter text-amber-600 bg-amber-50/90 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-100/70 dark:border-amber-900/60">
                                  Lv.{replyCalculatedLevel}
                                </span>

                                <span className="text-[8px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 px-1.5 py-0.2 rounded-full">
                                  {replyHug} <span className="text-[7px] font-medium text-rose-400/80">hugged</span>
                                </span>
                              </span>

                              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                              <ReplyActionButtons 
                                replyId={reply.id}
                                awesomeCount={reply.awesomeCount}
                                initialIsAwesome={reply.myReaction === 'awesome'}
                                isMyComment={reply.user_id === currentUserId}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <ReplyForm parentId={post.id} onSuccess={() => refetch()} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white/50 dark:bg-zinc-900/40 rounded-[1.5rem] border border-dashed border-gray-300 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors duration-200">
            No posts yet
          </div>
        )}
      </div>

      {/* フルスクリーン・ビューア */}
      {activeMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveMedia(null)}
        >
          <button 
            onClick={() => setActiveMedia(null)}
            className="absolute top-4 right-4 z-50 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <div 
            className="w-full max-w-4xl max-h-[85vh] px-4 flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia.type === 'video' ? (
              <video src={activeMedia.url} controls autoPlay playsInline className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain bg-black" />
            ) : (
              <img src={activeMedia.url} alt="" className="w-full h-auto max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain bg-black animate-in fade-in duration-300" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getAuth();
  }, []);

  if (!id) return null;

  return (
    <main className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 pb-12 font-sans text-black dark:text-zinc-100 transition-colors duration-200">
      <nav className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/80 h-14 flex items-center">
        <div className="max-w-2xl mx-auto px-4 w-full flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-black transition-colors uppercase tracking-widest hover:opacity-70" style={{ color: GOLD_COLOR }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>HOME</span>
          </Link>
        </div>
      </nav>

      {currentUserId && (
        <PullToRefresh>
          <UserPageContent targetId={id} currentUserId={currentUserId} />
        </PullToRefresh>
      )}
    </main>
  );
}