import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { BottomNav } from "@/components/bottom-nav"; 
import AppTutorial from "@/components/app-tutorial"; 
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

// 💡 ライトモード時のベース背景色
const BEIGE_BG = "#F0EDE4";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const currentUserId = user?.id || '';

  return (
    // 💡 1. suppressHydrationWarning を追加してテーマ切り替え時のエラーを解消！
    <html lang="ja" suppressHydrationWarning>
      {/* 💡 2. style固定を廃止し、Tailwindでライト時（bg-[#F0EDE4]）とダーク時（dark:bg-zinc-950）の背景色を制御 */}
      <body className="text-black dark:text-zinc-100 bg-[#F0EDE4] dark:bg-zinc-950 min-h-screen transition-colors duration-200">
        <Providers>
          <AppTutorial />

          <Toaster position="top-center" />
          
          {/* 💡 3. メインコンテンツエリアの背景や文字色もダークモードに連動 */}
          <main className="min-h-screen pb-20 bg-[#F0EDE4] dark:bg-zinc-950 text-black dark:text-zinc-100 transition-colors duration-200">
            {children}
          </main>

          <BottomNav currentUserId={currentUserId} />
        </Providers>
      </body>
    </html>
  );
}