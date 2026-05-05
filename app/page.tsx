'use client'

import { createClient } from '../utils/supabase/client'
import { logout, acceptFriendRequest, deletePost, fetchTimelineData } from './actions'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactionButtons } from '../components/reaction-buttons'
import { FriendButton } from '../components/friend-button'
import { ReportButton } from '../components/report-button'
import PostForm from '../components/post-form'
import ReplyForm from '../components/ReplyForm'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'

// --- 返信セクション（折りたたみ制御） ---
function ReplySection({ postId }: { postId: string }) {
  const [isReplying, setIsReplying] = useState(false)

  return (
    <div className="mt-2">
      {!isReplying ? (
        <button 
          onClick={() => setIsReplying(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-colors px-1 py-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785c-.442.496.057 1.285.738 1.065 2.138-.691 4.453-1.213 6.326-1.422.05-.005.103-.008.156-.008Z" />
          </svg>
          返信する...
        </button>
      ) : (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <ReplyForm parentId={postId} />
          <button 
            onClick={() => setIsReplying(false)}
            className="text-[9px] font-bold text-gray-300 hover:text-gray-500 px-2 transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}

// --- データ表示用コンポーネント ---
function PostListContent({ user }: { user: any }) {
  const [filterMode, setFilterMode] = useState<'all' | 'friends'>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeline', user?.id],
    queryFn: () => fetchTimelineData(user?.id),
    staleTime: 1000 * 60,
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 w-full max-w-md mx-auto mt-10">
        <div className="h-32 bg-gray-200 rounded-[1.5rem]"></div>
        <div className="h-40 bg-gray-200 rounded-[1.5rem]"></div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">データの取得に失敗しました</p>
        <button onClick={() => refetch()} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">再読み込み</button>
      </div>
    )
  }

  const { mainPosts, replies, pendingRequests, acceptedFriends, defaultAvatar } = data

  const friendIds = new Set([user.id, ...acceptedFriends.map((f: any) => f.id)]);
  const filteredPosts = mainPosts.filter((post: any) => {
    if (filterMode === 'all') return true;
    return friendIds.has(post.user_id);
  });

  return (
    <div className="space-y-4">
      {/* 友達一覧 */}
      <section className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {acceptedFriends.length > 0 ? (
            acceptedFriends.map((friend: any) => (
              <Link key={friend.id} href={`/users/${friend.id}`} className="flex flex-col items-center gap-1 shrink-0 w-14 hover:opacity-80 transition-opacity">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={friend.avatar_url || defaultAvatar} className="w-full h-full object-cover" alt="" />
                </div>
                <span className="text-[9px] font-bold text-gray-500 truncate w-full text-center">{friend.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="text-[10px] text-gray-400 px-2 italic">まだ友達がいません</p>
          )}
        </div>
      </section>

      {/* 申請リスト */}
      {pendingRequests.length > 0 && (
        <section className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 p-4 rounded-[1.5rem] shadow-md">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 px-1">申請が届いています</h3>
          <div className="space-y-2">
            {pendingRequests.map((req: any) => (
              <div key={req.user_id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-white shadow-sm">
                <Link href={`/users/${req.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src={req.sender_profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                  <span className="font-bold text-xs text-gray-800">{req.sender_profile?.full_name}</span>
                </Link>
                <form action={acceptFriendRequest}>
                  <input type="hidden" name="requesterId" value={req.user_id} />
                  <button type="submit" className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow-sm">承認</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 投稿フォーム */}
      <section><PostForm /></section>

      {/* 切り替えスイッチ */}
      <div className="flex justify-center py-2">
        <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1 border border-white shadow-sm">
          <button 
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
              filterMode === 'all' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-green-600'  
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-current">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            PUBLIC
          </button>
          <button 
            onClick={() => setFilterMode('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
              filterMode === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-current">
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0110.908-2.677 5.18 5.18 0 00-1.213 2.533 1.72 1.72 0 00.453 1.41c.674.674 1.745.674 2.419 0a1.72 1.72 0 00.453-1.41 5.18 5.18 0 00-1.213-2.533 6.003 6.003 0 013.871 3.314c.081.27-.047.551-.27.706A5.978 5.978 0 0110 18a5.978 5.978 0 01-5.615-1.572z" />
            </svg>
            FRIENDS
          </button>
        </div>
      </div>

      {/* 投稿リスト */}
      <div className="space-y-3 pb-20">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: any) => (
            <div key={post.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <Link href={`/users/${post.user_id}`} className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
                  <img src={post.authorProfile?.avatar_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover border border-gray-50" alt="" />
                  <div className="flex flex-col text-black">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{post.authorProfile?.full_name || '匿名'}</span>
                      {post.privacy_level === 'friends' && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-500">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {post.user_id === user.id ? (
                    <form action={deletePost}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    </form>
                  ) : (
                    <FriendButton targetUserId={post.user_id} initialStatus={post.friendStatus} />
                  )}
                </div>
              </div>
              
              <p className="text-[15px] text-gray-800 mb-3 whitespace-pre-wrap leading-snug">{post.content}</p>
              
              {post.video_url ? (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                  <video src={post.video_url} controls muted loop autoPlay playsInline className="w-full h-auto block" />
                </div>
              ) : post.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                  <img src={post.image_url} alt="" className="w-full h-auto block" />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
                {post.user_id !== user.id && <ReportButton postId={post.id} />}
              </div>
              
              

{/* 返信一覧 */}
{replies.some((r: any) => r.parent_id === post.id) && (
  <div className="ml-6 mt-4 space-y-2 border-l-2 border-gray-50 pl-4 mb-2">
    {replies.filter((r: any) => r.parent_id === post.id).map((reply: any) => (
      <div key={reply.id} className="bg-gray-50/50 p-3 rounded-xl group/reply relative transition-all hover:bg-gray-100/50">
        <Link href={`/users/${reply.user_id}`} className="font-bold text-gray-500 block text-[10px] hover:underline mb-0.5">
          {reply.authorProfile?.full_name || '匿名'}
        </Link>
        <span className="text-gray-700 text-xs leading-normal block mb-2">{reply.content}</span>

        {/* ★ 返信用の通報ボタンをここに追加 */}
        <div className="flex justify-end pt-1 border-t border-gray-100/50">
          {reply.user_id !== user.id && (
            <ReportButton postId={reply.id} />
          )}
        </div>
      </div>
    ))}
  </div>
)}



              {/* ★ 折りたたみ返信フォーム */}
              <ReplySection postId={post.id} />
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {filterMode === 'friends' ? '友達の投稿はまだありません' : '投稿はまだありません'}
          </div>
        )}
      </div>
    </div>
  );
}

// --- メイン Index コンポーネント ---
export default function Index() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()
  const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)
      
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      setProfile(data)
    }
    initAuth()
  }, [supabase])

  if (!user) return null

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-black pb-12 font-sans">
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-lg font-black tracking-tighter">POSITIVES</h1>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 text-gray-400 hover:text-black transition-colors rounded-xl hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>

            <Link href={`/users/${user.id}`} className="p-1">
              <img 
                src={profile?.avatar_url || defaultAvatar} 
                className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm transition-transform active:scale-90" 
                alt="My Profile" 
              />
            </Link>

            <Link href="/profile" className="text-[10px] font-black text-gray-400 hover:text-gray-900 px-2 py-1 transition-colors uppercase tracking-widest">
              設定
            </Link>

            <form action={logout}>
              <button className="text-[10px] font-black text-gray-300 hover:text-red-500 px-2 py-1 transition-colors uppercase tracking-widest">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <PullToRefresh>
          <PostListContent user={user} />
        </PullToRefresh>
      </div>
    </main>
  );
}