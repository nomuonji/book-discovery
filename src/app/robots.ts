import type { MetadataRoute } from "next";

// output: "export" (next.config.ts) には全ルートが静的である明示が必要
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    // 暫定: カスタムドメイン取得までは Cloudflare Pages の URL（layout.tsx / sitemap.ts / bot/config.ts も同様）。
    sitemap: "https://book-discovery-cu3.pages.dev/sitemap.xml",
  };
}
