import type { MetadataRoute } from "next";

// output: "export" (next.config.ts) には全ルートが静的である明示が必要
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://books.antonbase.com/sitemap.xml",
  };
}
