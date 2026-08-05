import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages単体（Workerなし）で配信するための静的エクスポート。
  // 出力先は `out/`（Next.jsの仕様で固定。distDirでは変えられない）。
  // API routes・middleware・cookies()/headers() 等の動的APIは未使用なので対応可能。
  output: "export",
  images: {
    // next/imageのビルトイン最適化はサーバー機能（/_next/image）なので
    // 静的エクスポートでは使えない。表紙画像はOpen Library/Amazon側で
    // 既に軽量なので、最適化なしでそのまま配信する。
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
    ],
  },
};

export default nextConfig;
