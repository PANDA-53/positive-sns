export const dynamic = 'force-dynamic';

import { createClient } from '../utils/supabase/server'
import { logout, acceptFriendRequest } from './actions'
import { Suspense } from 'react'
import PostForm from '../components/post-form'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import FilteredTimeline from '../components/FilteredTimeline' // 新設するコンポーネント

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

// --- データ取得・表示用コンポーネント ---
async function PostListContent({ user }: { user: any }) {
  const supabase = await createClient()
  
  // 1. データの取得
  const [postsRes, friendshipsRes] = await Promise.all([
    supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
  ]);

  if (postsRes.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs">
        データの取得に失敗しました: {postsRes.error.message}
      </div>
    );
  }

  const posts = postsRes.data || [];
  const friendshipsRaw = friendshipsRes.data || [];

  // 2. プロフィール情報の取得
  const postUserIds = posts.map(p => p.user_id);
  const allFriendUserIds = friendshipsRaw.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
  const allRelevantUserIds = Array.from(new Set([...postUserIds, ...allFriendUserIds, user.id])).filter(Boolean);

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', allRelevantUserIds);

  // 申請中・友達リストの整理
  const pendingRequests = friendshipsRaw
    .filter(f => String(f.friend_id) === String(user.id) && f.status === 'pending')
    .map(f => ({
      user_id: f.user_id,
      sender_profile: allProfiles?.find(p => p.id === f.user_id)
    })).filter(req => req.sender_profile);

  const uniqueFriendIds = new Set(
    friendshipsRaw.filter(f => f.status === 'accepted').map(f => (String(f.user_id) === String(user.id) ? f.friend_id : f.user_id))
  );
  const acceptedFriends = Array.from(uniqueFriendIds).map(id => allProfiles?.find(p => id === p.id)).filter(Boolean);

  // データの整形（リテラル型の整理）
  const formattedPosts = posts.map(post => {
    const reactions = post.reactions || [];
    const authorProfile = allProfiles?.find(p => p.id === post.user_id) || {
      full_name: '匿名ユーザー',
      avatar_url: defaultAvatar
    };
    
    const relation = friendshipsRaw.find(f => 
      (String(f.user_id) === String(user.id) && String(f.friend_id) === String(post.user_id)) || 
      (String(f.user_id) === String(post.user_id) && String(f.friend_id) === String(user.id))
    );
    
    return {
      ...post,
      authorProfile,
      awesomeCount: reactions.filter((r: any) => r.type === 'awesome').length,
      hugCount: reactions.filter((r: any) => r.type === 'hug').length,
      myReaction: reactions.find((r: any) => r.user_id === user.id)?.type || null,
      friendStatus: post.user_id === user.id ? 'me' : (relation?.status || 'none')
    };
  });

  const mainPosts = formattedPosts.filter(p => !p.parent_id);
  const replies = formattedPosts.filter(p => p.parent_id);

  // 友達IDの配列化（クライアント側に渡す用）
  const friendIds = Array.from(uniqueFriendIds) as string[];

  return (
    <div className="space-y-4">
      {/* 友達一覧アイコン */}
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

      {/* 申請通知 */}
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
                  <button type="submit" className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold shadow-sm hover:bg-blue-700">承認</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 投稿フォーム */}
      <section><PostForm /></section>

      {/* ★ フィルタリング機能付きタイムラインを表示 ★ */}
      {mainPosts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[1.5rem] border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">まだ投稿がありません。</p>
        </div>
      ) : (
        <FilteredTimeline 
          mainPosts={mainPosts} 
          replies={replies} 
          user={user} 
          friendIds={friendIds} 
        />
      )}
    </div>
  );
}

// --- メイン Index コンポーネント ---
export default async function Index() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const user = userData?.user

  let currentUserProfile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
    currentUserProfile = data;
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-black pb-12 font-sans">
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-tight text-green-700">POSITIVES</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href={`/users/${user.id}`} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
                  <img src={currentUserProfile?.avatar_url || defaultAvatar} className="w-7 h-7 rounded-full object-cover border border-gray-200 shadow-sm" alt="My Avatar" />
                  <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate hidden sm:block">
                    {currentUserProfile?.full_name || 'ユーザー'}
                  </span>
                </Link>
                <Link href="/profile" className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">設定</Link>
                <form action={logout}>
                  <button className="text-[10px] bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold hover:bg-gray-50">ログアウト</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-xs bg-black text-white px-5 py-2 rounded-full font-bold">ログイン</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {user ? (
          <PullToRefresh>
            <Suspense fallback={<div className="p-10 text-center animate-pulse">読み込み中...</div>}>
              <PostListContent user={user} />
            </Suspense>
          </PullToRefresh>
        ) : (
          <div className="text-center py-20">
             <h2 className="text-xl font-bold mb-4">POSITIVESへようこそ</h2>
             <Link href="/login" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold inline-block">ログインする</Link>
          </div>
        )}
      </div>
    </main>
  );
}