// app/messages/[id]/page.tsx

import ChatRoom from "../../../components/ChatRoom";
import { createClient } from "@/utils/supabase/server"; 
import { fetchUserProfileData } from "@/app/actions"; 

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DMPage({ params }: PageProps) {
  const resolvedParams = await params;
  const targetUserId = resolvedParams.id;

  // Supabase からログイン中の自分自身のユーザー情報を取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const currentUserId = user?.id || "";

  // 相手のユーザー名を actions.ts の既存ロジックから取得
  let targetUserName = "ユーザー";
  try {
    const userData = await fetchUserProfileData(targetUserId, currentUserId);
    if (userData?.profile?.full_name) {
      targetUserName = userData.profile.full_name;
    }
  } catch (error) {
    console.error("Failed to fetch target user info", error);
  }

  return (
    /* 💡 修正箇所: 最外殻の背景を dark:bg-zinc-950 に対応させ、一貫性を持たせます */
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 px-4 pt-4 transition-colors duration-200">
      
      {/* 💡 変更点2: key={targetUserId} を付与します。
          これにより、BACKで戻って再度入ってきた時に、Next.jsがキャッシュを使い回さず、
          ChatRoomコンポーネントを完全にまっさらな状態で強制的に再起動してくれます。 */}
      <ChatRoom 
        key={targetUserId}
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
      />
    </div>
  );
}