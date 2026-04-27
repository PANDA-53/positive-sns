// @ts-nocheck
import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Webpackを強制するための設定（Vercelのビルドエラー対策）
  webpack: (config) => {
    return config;
  },
};

// 最後にこれを追加することで、設定が有効になります
export default withPWA(nextConfig);