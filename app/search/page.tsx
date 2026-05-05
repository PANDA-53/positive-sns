import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { FriendButton } from '@/components/friend-button';
import { Suspense } from 'react';

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";

// --- 検索結果を表示するコンポーネント ---
async function SearchResults({ query, currentUserId }: { query: string, currentUserId: string }) {
  const supabase = await createClient();

  if (!query) {
    return (
      <div className="text-center py-20 text-gray-400 text-xs italic">
        名前を入力して友達を探してみよう
      </div>
    );
  }

  // プロフィールを検索（自分以外）
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${query}%`)
    .neq('id', currentUserId)
    .limit(20);

  // 友達状態を取得
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 text-xs">
        ユーザーが見つかりませんでした
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const relation = friendships?.find(f => 
          (f.user_id === currentUserId && f.friend_id === user.id) || 
          (f.user_id === user.id && f.friend_id === currentUserId)
        );
        const status = relation?.status || 'none';

        return (
          <div key={user.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:border-gray-200">
            <Link href={`/users/${user.id}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <img 
                src={user.avatar_url || defaultAvatar} 
                className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                alt="" 
              />
              <span className="text-sm font-bold text-gray-800">{user.full_name}</span>
            </Link>
            <FriendButton targetUserId={user.id} initialStatus={status} />
          </div>
        );
      })}
    </div>
  );
}

// --- メインページコンポーネント ---
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: query = '' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#F2F2F2] font-sans text-black pb-20">
      {/* 検索ナビゲーション */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-black transition-colors rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <form action="/search" method="GET" className="flex-1">
            <input 
              type="text" 
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="名前で検索..."
              className="w-full bg-gray-100 border-none rounded-full px-5 py-2.5 text-base outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
          </form>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="px-1 mb-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Search</h2>
        </div>

        <Suspense fallback={
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        }>
          <SearchResults query={query} currentUserId={user.id} />
        </Suspense>
      </div>
    </main>
  );
}