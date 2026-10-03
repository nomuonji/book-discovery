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

export interface TagSummary {
  slug: string;
  labelJa: string;
  count: number;
}

export interface AuthorSummary {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  bookCount: number;
  bioJa: string;
}

/**
 * タグページは一覧以外の固有説明を持たないため、
 * 「選べる集合」として最低4冊あるものだけをindex対象にする。
 * 4冊はGoogleの閾値ではなく、このサイト固有の検索面ポリシー。
 */
export function isIndexableTag(tag: Pick<TagSummary, "count">): boolean {
  return tag.count >= 4;
}

/**
 * 著者ページは書誌レコードとしてではなく、次の一冊へ進める発見ハブだけをindex対象にする。
 * - 2冊以上を比較できる
 * - 1件以上の編集済み読書パスに参加している
 * - 3件以上の画面表示対象の推薦先がある
 */
export function isIndexableAuthor(author: Pick<AuthorSummary, "slug" | "bookCount">): boolean {
  const discovery = getAuthorDiscoverySignal(author.slug);
  return author.bookCount >= 2 || discovery.readingPathCount >= 1 || discovery.recommendationCount >= 3;
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

/** Factual overlays for path copy that would otherwise claim an unsupported "first". */
function applyPathCopyCorrections(paths: ReadingPath[]): ReadingPath[] {
  return paths.map((path) => {
    if (path.slug !== "postcolonial-reading") return path;
    return {
      ...path,
      descriptionJa:
        "このパスが扱うポストコロニアル文学は、植民地支配とその後を被支配側の経験から描く作品である。傷と創造力を、アフリカ、中東、アジア、カリブ海の作家からたどる。",
      steps: path.steps.map((step) => {
        if (step.order !== 1 || step.bookSlug !== "things-fall-apart") return step;
        return {
          ...step,
          noteJa:
            "1958年のThings Fall Apartは英語圏アフリカ小説の「最初」ではない（例: J. E. Casely Hayford『Ethiopia Unbound』1911年）。それでもイボ社会の内部からの語りは、その後の英語圏アフリカ文学と世界的な読まれ方を大きく変えた入口になる。戦士の栄光と没落を通じて、「文明化」の暴力を目撃する。",
        };
      }),
    };
  });
}

const allPaths: ReadingPath[] = applyPathCopyCorrections(
  (pathsRaw as { paths: ReadingPath[] }).paths as ReadingPath[],
);

// ---- 著者プロフィール ----
import authorsRaw from "@/data/authors.json";
const allAuthorProfiles: Record<string, { bioJa: string; similarAuthors?: { slug: string; reasonJa: string }[] }> = {};
for (const a of (authorsRaw as { authors: AuthorProfileRaw[] }).authors) {
  allAuthorProfiles[a.slug] = { bioJa: a.bioJa, similarAuthors: a.similarAuthors };
}

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
  _authorDiscoverySignalCache = null;
}

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

interface AuthorDiscoverySignal {
  recommendationCount: number;
  readingPathCount: number;
}

let _authorDiscoverySignalCache: Map<string, AuthorDiscoverySignal> | null = null;

function getAuthorDiscoverySignal(authorSlug: string): AuthorDiscoverySignal {
  if (!_authorDiscoverySignalCache) {
    const bookAuthor = new Map<string, string>();
    for (const book of getAllBooks()) {
      const slug = book.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      bookAuthor.set(book.slug, slug);
    }

    const recommendationTargets = new Map<string, Set<string>>();
    for (const rec of allRecommendations) {
      // 著者ページの「おすすめ」と同じく、reading-path型は推薦件数に含めない。
      if (rec.type === "reading-path") continue;
      const slug = bookAuthor.get(rec.fromSlug);
      if (!slug) continue;
      if (!recommendationTargets.has(slug)) recommendationTargets.set(slug, new Set());
      recommendationTargets.get(slug)!.add(rec.toSlug);
    }

    const readingPaths = new Map<string, Set<string>>();
    for (const path of allPaths) {
      for (const step of path.steps) {
        const slug = bookAuthor.get(step.bookSlug);
        if (!slug) continue;
        if (!readingPaths.has(slug)) readingPaths.set(slug, new Set());
        readingPaths.get(slug)!.add(path.slug);
      }
    }

    const slugs = new Set(bookAuthor.values());
    _authorDiscoverySignalCache = new Map(
      Array.from(slugs).map((slug) => [
        slug,
        {
          recommendationCount: recommendationTargets.get(slug)?.size ?? 0,
          readingPathCount: readingPaths.get(slug)?.size ?? 0,
        },
      ]),
    );
  }

  return _authorDiscoverySignalCache.get(authorSlug) ?? {
    recommendationCount: 0,
    readingPathCount: 0,
  };
}

export function getBooksByDecade(decade: number): Book[] {
  const start = Math.floor(decade / 10) * 10;
  const end = start + 9;
  return getAllBooks().filter((b) => b.year >= start && b.year <= end);
}

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

export function getAllCountries(): string[] {
  return [...new Set(getAllBooks().map((b) => b.country))].sort();
}

export function getAllGenres(): { slug: string; labelJa: string; count: number }[] {
  const count = new Map<string, number>();
  for (const book of getAllBooks()) {
    for (const g of book.genre) count.set(g, (count.get(g) || 0) + 1);
  }
  return Array.from(count.entries())
    .map(([slug, c]) => ({ slug, labelJa: slug, count: c }))
    .sort((a, b) => b.count - a.count || a.labelJa.localeCompare(b.labelJa, "ja"));
}

export function getAllTags(): TagSummary[] {
  const count = new Map<string, number>();
  for (const book of getAllBooks()) {
    for (const t of book.tags) count.set(t, (count.get(t) || 0) + 1);
  }
  return Array.from(count.entries())
    .map(([slug, c]) => ({ slug, labelJa: slug, count: c }))
    .sort((a, b) => b.count - a.count || a.labelJa.localeCompare(b.labelJa, "ja"));
}

export function getAllAuthors(): AuthorSummary[] {
  const map = new Map<string, { name: string; nameJa: string; country: string; books: Set<string> }>();
  for (const book of getAllBooks()) {
    const slug = book.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!map.has(slug)) {
      map.set(slug, { name: book.author, nameJa: book.authorJa, country: book.country, books: new Set() });
    }
    map.get(slug)!.books.add(book.slug);
  }
  return Array.from(map.entries())
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      nameJa: data.nameJa,
      country: data.country,
      bookCount: data.books.size,
      bioJa: allAuthorProfiles[slug]?.bioJa || "",
    }))
    .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
}

export function getAuthorBySlug(slug: string): (AuthorSummary & { books: Book[] }) | undefined {
  const books = getBooksByAuthor(slug);
  if (books.length === 0) return undefined;
  const profile = allAuthorProfiles[slug];
  return {
    slug,
    name: books[0].author,
    nameJa: books[0].authorJa,
    country: books[0].country,
    bioJa: profile?.bioJa || "",
    bookCount: books.length,
    books,
  };
}

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
  const normalized = authorName.trim().toLowerCase();
  const authorBooks = getAllBooks().filter(
    (b) => b.author.toLowerCase() === normalized || b.authorJa.toLowerCase() === normalized
  );
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

export function getStats() {
  const books = getAllBooks();
  return {
    totalBooks: books.length,
    totalAuthors: getAllAuthors().length,
    totalPaths: allPaths.length,
    totalRecommendations: allRecommendations.length,
    totalCountries: getAllCountries().length,
    totalGenres: getAllGenres().length,
    totalTags: getAllTags().length,
  };
}
