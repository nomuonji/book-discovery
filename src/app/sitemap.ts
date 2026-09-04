import type { MetadataRoute } from "next";
import {
  getAllBooks,
  getAllPaths,
  getAllCategories,
  getAllAuthors,
  getAllTags,
  isIndexableAuthor,
  isIndexableTag,
} from "@/lib/data";
import { siteUrl } from "@/lib/seo";

// output: "export" (next.config.ts) には全ルートが静的である明示が必要
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl("/books"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: siteUrl("/paths"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: siteUrl("/recommend"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // カテゴリページ
  for (const cat of getAllCategories()) {
    routes.push({
      url: siteUrl(`/categories/${cat.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // 本の詳細ページ
  for (const book of getAllBooks()) {
    routes.push({
      url: siteUrl(`/books/${book.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // 読書パス詳細
  for (const path of getAllPaths()) {
    routes.push({
      url: siteUrl(`/paths/${path.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // 著者ページ
  for (const author of getAllAuthors().filter(isIndexableAuthor)) {
    routes.push({
      url: siteUrl(`/authors/${author.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  // タグページ
  for (const tag of getAllTags().filter(isIndexableTag)) {
    routes.push({
      url: siteUrl(`/tags/${encodeURIComponent(tag.slug)}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return routes;
}
