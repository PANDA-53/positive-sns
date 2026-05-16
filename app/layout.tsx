import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { BottomNav } from "@/components/bottom-nav"; 
// 🛠️ 1. 作成したチュートリアルコンポーネントをインポート
import AppTutorial from "@/components/app-tutorial"; 

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

const BEIGE_BG = "#F0EDE4";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="text-black" style={{ backgroundColor: BEIGE_BG }}>
        <Providers>
          {/* 🛠️ 2. ここに配置！これでアプリ起動時に初回だけチュートリアルが走ります */}
          <AppTutorial />

          <Toaster position="top-center" />
          <main className="min-h-screen pb-20">
            {children}
          </main>

          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}