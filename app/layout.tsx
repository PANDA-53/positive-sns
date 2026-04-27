import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timeline",
  description: "Tree stability monitoring social app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Timeline",
  },
};

// スワイプ更新を有効にするための設定
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // maximumScaleとuserScalableを緩めることで、ブラウザの標準挙動（更新）を許可します
  maximumScale: 5, 
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      // touch-actionを明示的に指定して、ブラウザのバウンス挙動を助けます
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-blue-100`}
      style={{ overscrollBehaviorY: 'auto' }}
    >
      <body className="min-h-full flex flex-col bg-[#F2F2F2] overscroll-y-auto">
        {children}
      </body>
    </html>
  );
}