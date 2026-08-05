/**
 * コンテンツ選択とテンプレート描画
 *
 * - 既存の書籍データ（categories/*.json）から投稿素材を組み立てる
 * - 曜日・時間スロットから決定的に選ぶ（状態に依存せず再実行可能）
 * - 直近で投稿済みの本・パス・著者・レコメンドはスキップする（state 参照）
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { PostContent, PostType } from "./types";
import { wasPostedRecently } from "./state";

// ------------------------------------------------------------
// データ読み込み（Next.js の @/ エイリアスを使わず fs で読む）
// ------------------------------------------------------------

interface BookRecord {
  slug: string;
  title: string;
  titleJa: string;
  author: string;
  authorJa: string;
  country: string;
  year: number;
  genre: string[];
  coverUrl: string;
  asin?: string;
  descriptionJa: string;
  whyReadJa: string;
  selectionReasonJa?: string;
  tags: string[];
}

const CATEGORY_FILES = [
  "philosophy",
  "world-fiction",
  "contemporary-fiction",
  "classic-fiction",
  "nonfiction",
  "sf-fantasy",
];

const DATA_DIR = path.join(__dirname, "..", "src", "data");

let _books: BookRecord[] | null = null;

function getAllBooks(): BookRecord[] {
  if (_books) return _books;
  const books: BookRecord[] = [];
  const seen = new Set<string>();
  for (const file of CATEGORY_FILES) {
    const raw = fs.readFileSync(path.join(DATA_DIR, "categories", `${file}.json`), "utf-8");
    const parsed = JSON.parse(raw) as { books: BookRecord[] };
    for (const b of parsed.books) {
      if (!seen.has(b.slug)) {
        seen.add(b.slug);
        books.push(b);
      }
    }
  }
  _books = books;
  return books;
}

function getBookBySlug(slug: string): BookRecord | undefined {
  return getAllBooks().find((b) => b.slug === slug);
}

interface RecRecord {
  fromSlug: string;
  toSlug: string;
  reasonJa: string;
  type: string;
}

function getAllRecommendations(): RecRecord[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, "recommendations.json"), "utf-8");
  const parsed = JSON.parse(raw) as { recommendations: RecRecord[] };
  return parsed.recommendations;
}

interface PathRecord {
  slug: string;
  titleJa: string;
  descriptionJa: string;
  difficulty: number;
  steps: { order: number; bookSlug: string; noteJa: string; keyConceptJa: string }[];
}

function getAllPaths(): PathRecord[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, "paths.json"), "utf-8");
  const parsed = JSON.parse(raw) as { paths: PathRecord[] };
  return parsed.paths;
}

interface AuthorRecord {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  books: BookRecord[];
}

/** 書籍データから著者プールを生成（bioJa は空なので、収録作品で構成する） */
function getAllAuthors(): AuthorRecord[] {
  const map = new Map<string, AuthorRecord>();
  for (const book of getAllBooks()) {
    const slug = book.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!map.has(slug)) {
      map.set(slug, { slug, name: book.author, nameJa: book.authorJa, country: book.country, books: [] });
    }
    map.get(slug)!.books.push(book);
  }
  return Array.from(map.values()).sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
}

// ------------------------------------------------------------
// スケジュール計算（JST基準・決定的）
// ------------------------------------------------------------

const TYPE_SEQUENCE: PostType[] = ["book", "recommend", "book", "path", "author", "book", "recommend"];

/** 日本標準時（UTC+9）の日番号（決定的スケジュールの基準） */
export function jstDayNumber(date = new Date()): number {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return Math.floor(jst.getTime() / (24 * 60 * 60 * 1000));
}

/** 0-based のグローバルスロット番号（日×投稿数/日 + 日内スロット） */
export function globalSlot(dayNumber: number, postsPerDay: number, slotInDay: number): number {
  return dayNumber * postsPerDay + slotInDay;
}

export function typeForSlot(globalIdx: number): PostType {
  return TYPE_SEQUENCE[((globalIdx % TYPE_SEQUENCE.length) + TYPE_SEQUENCE.length) % TYPE_SEQUENCE.length];
}

/** そのタイプが何回目に登場するか（0-based）。タイプごとに独立して進む */
function occurrenceOfType(globalIdx: number, type: PostType): number {
  const seqLen = TYPE_SEQUENCE.length;
  const full = Math.floor(globalIdx / seqLen);
  const rem = globalIdx % seqLen;
  const countInPrefix = TYPE_SEQUENCE.slice(0, rem).filter((t) => t === type).length;
  const countPerFull = TYPE_SEQUENCE.filter((t) => t === type).length;
  return full * countPerFull + countInPrefix;
}

// ------------------------------------------------------------
// プールからの選択（直近投稿をスキップ）
// ------------------------------------------------------------

function selectFromPool<T>(
  pool: T[],
  occurrence: number,
  dedupeKeyOf: (item: T) => string,
  maxLookbackDays: number
): T | undefined {
  if (pool.length === 0) return undefined;
  const start = ((occurrence % pool.length) + pool.length) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const idx = (start + i) % pool.length;
    const item = pool[idx];
    if (!wasPostedRecently(dedupeKeyOf(item), maxLookbackDays)) return item;
  }
  return undefined;
}

// ------------------------------------------------------------
// テキスト組み立てヘルパー
// ------------------------------------------------------------

/** ハッシュタグとして安全な文字のみ残す */
function sanitizeHashtag(tag: string): string {
  return tag.replace(/[\s・—\-/]/g, "").replace(/[^\p{L}\p{N}_]/gu, "");
}

function buildHashtags(extraTags: string[], platform: string): string[] {
  const base = platform === "x" ? ["#読書", "#海外文学"] : ["#読書"];
  const extras = extraTags
    .slice(0, 2)
    .map(sanitizeHashtag)
    .filter(Boolean)
    .map((t) => `#${t}`);
  return [...base, ...extras];
}

/** 本文が maxLen を超えないよう main 部分を丸める */
function fitText(main: string, prefix: string, suffix: string, maxLen: number): string {
  const prefixPart = prefix.endsWith("\n") ? prefix : `${prefix}\n`;
  const budget = maxLen - prefixPart.length - suffix.length;
  if (budget <= 0) return prefixPart + suffix.slice(0, Math.max(0, maxLen - prefixPart.length));
  const fitted = main.length <= budget ? main : main.slice(0, budget - 1) + "…";
  return prefixPart + fitted + suffix;
}

// ------------------------------------------------------------
// テンプレート
// ------------------------------------------------------------

export interface BuildOptions {
  platform: "x" | "threads" | "instagram";
  siteUrl: string;
  globalIdx: number;
  maxLookbackDays: number;
}

function maxLenFor(platform: BuildOptions["platform"]): number {
  return platform === "x" ? 280 : platform === "threads" ? 500 : 2200;
}

export function buildBookContent(book: BookRecord, opts: BuildOptions): PostContent {
  const url = `${opts.siteUrl}/books/${book.slug}?utm_source=${opts.platform}&utm_medium=social&utm_campaign=book`;
  const head = `📖 今日の一冊\n\n『${book.titleJa}』${book.authorJa}\n${book.country}・${book.year}`;
  const main = book.selectionReasonJa || book.whyReadJa || book.descriptionJa;
  const hashtags = buildHashtags(book.tags, opts.platform).join(" ");
  const tail = `\n\n${hashtags}\n🔗 ${url}`;
  const maxLen = maxLenFor(opts.platform);
  const text = fitText(main, head, tail, maxLen);
  return {
    type: "book",
    slug: book.slug,
    text,
    imageUrl: book.coverUrl,
    campaign: "book",
    dedupeKey: `book:${book.slug}`,
  };
}

export function buildRecommendContent(from: BookRecord, to: BookRecord, reason: string, opts: BuildOptions): PostContent {
  const url = `${opts.siteUrl}/books/${to.slug}?utm_source=${opts.platform}&utm_medium=social&utm_campaign=recommend`;
  const head = `🎯 『${from.titleJa}』が好きなら\n\n→ 『${to.titleJa}』（${to.authorJa}）\n`;
  const hashtags = buildHashtags(to.tags, opts.platform).join(" ");
  const tail = `\n\n${hashtags}\n🔗 ${url}`;
  const maxLen = maxLenFor(opts.platform);
  const text = fitText(reason, head, tail, maxLen);
  return {
    type: "recommend",
    slug: to.slug,
    text,
    imageUrl: to.coverUrl,
    campaign: "recommend",
    dedupeKey: `recommend:${from.slug}>${to.slug}`,
  };
}

export function buildPathContent(p: PathRecord, opts: BuildOptions): PostContent {
  const url = `${opts.siteUrl}/paths/${p.slug}?utm_source=${opts.platform}&utm_medium=social&utm_campaign=path`;
  const firstStep = p.steps[0];
  const coverBook = firstStep ? getBookBySlug(firstStep.bookSlug) : undefined;

  const head = `🗺️ 読書パス「${p.titleJa}」\n`;
  const stepLine = p.steps
    .slice(0, 3)
    .map((s) => getBookBySlug(s.bookSlug)?.titleJa ?? s.bookSlug)
    .join(" → ");
  const hashtags = buildHashtags(["読書メモ"], opts.platform).join(" ");
  const tail = `\n\n${stepLine}\n\n${hashtags}\n🔗 ${url}`;
  const maxLen = maxLenFor(opts.platform);
  const text = fitText(p.descriptionJa, head, tail, maxLen);
  return {
    type: "path",
    slug: p.slug,
    text,
    imageUrl: coverBook?.coverUrl,
    campaign: "path",
    dedupeKey: `path:${p.slug}`,
  };
}

export function buildAuthorContent(a: AuthorRecord, opts: BuildOptions): PostContent {
  const url = `${opts.siteUrl}/authors/${a.slug}?utm_source=${opts.platform}&utm_medium=social&utm_campaign=author`;
  const head = `👤 ${a.nameJa}（${a.name}）\n${a.country}\n`;
  const bookLines = a.books
    .slice(0, 3)
    .map((b) => `📚『${b.titleJa}』（${b.year}）`)
    .join("\n");
  const hashtags = buildHashtags(["読書"], opts.platform).join(" ");
  const tail = `\n\n${hashtags}\n🔗 ${url}`;
  const maxLen = maxLenFor(opts.platform);
  const text = fitText(bookLines, head, tail, maxLen);
  return {
    type: "author",
    slug: a.slug,
    text,
    imageUrl: a.books[0]?.coverUrl,
    campaign: "author",
    dedupeKey: `author:${a.slug}`,
  };
}

// ------------------------------------------------------------
// エントリ：スロット → 投稿コンテンツ
// ------------------------------------------------------------

export function buildContentForSlot(opts: BuildOptions): PostContent | undefined {
  const type = typeForSlot(opts.globalIdx);
  const occurrence = occurrenceOfType(opts.globalIdx, type);

  switch (type) {
    case "book": {
      const pool = getAllBooks();
      const item = selectFromPool(pool, occurrence, (b) => `book:${b.slug}`, opts.maxLookbackDays);
      return item ? buildBookContent(item, opts) : undefined;
    }
    case "recommend": {
      const pool = getAllRecommendations()
        .map((r) => ({ from: getBookBySlug(r.fromSlug), to: getBookBySlug(r.toSlug), reason: r.reasonJa }))
        .filter((r): r is { from: BookRecord; to: BookRecord; reason: string } => !!r.from && !!r.to);
      const item = selectFromPool(
        pool,
        occurrence,
        (r) => `recommend:${r.from.slug}>${r.to.slug}`,
        opts.maxLookbackDays
      );
      return item ? buildRecommendContent(item.from, item.to, item.reason, opts) : undefined;
    }
    case "path": {
      const pool = getAllPaths();
      const item = selectFromPool(pool, occurrence, (p) => `path:${p.slug}`, opts.maxLookbackDays);
      return item ? buildPathContent(item, opts) : undefined;
    }
    case "author": {
      const pool = getAllAuthors().filter((a) => a.books.length > 0);
      const item = selectFromPool(pool, occurrence, (a) => `author:${a.slug}`, opts.maxLookbackDays);
      return item ? buildAuthorContent(item, opts) : undefined;
    }
  }
}
