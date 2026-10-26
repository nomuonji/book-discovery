/**
 * JSON-LD（構造化データ）ビルダー
 *
 * 記事ページ（src/app/books/[slug]/page.tsx）と同じ書き方に揃える:
 * `@context: "https://schema.org"` のオブジェクトを作り、<JsonLd> で
 * `<script type="application/ld+json">` としてそのまま埋め込む。
 *
 * 方針:
 * - ページに実際に並んでいるデータだけを入れる（冊数はデータから数える）。
 * - 評価・価格・レビュー・受賞などの推測値は入れない。
 * - ページ直下のノードの `description` は、同じページの `<meta name="description">`
 *   と同じ値にする。文面はここで組み立てず、各ページが
 *   src/lib/descriptions.ts の戻り値をそのまま渡す（2箇所で別々に作らない）。
 */

import { homeDescription } from "./descriptions";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, siteUrl } from "./seo";

export type JsonLdNode = Record<string, unknown>;

const CONTEXT = "https://schema.org";

/** サイト全体の基本情報。WebSite と Organization で同じ名前・URL・説明を使う。 */
export function webSiteNode(): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "A BOOK LEADS TO ANOTHER",
    url: siteUrl("/"),
    description: homeDescription(),
    inLanguage: "ja",
  };
}

export function organizationNode(): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl("/"),
    description: homeDescription(),
    logo: {
      "@type": "ImageObject",
      // 画像はページURLではないので、末尾スラッシュを付ける siteUrl() は使わない。
      url: `${SITE_URL}${DEFAULT_OG_IMAGE.url}`,
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** 正規化パス（例: "/categories/philosophy"） */
  path: string;
}

/** ページ内の導線と同じ順序でパンくずを組み立てる。 */
export function breadcrumbListNode(items: BreadcrumbItem[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export interface CollectionPageOptions {
  /** 一覧の見出し（<h1> と揃える） */
  name: string;
  description: string;
  path: string;
  /** 一覧に実際に並べている件数。並べていない場合は省略する。 */
  numberOfItems?: number;
  /** ItemList の並び順（例: 五十音順・読む順） */
  itemListOrder?: "ascending" | "descending";
}

/** /books/ /categories/* /paths/ /tags/* のような一覧ページ。 */
export function collectionPageNode(opts: CollectionPageOptions): JsonLdNode {
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: siteUrl(opts.path),
    inLanguage: "ja",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl("/"),
    },
  };

  if (typeof opts.numberOfItems === "number") {
    node.mainEntity = {
      "@type": "ItemList",
      numberOfItems: opts.numberOfItems,
      ...(opts.itemListOrder
        ? {
            itemListOrder:
              opts.itemListOrder === "ascending"
                ? "https://schema.org/ItemListOrderAscending"
                : "https://schema.org/ItemListOrderDescending",
          }
        : {}),
    };
  }

  return node;
}

export interface WebPageOptions {
  /** ページの見出し（<h1> と揃える） */
  name: string;
  description: string;
  path: string;
}

/** 一覧ではなく単一の道具・案内ページ（/recommend/ など）。 */
export function webPageNode(opts: WebPageOptions): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: siteUrl(opts.path),
    inLanguage: "ja",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl("/"),
    },
  };
}

export interface OrderedListItem {
  name: string;
  path: string;
}

/** 読書パスのように、ページ上で順番が決まっている一覧。 */
export function orderedItemListNode(name: string, items: OrderedListItem[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.path),
    })),
  };
}

export interface ProfilePageOptions {
  /** ページの見出し（<h1> と揃える） */
  name: string;
  path: string;
  personName: string;
  alternateName?: string;
  /** ページの説明。meta description と同じ値を渡す。 */
  description: string;
  /** 画面に出している著者紹介（Person 自身の説明。ページの説明とは別物） */
  personDescription?: string;
  /** 画面に出している国名（データ上の表記のまま） */
  country?: string;
}

/** 著者ページ。書誌ではなく「この書き手の棚」として Person を出す。 */
export function profilePageNode(opts: ProfilePageOptions): JsonLdNode {
  const person: JsonLdNode = {
    "@type": "Person",
    name: opts.personName,
  };
  if (opts.alternateName) person.alternateName = opts.alternateName;
  if (opts.personDescription) person.description = opts.personDescription;
  if (opts.country) person.nationality = opts.country;

  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    name: opts.name,
    description: opts.description,
    url: siteUrl(opts.path),
    inLanguage: "ja",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl("/"),
    },
    mainEntity: person,
  };
}
