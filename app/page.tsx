"use client";

import { createClient } from '@/utils/supabase/client'
import { fetchMainTimelineData } from './actions'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import FilteredTimeline from '../components/FilteredTimeline'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"
const GOLD_COLOR = "#B8860B"; 

interface MainTimelineContentProps {
  user: any;
  viewMode: 'all' | 'friends';
}

function MainTimelineContent({ user, viewMode }: MainTimelineContentProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['main-timeline', user.id],
    queryFn: () => fetchMainTimelineData(user.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.id,
    placeholderData: (previousData) => previousData, 
  })

  const handlePostSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    queryClient.removeQueries({ queryKey: ['main-timeline', user.id] });
    await refetch();
    router.refresh();
  };

  if (isLoading || !data) {
    return (
      <div className="text-center py-20 animate-pulse">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>Updating Feed...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl text-[10px] font-bold text-center">
        データの取得に失敗しました
      </div>
    )
  }

  const mainPosts = Array.isArray(data?.mainPosts) ? data.mainPosts : null;
  const replies = Array.isArray(data?.replies) ? data.replies : [];
  const friendIds = Array.isArray(data?.friendIds) ? data.friendIds : [];
  const acceptedFriends = Array.isArray(data?.acceptedFriends) ? data.acceptedFriends : [];
  const pendingRequests = Array.isArray(data?.pendingRequests) ? data.pendingRequests : [];

  if (!mainPosts) return null;

  return (
    <div className="space-y-4 pb-20">
      {/* 💡 修正箇所1: フレンドリストの背景を dark:bg-[--card-bg] から dark:bg-zinc-900 へ置き換え */}
      <section className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors duration-200">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {acceptedFriends.length > 0 ? (
            acceptedFriends.map((friend: any) => (
              <Link key={friend.id} href={`/users/${friend.id}`} className="flex flex-col items-center gap-1 shrink-0 w-14 active:scale-95 transition-transform">
                <img src={friend.avatar_url || defaultAvatar} className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm bg-gray-50 dark:bg-zinc-900" alt="" />
                <span className="text-[9px] font-bold truncate w-full text-center" style={{ color: GOLD_COLOR }}>{friend.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="text-[10px] italic px-2" style={{ color: GOLD_COLOR }}>まだ友達がいません</p>
          )}
        </div>
      </section>

      {/* フレンド申請 */}
      {pendingRequests.length > 0 && (
        /* 💡 修正箇所2: フレンド申請の外枠も dark:bg-zinc-900 に修正、枠線をゴールドベースに調整 */
        <section className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border-2 border-[#B8860B]/20 space-y-2 transition-colors duration-200">
          <h3 className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: GOLD_COLOR }}>Friend Requests</h3>
          {pendingRequests.map((req: any) => (
            /* 💡 修正箇所3: 申請の中のリストアイテムの背景を dark:bg-zinc-950 / border-zinc-800 にしてコントラストを綺麗に */
            <div key={req.user_id} className="flex items-center justify-between bg-white dark:bg-zinc-950 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <img src={req.sender_profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover border border-transparent dark:border-zinc-800" alt="" />
                <span className="font-bold text-xs text-gray-800 dark:text-zinc-200">{req.sender_profile?.full_name}</span>
              </div>
              {/* 💡 修正後：formタグを廃止し、ボタン単体のローディング処理と画面更新を実装 */}
<button
  type="button"
  onClick={async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;

    // 1. ボタンを「処理中」の表示にして二重クリックを防ぐ
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "承認中...";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";

    try {
      // 2. サーバーアクションをインポートして実行
      const { acceptFriendRequest } = await import('./actions');
      await acceptFriendRequest(req.user_id);
      
      // 3. 完了したら画面をリロード（これで未承認リストからパッと消え、友達リストに入ります）
      window.location.reload();
    } catch (error) {
      console.error("承認に失敗しました:", error);
      alert("承認処理に失敗しました。もう一度お試しください。");
      
      // エラーが起きた場合はボタンを元の状態に戻す
      btn.disabled = false;
      btn.innerText = originalText;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }
  }}
  className="text-[10px] text-white px-4 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-all hover:opacity-90 flex items-center justify-center min-w-[60px]"
  style={{ backgroundColor: GOLD_COLOR }}
>
  承認
</button>
            </div>
          ))}
        </section>
      )}

      <FilteredTimeline 
        mainPosts={mainPosts} 
        replies={replies} 
        user={user} 
        friendIds={friendIds} 
        onSuccess={handlePostSuccess}
        viewModeProp={viewMode} 
      />
    </div>
  )
}

export default function Index() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all')

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setMounted(true) 
  }, [])

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
      <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
          Loading POSITIVES...
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 font-sans text-black dark:text-zinc-100 overflow-x-hidden transition-colors duration-200">
      
      {/* ナビゲーションバー */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 h-14 flex items-center px-4 transition-colors duration-200">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          
          {/* 左側：ロゴ */}
          <h1 className="text-lg font-black tracking-tighter shrink-0" style={{ color: GOLD_COLOR }}>POSITIVES</h1>
          
          {/* 中央：ヘッダー内切り替えスイッチ */}
          <div className="bg-gray-50 dark:bg-zinc-800 p-1 rounded-full flex gap-0.5 border border-gray-100 dark:border-zinc-700/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] mx-2">
            <button 
              onClick={() => setViewMode('all')} 
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'all' ? 'text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
              style={viewMode === 'all' ? { backgroundColor: GOLD_COLOR } : {}}
            >
              Public
            </button>
            <button 
              onClick={() => setViewMode('friends')} 
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'friends' ? 'text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
              style={viewMode === 'friends' ? { backgroundColor: GOLD_COLOR } : {}}
            >
              Friends
            </button>
          </div>

          {/* 右側：アバター画像 ＆ ダークモード切り替えトグル */}
          <div className="flex items-center gap-3 shrink-0">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200 active:scale-95 transition-all"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? (
                  <Sun size={18} strokeWidth={2.5} className="text-amber-500" />
                ) : (
                  <Moon size={18} strokeWidth={2.5} />
                )}
              </button>
            )}

            <Link href={user?.id ? `/users/${user.id}` : '/profile'} id="tutorial-step-profile-nav" className="hover:opacity-80 transition-opacity">
              <img src={profile?.avatar_url || defaultAvatar} className="w-8 h-8 rounded-full border shadow-sm object-cover bg-gray-100 dark:bg-zinc-800" style={{ borderColor: GOLD_COLOR }} alt="Profile" />
            </Link>
          </div>

        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <PullToRefresh>
          <MainTimelineContent user={user} viewMode={viewMode} />
        </PullToRefresh>
      </div>
    </main>
  )
}