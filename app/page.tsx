'use client' // キャッシュ機能（React Query）を使うためクライアント化

import { createClient } from '@/utils/supabase/client'
import { logout, acceptFriendRequest, fetchMainTimelineData } from './actions'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PostForm from '../components/post-form'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import FilteredTimeline from '../components/FilteredTimeline'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

// --- フィード表示用コンポーネント ---
function MainTimelineContent({ user }: { user: any }) {
  // ユーザーページと同じ useQuery を使用してキャッシュ化
  const { data, isLoading, isError } = useQuery({
    queryKey: ['main-timeline', user.id],
    queryFn: () => fetchMainTimelineData(user.id),
    staleTime: 1000 * 60 * 5, // 5分間はデータを保持（戻った時一瞬で表示される）
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <div className="text-center py-20 animate-pulse">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Refreshing Feed...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-[10px] font-bold text-center">
        データの取得に失敗しました
      </div>
    )
  }

  const { mainPosts, replies, friendIds, pendingRequests, acceptedFriends } = data

  return (
    <div className="space-y-4 pb-20">
      {/* 友達ストーリーズ風一覧 */}
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

      {/* 申請通知 */}
      {pendingRequests.length > 0 && (
        <section className="bg-blue-50/50 p-4 rounded-[1.5rem] border border-blue-100 space-y-2">
          <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest px-1">Friend Requests</h3>
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

      {/* 投稿フォーム */}
      <PostForm />

      {/* タイムライン（動画の -mx-5 等は FilteredTimeline 側で制御） */}
      <FilteredTimeline 
        mainPosts={mainPosts} 
        replies={replies} 
        user={user} 
        friendIds={friendIds} 
      />
    </div>
  )
}

// --- メイン Index コンポーネント ---
export default function Index() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
      }
      setIsInitialLoading(false)
    }
    getAuth()
  }, [])

  return (
    <main className="min-h-screen bg-[#F2F2F2] font-sans text-black overflow-x-hidden">
      {/* ナビゲーション */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          <h1 className="text-lg font-black text-green-700 tracking-tighter">POSITIVES</h1>
          {user && (
            <div className="flex items-center gap-3">
              <Link href={`/users/${user.id}`} className="hover:opacity-80 transition-opacity">
                <img src={profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full border shadow-sm object-cover bg-gray-100" alt="Profile" />
              </Link>
              <Link href="/profile" className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                設定
              </Link>
              <form action={logout}>
                <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors px-1">
                  ログアウト
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* メインフィード */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        {isInitialLoading ? (
          <div className="text-center py-20 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Loading...</div>
        ) : user ? (
          <PullToRefresh>
            <MainTimelineContent user={user} />
          </PullToRefresh>
        ) : (
          /* 未ログイン時 */
          <div className="text-center py-24 bg-white rounded-[2.5rem] border shadow-sm px-8">
            <h2 className="text-2xl font-black mb-2 tracking-tight">POSITIVES</h2>
            <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">Share only good vibes.</p>
            <Link href="/login" className="bg-green-600 text-white px-12 py-4 rounded-full font-bold shadow-lg hover:bg-green-700 transition-all inline-block active:scale-95">
              ログインして始める
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}