import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { BottomNav } from "@/components/bottom-nav"; 
import AppTutorial from "@/components/app-tutorial"; 
// 🛠️ 1. ユーザーID取得のために Supabase のサーバークライアントをインポート
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

const BEIGE_BG = "#F0EDE4";

// 🛠️ 2. 関数名の前に `async` を付与して非同期処理を可能にする
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🛠️ 3. Supabase からログイン中のユーザー情報を取得する
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // ユーザーIDを抽出（ログインしていない場合は安全に空文字を渡す）
  const currentUserId = user?.id || '';

  return (
    <html lang="ja">
      <body className="text-black" style={{ backgroundColor: BEIGE_BG }}>
        <Providers>
          <AppTutorial />

          <Toaster position="top-center" />
          <main className="min-h-screen pb-20">
            {children}
          </main>

          {/* 🛠️ 4. 取得した currentUserId を BottomNav に注入する */}
          <BottomNav currentUserId={currentUserId} />
        </Providers>
      </body>
    </html>
  );
}