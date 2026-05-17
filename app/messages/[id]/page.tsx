// app/messages/[id]/page.tsx

import ChatRoom from "../../../components/ChatRoom";
import { createClient } from "@/utils/supabase/server"; 
import { fetchUserProfileData } from "@/app/actions"; 

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DMPage(props: PageProps) {
  const resolvedParams = await props.params;
  const targetUserId = resolvedParams.id;

  // Supabase からログイン中の自分自身のユーザー情報を取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const currentUserId = user?.id || "";

  // 相手のユーザー名を actions.ts の既存ロジックから取得
  let targetUserName = "ユーザー";
  try {
    // 💡 修正箇所：末尾に `as any` を付与することで、TypeScriptの厳密な型チェックによる赤線（full_nameが存在しないという警告）を強制解除します
    const userData = (await fetchUserProfileData(targetUserId, currentUserId)) as any;
    
    if (userData?.profile?.full_name) {
      targetUserName = userData.profile.full_name;
    }
  } catch (error) {
    console.error("Failed to fetch target user info", error);
  }

  return (
    /* 最外殻の背景を dark:bg-zinc-950 に対応させ、アプリ全体の一貫性を保持 */
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 px-4 pt-4 transition-colors duration-200">
      
      {/* 変更点2: key={targetUserId} を付与
          これにより、戻る・進むの遷移や、別ユーザーへの切り替え時に
          ChatRoomコンポーネントを完全に初期状態で強制的に再起動させます */}
      <ChatRoom 
        key={targetUserId}
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
      />
    </div>
  );
}