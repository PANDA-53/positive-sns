// @ts-nocheck
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 警告が出ていた turbo: {} を削除しました
    // 動画アップロードのために追加した制限拡張設定
    serverActions: {
      bodySizeLimit: '50mb', 
    },
  },
  // webpack設定を明示的に記述
  webpack: (config) => {
    return config;
  },
};

// PWA設定で包んだ nextConfig を一度だけエクスポートする
export default withPWA(nextConfig);