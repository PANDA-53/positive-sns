export const dynamic = 'force-dynamic';

import { createClient } from '../utils/supabase/server'
import { logout, acceptFriendRequest } from './actions'
import { Suspense } from 'react'
import PostForm from '../components/post-form'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import FilteredTimeline from '../components/FilteredTimeline'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

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
        読み込みエラー: {postsRes.error.message}
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

  // 3. データの整形
  const formattedPosts = (posts || []).map(post => {
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
  const friendIds = Array.from(uniqueFriendIds) as string[];

  return (
    <div className="space-y-4">
      <section className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {acceptedFriends.length > 0 ? (
            acceptedFriends.map((friend: any) => (
              <Link key={friend.id} href={`/users/${friend.id}`} className="flex flex-col items-center gap-1 shrink-0 w-14">
                <img src={friend.avatar_url || defaultAvatar} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                <span className="text-[9px] font-bold text-gray-500 truncate w-full text-center">{friend.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="text-[10px] text-gray-400 italic">友達がまだいません</p>
          )}
        </div>
      </section>

      {pendingRequests.length > 0 && (
        <section className="bg-blue-50 p-4 rounded-[1.5rem] border border-blue-100 space-y-2">
          {pendingRequests.map((req: any) => (
            <div key={req.user_id} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
              <span className="font-bold text-xs">{req.sender_profile?.full_name}さんから申請</span>
              <form action={acceptFriendRequest}>
                <input type="hidden" name="requesterId" value={req.user_id} />
                <button type="submit" className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold">承認</button>
              </form>
            </div>
          ))}
        </section>
      )}

      <PostForm />

      <FilteredTimeline 
        mainPosts={mainPosts} 
        replies={replies} 
        user={user} 
        friendIds={friendIds} 
      />
    </div>
  );
}

export default async function Index() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const user = userData?.user

  let currentUserProfile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    currentUserProfile = data
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] pb-10 overflow-x-hidden">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          <h1 className="text-lg font-black text-green-700 tracking-tighter">POSITIVES</h1>
          {user && (
            <div className="flex items-center gap-3">
              <Link href={`/users/${user.id}`}>
                <img src={currentUserProfile?.avatar_url || defaultAvatar} className="w-7 h-7 rounded-full border shadow-sm object-cover" alt="" />
              </Link>
              {/* 復活させた設定ボタン */}
              <Link href="/profile" className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">
                設定
              </Link>
              <form action={logout}>
                <button className="text-[10px] font-bold text-gray-400">LOGOUT</button>
              </form>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {user ? (
          <PullToRefresh>
            <Suspense fallback={<div className="text-center p-10 text-xs font-bold text-gray-400 animate-pulse">LOADING...</div>}>
              <PostListContent user={user} />
            </Suspense>
          </PullToRefresh>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border shadow-sm px-6">
            <h2 className="text-xl font-bold mb-6">ポジティブなSNSを始めよう</h2>
            <Link href="/login" className="bg-green-600 text-white px-10 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition-colors">ログインして始める</Link>
          </div>
        )}
      </div>
    </main>
  );
}