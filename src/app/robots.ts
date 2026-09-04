import type { MetadataRoute } from "next";
import { SITEMAP_URL } from "@/lib/seo";

// output: "export" (next.config.ts) には全ルートが静的である明示が必要
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: SITEMAP_URL,
  };
}
