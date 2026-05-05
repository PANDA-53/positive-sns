export const dynamic = 'force-dynamic';

import { createClient } from '../utils/supabase/server'
import { logout, acceptFriendRequest, deletePost, reportPost } from './actions'
import { Suspense } from 'react'
import { ReactionButtons } from '../components/reaction-buttons'
import { FriendButton } from '../components/friend-button'
import { ReportButton } from '../components/report-button'
import PostForm from '../components/post-form'
import ReplyForm from '../components/ReplyForm'
import Link from 'next/link'
import PullToRefresh from '../components/pull-to-refresh'
import { redirect } from 'next/navigation'

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp"

// --- データ取得・表示用コンポーネント ---
async function PostListContent({ user }: { user: any }) {
  const supabase = await createClient()
  
  const [postsRes, friendshipsRes] = await Promise.all([
    supabase.from('posts').select(`*, reactions (type, user_id)`).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
  ]);

  const posts = postsRes.data || [];
  const friendshipsRaw = friendshipsRes.data || [];

  const postUserIds = posts.map(p => p.user_id);
  const allFriendUserIds = friendshipsRaw.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
  const allRelevantUserIds = Array.from(new Set([...postUserIds, ...allFriendUserIds, user.id]));

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

  const formattedPosts = posts.map(post => {
    const reactions = post.reactions || [];
    const authorProfile = allProfiles?.find(p => p.id === post.user_id);
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

      {/* 投稿リスト */}
      <div className="space-y-3 pb-20">
        {mainPosts.map((post) => (
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
            
            {/* 動画表示：高さ制限を外し、横幅いっぱいに */}
            {post.video_url ? (
              <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                <video src={post.video_url} controls muted loop autoPlay playsInline className="w-full h-auto block" />
              </div>
            ) : post.image_url && (
              /* 画像表示：高さ制限を外し、横幅いっぱいに（余白解消） */
              <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                <img src={post.image_url} alt="" className="w-full h-auto block" />
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <ReactionButtons postId={post.id} awesomeCount={post.awesomeCount} hugCount={post.hugCount} initialMyReaction={post.myReaction} />
              {post.user_id !== user.id && <ReportButton postId={post.id} />}
            </div>
            
            {replies.some(r => r.parent_id === post.id) && (
              <div className="ml-6 mt-4 space-y-2 border-l-2 border-gray-50 pl-4 mb-4">
                {replies.filter(r => r.parent_id === post.id).map(reply => (
                  <div key={reply.id} className="bg-gray-50/50 p-2.5 rounded-xl group/reply relative">
                    <Link href={`/users/${reply.user_id}`} className="font-bold text-gray-500 block text-[10px] hover:underline">
                      {reply.authorProfile?.full_name || '匿名'}
                    </Link>
                    <span className="text-gray-700 text-xs leading-normal">{reply.content}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2">
              <ReplyForm parentId={post.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- メイン Index コンポーネント ---
export default async function Index() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const user = userData?.user

  // ★ 未ログインならログイン画面へ強制リダイレクト
  if (!user) {
    redirect('/login')
  }

  // 以下、ログイン済みの処理
  let currentUserProfile = null;
  const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
  currentUserProfile = data;

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-black pb-12 font-sans">
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex justify-between items-center">
          {/* ロゴエリア */}
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-lg font-black tracking-tighter">POSITIVES</h1>
          </Link>

          {/* アクションエリア */}
          <div className="flex items-center gap-2">
            {/* 検索ボタン */}
            <Link 
              href="/search" 
              className="p-2 text-gray-400 hover:text-black transition-colors rounded-xl hover:bg-gray-100"
              aria-label="検索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>

            <Link href={`/users/${user.id}`} className="p-1">
              <img 
                src={currentUserProfile?.avatar_url || defaultAvatar} 
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
          <Suspense fallback={
            <div className="animate-pulse space-y-4 w-full max-w-md mx-auto mt-10">
              <div className="h-32 bg-gray-200 rounded-[1.5rem]"></div>
              <div className="h-40 bg-gray-200 rounded-[1.5rem]"></div>
            </div>
          }>
            <PostListContent user={user} />
          </Suspense>
        </PullToRefresh>
      </div>
    </main>
  );
}