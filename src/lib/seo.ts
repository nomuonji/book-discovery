/**
 * SEO / OGP ヘルパー
 * 全ページ共通の openGraph・twitter・canonical を1箇所で組み立てる。
 * og:image は各ページが指定しない限り、ブランド入りのデフォルト画像にフォールバックする。
 */

import type { Metadata } from "next";

export const SITE_NAME = "読書の羅針盤";
export const SITE_URL = "https://books.antonbase.com";

export const DEFAULT_OG_IMAGE = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: "読書の羅針盤 — 世界の名作を、次の一冊に",
};

type OgImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export interface SeoOptions {
  title: string;
  description: string;
  /** 正規化パス（例: "/books/the-stranger"）。canonical と og:url に使う */
  path: string;
  type?: "website" | "book";
  /** og:image。未指定ならデフォルト画像 */
  images?: OgImage[];
  /** type: "book" のときの og:book:author */
  bookAuthors?: string[];
}

export function buildMetadata(opts: SeoOptions): Metadata {
  const canonical = `${SITE_URL}${opts.path}`;
  const images = opts.images && opts.images.length > 0 ? opts.images : [DEFAULT_OG_IMAGE];
  const twitterImage = images[0]?.url ?? DEFAULT_OG_IMAGE.url;

  const openGraph: Metadata["openGraph"] =
    opts.type === "book"
      ? {
          type: "book",
          title: opts.title,
          description: opts.description,
          url: canonical,
          siteName: SITE_NAME,
          locale: "ja_JP",
          images,
          authors: opts.bookAuthors ?? [],
        }
      : {
          type: "website",
          title: opts.title,
          description: opts.description,
          url: canonical,
          siteName: SITE_NAME,
          locale: "ja_JP",
          images,
        };

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [twitterImage],
    },
  };
}
