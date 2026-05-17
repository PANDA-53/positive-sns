// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { BottomNav } from "@/components/bottom-nav"; 
import AppTutorial from "@/components/app-tutorial"; 
import { PushInitializer } from "@/components/push-initializer";

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 💡 サーバー通信（getUser）を排除し、純粋なレイアウト枠として超高速化します。
  // currentUserId が必要なコンポーネントは、内部の useEffect や各ページ側で安全に取得・処理させます。

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="text-black dark:text-zinc-100 bg-[#F0EDE4] dark:bg-zinc-950 min-h-screen transition-colors duration-200">
        <Providers>
          {/* 💡 currentUserId が空文字でも、Initializer や Nav 側が内部でエラーを起こさないようにガードして配置 */}
          <PushInitializer currentUserId="" />

          <AppTutorial />

          <Toaster position="top-center" />
          
          <main className="min-h-screen pb-20 bg-[#F0EDE4] dark:bg-zinc-950 text-black dark:text-zinc-100 transition-colors duration-200">
            {children}
          </main>

          <BottomNav currentUserId="" />
        </Providers>
      </body>
    </html>
  );
}
