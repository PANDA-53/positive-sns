import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ReactionButtons } from '@/components/reaction-buttons';
import Link from 'next/link';
import { Suspense } from 'react';

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";

// --- データ取得・表示用コンポーネント ---
async function UserContent({ id, currentUserId }: { id: string, currentUserId: string | undefined }) {
  const supabase = await createClient();

  const [profileRes, postsRes, friendshipRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('posts').select(`*, reactions (type, user_id)`).eq('user_id', id).is('parent_id', null).order('created_at', { ascending: false }),
    currentUserId ? supabase.from('friendships').select('status').or(`and(user_id.eq.${currentUserId},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${currentUserId})`).single() : { data: null }
  ]);

  const profile = profileRes.data;
  let userPosts = postsRes.data || [];
  const friendship = friendshipRes.data;

  if (!profile) notFound();

  const isMe = currentUserId === id;
  const isFriend = friendship?.status === 'accepted';

  // フロントエンド側での簡易フィルタリング（RLS設定までの繋ぎ）
  // 自分自身ではない、かつ友達でもない場合、privacy_levelがfriendsの投稿を除外
  if (!isMe && !isFriend) {
    userPosts = userPosts.filter(post => post.privacy_level !== 'friends');
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* プロフィールカード: 余白と角丸を調整 */}
      <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 mb-6 text-center relative overflow-hidden">
        <div className="relative inline-block mb-3">
          <img 
            src={profile.avatar_url || defaultAvatar} 
            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
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

      {/* 投稿リスト: カードの間隔を space-y-6 -> space-y-3 に削減 */}
      <div className="space-y-3 pb-10">
        {userPosts.length > 0 ? (
          userPosts.map((post) => {
            const reactions = post.reactions || [];
            return (
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
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black max-h-[400px] flex items-center justify-center">
                    <video src={post.video_url} controls muted loop autoPlay playsInline className="w-full h-auto max-h-[400px] object-contain" />
                  </div>
                ) : post.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 max-h-[400px] flex items-center justify-center">
                    <img src={post.image_url} alt="" className="w-full h-auto object-contain max-h-[400px]" />
                  </div>
                )}

                <div className="flex items-center">
                  <ReactionButtons 
                    postId={post.id} 
                    awesomeCount={reactions.filter((r: any) => r.type === 'awesome').length}
                    hugCount={reactions.filter((r: any) => r.type === 'hug').length}
                    initialMyReaction={currentUserId ? reactions.find((r: any) => r.user_id === currentUserId)?.type : null} 
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white/50 rounded-[1.5rem] border border-dashed border-gray-300 text-gray-400 text-xs">
            投稿はまだありません
          </div>
        )}
      </div>
    </div>
  );
}

// --- メインページ ---
export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#F2F2F2] pb-12 font-sans text-black">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-4">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            <span></span>
          </Link>
        </div>
      </nav>

      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 animate-pulse">
          <div className="bg-white rounded-[1.5rem] h-48 mb-6"></div>
          <div className="space-y-3">
            <div className="bg-white rounded-[1.5rem] h-32"></div>
            <div className="bg-white rounded-[1.5rem] h-32"></div>
          </div>
        </div>
      }>
        <UserContent id={id} currentUserId={currentUser?.id} />
      </Suspense>
    </main>
  );
}