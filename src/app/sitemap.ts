import type { MetadataRoute } from "next";
import { getAllBooks, getAllPaths, getAllCategories, getAllAuthors, getAllTags } from "@/lib/data";

// output: "export" (next.config.ts) には全ルートが静的である明示が必要
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://reading-compass.vercel.app";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/paths`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/recommend`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // カテゴリページ
  for (const cat of getAllCategories()) {
    routes.push({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // 本の詳細ページ
  for (const book of getAllBooks()) {
    routes.push({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // 読書パス詳細
  for (const path of getAllPaths()) {
    routes.push({
      url: `${baseUrl}/paths/${path.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // 著者ページ
  for (const author of getAllAuthors()) {
    routes.push({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  // タグページ
  for (const tag of getAllTags()) {
    routes.push({
      url: `${baseUrl}/tags/${encodeURIComponent(tag.slug)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return routes;
}
