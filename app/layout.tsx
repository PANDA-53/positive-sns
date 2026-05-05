import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers"; // 作成したProvidersをインポート

export const metadata: Metadata = {
  title: "POSITIVES",
  description: "心の平穏を守るSNS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-black">
        {/* Providersで全体を包むことで、配下のコンポーネントでTanStack Queryが使えるようになります */}
        <Providers>
          <Toaster position="top-center" />
          <main className="min-h-screen pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}