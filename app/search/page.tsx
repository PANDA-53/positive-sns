import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { FriendButton } from '@/components/friend-button';
import { Suspense } from 'react';

const defaultAvatar = "https://www.gravatar.com/avatar/?d=mp";
const GOLD_COLOR = "#B8860B";

// --- 検索結果を表示するコンポーネント ---
async function SearchResults({ query, currentUserId }: { query: string, currentUserId: string }) {
  const supabase = await createClient();

  if (!query) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-zinc-500 text-xs italic">
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
      <div className="text-center py-20 text-gray-400 dark:text-zinc-500 text-xs">
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

        // 💡 修正箇所：FriendButtonの新しいステータス型に完全に同期させる
        let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
        if (relation) {
          if (relation.status === 'accepted') {
            friendshipStatus = 'accepted';
          } else if (relation.status === 'pending') {
            friendshipStatus = relation.user_id === currentUserId ? 'pending_sent' : 'pending_received';
          }
        }

        return (
          /* 💡 修正箇所：カード枠と背景を他ページと同じシブいトーンに変更 */
          <div key={user.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-all hover:border-gray-200 dark:hover:border-zinc-700/60 duration-200">
            <Link href={`/users/${user.id}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <img 
                src={user.avatar_url || defaultAvatar} 
                className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950" 
                alt="" 
              />
              <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">{user.full_name}</span>
            </Link>
            {/* 💡 同期した新しい friendshipStatus を安全に渡します */}
            <FriendButton targetUserId={user.id} initialStatus={friendshipStatus} />
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
    /* 💡 修正箇所：全体の背景をダークモード時にベースの濃いグレー（zinc-950）に統一 */
    <main className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 font-sans text-black dark:text-zinc-100 pb-20 transition-colors duration-200">
      
      {/* 検索ナビゲーション */}
      {/* 💡 修正箇所：ナビバーを他ページと同じく透過・磨りガラス加工（backdrop-blur）のダークトーンに変更 */}
      <nav className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 p-4 transition-colors duration-200">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <form action="/search" method="GET" className="flex-1">
            {/* 💡 修正箇所：インプット欄の背景・文字色をダークモードに対応 */}
            <input 
              type="text" 
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="名前で検索..."
              className="w-full bg-gray-100 dark:bg-zinc-950 border border-transparent dark:border-zinc-800/80 text-black dark:text-zinc-100 rounded-full px-5 py-2.5 text-base outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
            />
          </form>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="px-1 mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_COLOR }}>User Search</h2>
        </div>

        {/* スケルトンローディングのダークモード対応 */}
        <Suspense fallback={
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm"></div>
            ))}
          </div>
        }>
          <SearchResults query={query} currentUserId={user.id} />
        </Suspense>
      </div>
    </main>
  );
}