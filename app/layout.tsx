import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

// ベージュのカラーコードを定義
const BEIGE_BG = "#F0EDE4";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* 左右の余白までベージュにするため、bodyに色を指定 */}
      <body className="text-black" style={{ backgroundColor: BEIGE_BG }}>
        <Providers>
          <Toaster position="top-center" />
          {/* mainの背景色指定をなくし、bodyの色を透かします */}
          <main className="min-h-screen pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}