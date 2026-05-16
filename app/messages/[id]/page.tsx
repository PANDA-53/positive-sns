import ChatRoom from "../../../components/ChatRoom";
import { createClient } from "@/utils/supabase/server"; // 💡 サーバー側のクラインアントをインポート
import { fetchUserProfileData } from "@/app/actions"; // 💡 プロフィールを引く既存のaction

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
  
  // ログインしていない場合はとりあえず空文字にするか、ログインへリダイレクト等の処理
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
    <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center p-4">
      {/* 💡 取得した本物の currentUserId を渡すことで、ChatRoom側で「自分」だと認識できるようになります */}
      <ChatRoom 
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
      />
    </div>
  );
}