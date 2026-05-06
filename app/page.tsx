"use client";

import { createClient } from '@/utils/supabase/client'
import { logout, acceptFriendRequest, fetchMainTimelineData } from './actions'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PostForm from '../components/post-form'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import FilteredTimeline from '../components/FilteredTimeline'
import { useRouter } from 'next/navigation'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

function MainTimelineContent({ user }: { user: any }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['main-timeline', user.id],
    queryFn: () => fetchMainTimelineData(user.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.id,
    placeholderData: (previousData) => previousData, 
  })

  /**
   * ★ 更新の核心ロジック
   * 投稿やリプライ、フレンド承認など、データが変わる操作の後に実行します。
   */
  const handlePostSuccess = async () => {
    // サーバーの反映ラグを考慮して少し待つ
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // キャッシュを古いものとしてマーク
    await queryClient.invalidateQueries({ 
      queryKey: ['main-timeline', user.id] 
    });
    
    // ★ データを強制的に再取得して再描画
    await refetch();
  };

  // 初回ロード時のみスケルトンを表示
  if (isLoading || !data) {
    return (
      <div className="text-center py-20 animate-pulse">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updating Feed...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-[10px] font-bold text-center">
        データの取得に失敗しました
      </div>
    )
  }

  // データの存在保証
  const mainPosts = Array.isArray(data?.mainPosts) ? data.mainPosts : null;
  const replies = Array.isArray(data?.replies) ? data.replies : [];
  const friendIds = Array.isArray(data?.friendIds) ? data.friendIds : [];
  const acceptedFriends = Array.isArray(data?.acceptedFriends) ? data.acceptedFriends : [];
  const pendingRequests = Array.isArray(data?.pendingRequests) ? data.pendingRequests : [];

  if (!mainPosts) return null;

  return (
    <div className="space-y-4 pb-20">
      {/* フレンドリスト */}
      <section className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {acceptedFriends.length > 0 ? (
            acceptedFriends.map((friend: any) => (
              <Link key={friend.id} href={`/users/${friend.id}`} className="flex flex-col items-center gap-1 shrink-0 w-14 active:scale-95 transition-transform">
                <img src={friend.avatar_url || defaultAvatar} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm bg-gray-50" alt="" />
                <span className="text-[9px] font-bold text-gray-400 truncate w-full text-center">{friend.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="text-[10px] text-gray-300 italic px-2">まだ友達がいません</p>
          )}
        </div>
      </section>

      {/* フレンド申請 */}
      {pendingRequests.length > 0 && (
        <section className="bg-blue-50/50 p-4 rounded-[1.5rem] border border-blue-100 space-y-2">
          <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1">Friend Requests</h3>
          {pendingRequests.map((req: any) => (
            <div key={req.user_id} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-blue-50">
              <div className="flex items-center gap-2">
                <img src={req.sender_profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                <span className="font-bold text-xs">{req.sender_profile?.full_name}</span>
              </div>
              <form action={acceptFriendRequest}>
                <input type="hidden" name="requesterId" value={req.user_id} />
                <button type="submit" className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-all">承認</button>
              </form>
            </div>
          ))}
        </section>
      )}

      {/* 通常の投稿フォーム */}
      <PostForm onSuccess={handlePostSuccess} />

      {/* タイムライン（リプライ機能を含む） */}
      <FilteredTimeline 
        mainPosts={mainPosts} 
        replies={replies} 
        user={user} 
        friendIds={friendIds} 
        onSuccess={handlePostSuccess} // ← ここでリプライ成功時も handlePostSuccess が呼ばれるように
      />
    </div>
  )
}

export default function Index() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setProfile(prof)
      } else {
        router.push('/login')
      }
      setIsInitialLoading(false)
    }
    getAuth()
  }, [router, supabase])

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="animate-pulse text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Loading POSITIVES...
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-[#F2F2F2] font-sans text-black overflow-x-hidden">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          <h1 className="text-lg font-black text-green-700 tracking-tighter">POSITIVES</h1>
          <div className="flex items-center gap-3">
            <Link href="/search" className="p-2 text-gray-400 hover:text-green-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>
            <Link href={`/users/${user.id}`} className="hover:opacity-80 transition-opacity">
              <img src={profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full border shadow-sm object-cover bg-gray-100" alt="Profile" />
            </Link>
            <Link href="/profile" className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">設定</Link>
            <form action={logout}>
              <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors px-1">ログアウト</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <PullToRefresh>
          <MainTimelineContent user={user} />
        </PullToRefresh>
      </div>
    </main>
  )
}