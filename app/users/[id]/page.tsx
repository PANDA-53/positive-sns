'use client' // クライアントコンポーネント化

import { createClient } from '@/utils/supabase/client'
import { fetchUserProfileData } from '@/app/actions'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ReactionButtons } from '@/components/reaction-buttons'
import Link from 'next/link'
import PullToRefresh from '@/components/pull-to-refresh'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

// --- データ表示用コンポーネント ---
function UserPageContent({ targetId, currentUserId }: { targetId: string, currentUserId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-profile', targetId, currentUserId],
    queryFn: () => fetchUserProfileData(targetId, currentUserId),
    staleTime: 1000 * 60, // 1分間はキャッシュを新鮮とみなす
    enabled: !!targetId && !!currentUserId,
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 animate-pulse pt-4">
        <div className="bg-white rounded-[1.5rem] h-48 mb-6"></div>
        <div className="space-y-3">
          <div className="bg-white rounded-[1.5rem] h-32"></div>
          <div className="bg-white rounded-[1.5rem] h-32"></div>
        </div>
      </div>
    )
  }

  if (isError || !data?.profile) {
    return <div className="text-center py-20 text-gray-500 text-xs font-bold">ユーザーが見つからないか、エラーが発生しました</div>
  }

  const { profile, mainPosts, isMe} = data

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4">
      {/* プロフィールカード */}
      <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 mb-6 text-center relative overflow-hidden">
        <div className="relative inline-block mb-3">
          <img 
            src={profile.avatar_url || defaultAvatar} 
            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm mx-auto"
            alt={profile.full_name}
          />
        </div>
        <h1 className="text-xl font-bold mb-1">{profile.full_name}</h1>
        <p className="text-gray-500 text-[11px] mb-4 max-w-md mx-auto whitespace-pre-wrap leading-relaxed">
          {profile.bio || "自己紹介はまだありません。"}
        </p>

        {isMe && (
          <div className="flex justify-center">
            <Link href="/profile" className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 px-5 py-2 rounded-full text-[10px] font-bold border border-gray-200 transition-all active:scale-95">
              <span>プロフィールを編集</span>
            </Link>
          </div>
        )}
      </section>

      {/* 投稿履歴の見出し */}
      <div className="px-1 mb-3">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Posts</h2>
      </div>

      {/* 投稿リスト */}
      <div className="space-y-3 pb-20">
        {mainPosts.length > 0 ? (
          mainPosts.map((post: any) => (
            <div key={post.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
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
              <p className="text-[15px] text-gray-800 mb-4 leading-snug whitespace-pre-wrap">{post.content}</p>
              
              {post.video_url ? (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black flex items-center justify-center">
                  <video src={post.video_url} controls muted loop autoPlay playsInline className="w-full h-auto max-h-[400px] object-contain" />
                </div>
              ) : post.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
                  <img src={post.image_url} alt="" className="w-full h-auto object-contain max-h-[400px]" />
                </div>
              )}

              <div className="flex items-center">
                <ReactionButtons 
                  postId={post.id} 
                  awesomeCount={post.awesomeCount}
                  hugCount={post.hugCount}
                  initialMyReaction={post.myReaction} 
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/50 rounded-[1.5rem] border border-dashed border-gray-300 text-gray-400 text-xs">
            投稿はまだありません
          </div>
        )}
      </div>
    </div>
  )
}

// --- メインページ ---
export default function UserProfilePage() {
  const params = useParams()
  const id = params.id as string
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getAuth()
  }, [])

  if (!id) return null

  return (
    <main className="min-h-screen bg-[#F2F2F2] pb-12 font-sans text-black">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>HOME</span>
          </Link>
        </div>
      </nav>

      {/* ログインユーザーIDが確定してからコンテンツを表示 */}
      {currentUserId && (
        <PullToRefresh>
          <UserPageContent targetId={id} currentUserId={currentUserId} />
        </PullToRefresh>
      )}
    </main>
  )
}