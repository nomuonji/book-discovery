/**
 * 統合データローダー
 * カテゴリ別JSONからデータを読み込み、横断的な検索・フィルタリングを提供する
 */
import { Book, Recommendation, ReadingPath } from "@/types";

/** authors.json の生データ型 */
interface AuthorProfileRaw {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  bioJa: string;
  books: string[];
  similarAuthors?: { slug: string; reasonJa: string }[];
}
import categoryIndex from "@/data/category-index.json";

// ---- 静的インポート：カテゴリ別 ----
import philosophyBooks from "@/data/categories/philosophy.json";
import worldFictionBooks from "@/data/categories/world-fiction.json";
import contemporaryFictionBooks from "@/data/categories/contemporary-fiction.json";
import classicFictionBooks from "@/data/categories/classic-fiction.json";
import nonfictionBooks from "@/data/categories/nonfiction.json";
import sfFantasyBooks from "@/data/categories/sf-fantasy.json";

const CATEGORY_DATA_MAP: Record<string, Book[]> = {
  philosophy: philosophyBooks.books as Book[],
  "world-fiction": worldFictionBooks.books as Book[],
  "contemporary-fiction": contemporaryFictionBooks.books as Book[],
  "classic-fiction": classicFictionBooks.books as Book[],
  nonfiction: nonfictionBooks.books as Book[],
  "sf-fantasy": sfFantasyBooks.books as Book[],
};

// ---- レコメンド ----
import recommendationsRaw from "@/data/recommendations.json";
const allRecommendations: Recommendation[] = recommendationsRaw.recommendations as Recommendation[];

// ---- 読書パス ----
import pathsRaw from "@/data/paths.json";
const allPaths: ReadingPath[] = (pathsRaw as { paths: ReadingPath[] }).paths as ReadingPath[];

// ---- 著者プロフィール ----
import authorsRaw from "@/data/authors.json";
const allAuthorProfiles: Record<string, { bioJa: string; similarAuthors?: { slug: string; reasonJa: string }[] }> = {};
for (const a of (authorsRaw as { authors: AuthorProfileRaw[] }).authors) {
  allAuthorProfiles[a.slug] = { bioJa: a.bioJa, similarAuthors: a.similarAuthors };
}

// ============================================================
// 本データ（全カテゴリ統合 + キャッシュ）
// ============================================================

let _allBooksCache: Book[] | null = null;

export function getAllBooks(): Book[] {
  if (_allBooksCache) return _allBooksCache;
  const books: Book[] = [];
  const seen = new Set<string>();
  for (const catBooks of Object.values(CATEGORY_DATA_MAP)) {
    for (const book of catBooks) {
      if (!seen.has(book.slug)) {
        seen.add(book.slug);
        books.push(book);
      }
    }
  }
  _allBooksCache = books;
  return books;
}

export function clearCache() {
  _allBooksCache = null;
}

// ---- 基本的な取得 ----

export function getBookBySlug(slug: string): Book | undefined {
  for (const catBooks of Object.values(CATEGORY_DATA_MAP)) {
    const found = catBooks.find((b) => b.slug === slug);
    if (found) return found;
  }
  return undefined;
}

export function getBooksByCategory(categorySlug: string): Book[] {
  return CATEGORY_DATA_MAP[categorySlug] || [];
}

export function getBooksByGenre(genre: string): Book[] {
  return getAllBooks().filter((b) => b.genre.includes(genre));
}

export function getBooksByCountry(country: string): Book[] {
  return getAllBooks().filter((b) => b.country === country);
}

export function getBooksByTag(tag: string): Book[] {
  return getAllBooks().filter((b) => b.tags.includes(tag));
}

export function getBooksByAuthor(authorSlug: string): Book[] {
  return getAllBooks().filter(
    (b) => b.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === authorSlug
  );
}

export function getBooksByDecade(decade: number): Book[] {
  const start = Math.floor(decade / 10) * 10;
  const end = start + 9;
  return getAllBooks().filter((b) => b.year >= start && b.year <= end);
}

// ---- 検索 ----

export function searchBooks(query: string): Book[] {
  const q = query.toLowerCase();
  return getAllBooks().filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.titleJa.includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.authorJa.includes(q) ||
      b.tags.some((t) => t.includes(q)) ||
      b.genre.some((g) => g.includes(q)) ||
      b.country.includes(q) ||
      b.descriptionJa.includes(q)
  );
}

// ---- カテゴリ情報 ----

export interface CategoryInfo {
  slug: string;
  label: string;
  description: string;
  order: number;
  count: number;
}

export function getAllCategories(): CategoryInfo[] {
  return (categoryIndex as CategoryInfo[]).sort((a, b) => a.order - b.order);
}

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return (categoryIndex as CategoryInfo[]).find((c) => c.slug === slug);
}

// ---- 年代 ----

export function getAllDecades(): number[] {
  const years = getAllBooks().map((b) => b.year);
  const min = Math.floor(Math.min(...years) / 10) * 10;
  const max = Math.floor(Math.max(...years) / 10) * 10;
  const decades: number[] = [];
  for (let d = min; d <= max; d += 10) {
    if (getAllBooks().some((b) => b.year >= d && b.year <= d + 9)) {
      decades.push(d);
    }
  }
  return decades.sort((a, b) => b - a);
}

// ---- 国・地域 ----

export function getAllCountries(): string[] {
  return [...new Set(getAllBooks().map((b) => b.country))].sort();
}

// ---- ジャンル・タグ ----

export function getAllGenres(): { slug: string; labelJa: string; count: number }[] {
  const count = new Map<string, number>();
  for (const book of getAllBooks()) {
    for (const g of book.genre) count.set(g, (count.get(g) || 0) + 1);
  }
  return Array.from(count.entries())
    .map(([slug, c]) => ({ slug, labelJa: slug, count: c }))
    .sort((a, b) => b.count - a.count || a.labelJa.localeCompare(b.labelJa, "ja"));
}

export function getAllTags(): { slug: string; labelJa: string; count: number }[] {
  const count = new Map<string, number>();
  for (const book of getAllBooks()) {
    for (const t of book.tags) count.set(t, (count.get(t) || 0) + 1);
  }
  return Array.from(count.entries())
    .map(([slug, c]) => ({ slug, labelJa: slug, count: c }))
    .sort((a, b) => b.count - a.count || a.labelJa.localeCompare(b.labelJa, "ja"));
}

// ---- 著者 ----

export function getAllAuthors(): { slug: string; name: string; nameJa: string; country: string; bookCount: number }[] {
  const map = new Map<string, { name: string; nameJa: string; country: string; books: Set<string> }>();
  for (const book of getAllBooks()) {
    const slug = book.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!map.has(slug)) {
      map.set(slug, { name: book.author, nameJa: book.authorJa, country: book.country, books: new Set() });
    }
    map.get(slug)!.books.add(book.slug);
  }
  return Array.from(map.entries())
    .map(([slug, data]) => ({ slug, name: data.name, nameJa: data.nameJa, country: data.country, bookCount: data.books.size }))
    .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
}

export function getAuthorBySlug(slug: string): { slug: string; name: string; nameJa: string; country: string; bioJa: string; books: Book[] } | undefined {
  const books = getBooksByAuthor(slug);
  if (books.length === 0) return undefined;
  const profile = allAuthorProfiles[slug];
  return {
    slug,
    name: books[0].author,
    nameJa: books[0].authorJa,
    country: books[0].country,
    bioJa: profile?.bioJa || "",
    books,
  };
}

// ---- レコメンド ----

export function getAllRecommendations(): Recommendation[] {
  return allRecommendations;
}

export function getRecommendationsFrom(bookSlug: string): (Recommendation & { book: Book })[] {
  return allRecommendations
    .filter((r) => r.fromSlug === bookSlug)
    .map((r) => {
      const book = getBookBySlug(r.toSlug);
      if (!book) return null;
      return { ...r, book };
    })
    .filter((r): r is Recommendation & { book: Book } => r !== null);
}

export function getRecommendationsTo(bookSlug: string): (Recommendation & { book: Book })[] {
  return allRecommendations
    .filter((r) => r.toSlug === bookSlug)
    .map((r) => {
      const book = getBookBySlug(r.fromSlug);
      if (!book) return null;
      return { ...r, book };
    })
    .filter((r): r is Recommendation & { book: Book } => r !== null);
}

export function getRecommendationsForAuthor(authorName: string): (Recommendation & { book: Book; fromBook: Book })[] {
  const authorBooks = getAllBooks().filter((b) => b.author.toLowerCase() === authorName.toLowerCase());
  if (authorBooks.length === 0) return [];

  const results: (Recommendation & { book: Book; fromBook: Book })[] = [];
  for (const authorBook of authorBooks) {
    const recs = allRecommendations.filter((r) => r.fromSlug === authorBook.slug && r.type !== "reading-path");
    for (const rec of recs) {
      const book = getBookBySlug(rec.toSlug);
      if (book && !results.some((r) => r.toSlug === rec.toSlug)) {
        results.push({ ...rec, book, fromBook: authorBook });
      }
    }
  }
  return results;
}

// ---- 読書パス ----

export function getAllPaths(): ReadingPath[] {
  return allPaths;
}

export function getPathBySlug(slug: string): ReadingPath | undefined {
  return allPaths.find((p) => p.slug === slug);
}

export function getPathsContainingBook(bookSlug: string): ReadingPath[] {
  return allPaths.filter((p) => p.steps.some((s) => s.bookSlug === bookSlug));
}

export function getPathWithBooks(slug: string): (ReadingPath & { stepsWithBooks: (ReadingPath["steps"][number] & { book: Book })[] }) | undefined {
  const path = getPathBySlug(slug);
  if (!path) return undefined;

  const stepsWithBooks = path.steps
    .map((step) => {
      const book = getBookBySlug(step.bookSlug);
      if (!book) return null;
      return { ...step, book };
    })
    .filter((s): s is ReadingPath["steps"][number] & { book: Book } => s !== null);

  return { ...path, stepsWithBooks };
}

// ---- 統計 ----

export function getStats() {
  const books = getAllBooks();
  return {
    totalBooks: books.length,
    totalAuthors: getAllAuthors().length,
    totalPaths: allPaths.length,
    totalCountries: getAllCountries().length,
    totalGenres: getAllGenres().length,
    totalTags: getAllTags().length,
    totalRecommendations: allRecommendations.length,
  };
}
