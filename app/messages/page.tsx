// app/messages/page.tsx

import { fetchChatHistoryList } from '@/app/actions';
import { createClient } from '@/utils/supabase/server'; 
import MessageClient from './MessageClient';

export const dynamic = 'force-dynamic';

const GOLD_COLOR = "#B8860B";

async function fetchOnlyFriendsList() {
  const supabase = await createClient();
  
  // 1. ログイン中の自分自身のユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 2. 自分が「user_id側」で、ステータスが「accepted」の友達のプロフィールを取得
  const { data: sentMatches, error: sentError } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      profiles!friendships_friend_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  // 3. 相手から申請されて自分が承認したパターン（自分が friend_id側）も同様に取得
  const { data: receivedMatches, error: receivedError } = await supabase
    .from('friendships')
    .select(`
      user_id,
      profiles!friendships_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('friend_id', user.id)
    .eq('status', 'accepted');

  // 万が一外部キー名（fkey）の自動推測で型エラーや取得漏れが出る場合の「超安全な代替ルート」
  if (sentError || receivedError) {
    console.warn("Joinクエリに失敗したため、安全な2段階取得に切り替えます。");
    
    const { data: allLinks } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!allLinks || allLinks.length === 0) return [];

    const targetIds = allLinks.map(link => 
      link.user_id === user.id ? link.friend_id : link.user_id
    );

    const { data: friendsProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', targetIds);

    return friendsProfiles || [];
  }

  // 4. 取得したデータを綺麗にマージする処理
  const friendsList: any[] = [];
  const addedIds = new Set<string>();

  if (sentMatches) {
    sentMatches.forEach((item: any) => {
      if (item.profiles && !addedIds.has(item.profiles.id)) {
        friendsList.push(item.profiles);
        addedIds.add(item.profiles.id);
      }
    });
  }

  if (receivedMatches) {
    receivedMatches.forEach((item: any) => {
      if (item.profiles && !addedIds.has(item.profiles.id)) {
        friendsList.push(item.profiles);
        addedIds.add(item.profiles.id);
      }
    });
  }

  return friendsList;
}

export default async function MessagesPage() {
  const [chatList, allFriends] = await Promise.all([
    fetchChatHistoryList(),
    fetchOnlyFriendsList()
  ]);

  return (
    /* 💡 修正箇所1: 画面全体の背景色を dark:bg-zinc-950、文字色を dark:text-zinc-100 に対応 */
    <main className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-950 pb-12 font-sans text-black dark:text-zinc-100 transition-colors duration-200">
      
      {/* 💡 修正箇所2: ヘッダーナビゲーションの背景、ぼかし、下境界線をダーク対応 */}
      <nav className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-[11px] font-black uppercase tracking-widest" style={{ color: GOLD_COLOR }}>
            Messages
          </h1>
        </div>
      </nav>

      {/* 💡 修正箇所3: 内部のクライアントコンポーネントへマージしたデータをパス */}
      <MessageClient initialChatList={chatList} allFriends={allFriends} />
    </main>
  );
}