// @ts-nocheck
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpackを強制する最小限の設定
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig);