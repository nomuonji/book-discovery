"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { TagCluster } from "@/components/TagBadge";
import { FilterNavButton } from "@/components/FilterNavButton";
import {
  getAllBooks,
  getAllGenres,
  getAllCountries,
  getAllDecades,
  getAllTags,
  searchBooks,
} from "@/lib/data";

type SortMode = "selection" | "year-desc" | "year-asc";

export function BooksPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || undefined;
  const genreFilter = searchParams.get("genre") || undefined;
  const countryFilter = searchParams.get("country") || undefined;
  const decadeRaw = searchParams.get("decade");
  const decadeFilter = decadeRaw && /^\d{3,4}$/.test(decadeRaw) ? Number(decadeRaw) : undefined;
  const requestedSort = searchParams.get("sort");
  const sortMode: SortMode =
    requestedSort === "year-desc" || requestedSort === "year-asc" || requestedSort === "selection"
      ? requestedSort
      : "selection";

  const buildBooksHref = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `/books/?${qs}` : "/books/";
  };

  let books = query ? searchBooks(query) : getAllBooks();
  const activeParts: string[] = [];

  if (query) activeParts.push(`「${query}」の検索結果`);

  if (genreFilter) {
    books = books.filter((b) => b.genre.includes(genreFilter));
    activeParts.push(genreFilter);
  }

  if (countryFilter) {
    books = books.filter((b) => b.country === countryFilter);
    activeParts.push(countryFilter);
  }

  if (decadeFilter !== undefined) {
    books = books.filter((b) => Math.floor(b.year / 10) * 10 === decadeFilter);
    activeParts.push(`${decadeFilter}年代`);
  }

  const sortedBooks = [...books];
  if (sortMode === "year-desc") sortedBooks.sort((a, b) => b.year - a.year);
  if (sortMode === "year-asc") sortedBooks.sort((a, b) => a.year - b.year);
  books = sortedBooks;

  const activeFilter = activeParts.join(" · ");
  const genres = getAllGenres();
  const countries = getAllCountries();
  const decades = getAllDecades();
  const topTags = getAllTags().slice(0, 20);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">本を探す</h1>
      <p className="text-[var(--muted)] mb-6">
        全{getAllBooks().length}冊から、カテゴリ・ジャンル・国・年代で絞り込み。
      </p>

      <div className="mb-8 max-w-md">
        <form action="/books/" method="GET" className="relative">
          {genreFilter && <input type="hidden" name="genre" value={genreFilter} />}
          {countryFilter && <input type="hidden" name="country" value={countryFilter} />}
          {decadeFilter !== undefined && <input type="hidden" name="decade" value={decadeFilter} />}
          {searchParams.has("sort") && <input type="hidden" name="sort" value={sortMode} />}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            name="q"
            defaultValue={query || ""}
            placeholder="タイトル・著者・キーワードで絞り込み..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
          />
          {query && (
            <FilterNavButton
              href={buildBooksHref({ q: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] hover:text-[var(--accent)] cursor-pointer"
              ariaLabel="検索語を解除"
            >
              ✕
            </FilterNavButton>
          )}
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">カテゴリ</h2>
        <CategoryNav />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">ジャンル（{genres.length}）</h2>
          <div className="flex flex-wrap gap-1.5">
            {genreFilter && (
              <FilterNavButton
                href={buildBooksHref({ genre: undefined })}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)] text-[var(--background)] transition-colors cursor-pointer"
              >
                ✕ ジャンル解除
              </FilterNavButton>
            )}
            {genres.map((g) => (
              <FilterNavButton
                key={g.slug}
                href={buildBooksHref({ genre: g.slug })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  genreFilter === g.slug
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                    : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
                ariaLabel={`${g.labelJa}で本を絞り込む`}
              >
                {g.labelJa} <span>{g.count}</span>
              </FilterNavButton>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">国・地域（{countries.length}）</h2>
          <div className="flex flex-wrap gap-1.5">
            {countryFilter && (
              <FilterNavButton
                href={buildBooksHref({ country: undefined })}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)] text-[var(--background)] transition-colors"
              >
                ✕ 国・地域解除
              </FilterNavButton>
            )}
            {countries.map((country) => (
              <FilterNavButton
                key={country}
                href={buildBooksHref({ country })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  countryFilter === country
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                    : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {country}
              </FilterNavButton>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">年代</h2>
        <div className="flex flex-wrap gap-1.5">
          {decadeFilter !== undefined && (
            <FilterNavButton
              href={buildBooksHref({ decade: undefined })}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)] text-[var(--background)] transition-colors cursor-pointer"
              ariaLabel="年代フィルタを解除"
            >
              ✕ 年代解除
            </FilterNavButton>
          )}
          {decades.map((decade) => (
            <FilterNavButton
              key={decade}
              href={buildBooksHref({ decade })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                decadeFilter === decade
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                  : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {decade}年代
            </FilterNavButton>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">よく使われるタグ</h2>
        <TagCluster tags={topTags} showCount />
      </div>

      <div className="border-t border-[var(--border)] pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">
            {activeFilter ? (
              <span>
                {activeFilter} <span className="text-sm text-[var(--muted)] font-normal">（{books.length}冊）</span>
              </span>
            ) : (
              `全${books.length}冊`
            )}
          </h2>

          <div className="flex items-center gap-3">
            {(query || genreFilter || countryFilter || decadeFilter !== undefined || searchParams.has("sort")) && (
              <Link href="/books/" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
                すべてリセット
              </Link>
            )}
            <form action="/books/" method="GET" className="flex items-center gap-2">
              {query && <input type="hidden" name="q" value={query} />}
              {genreFilter && <input type="hidden" name="genre" value={genreFilter} />}
              {countryFilter && <input type="hidden" name="country" value={countryFilter} />}
              {decadeFilter !== undefined && <input type="hidden" name="decade" value={decadeFilter} />}
              <label htmlFor="book-sort" className="text-xs text-[var(--muted)]">並べ替え</label>
              <select
                id="book-sort"
                name="sort"
                defaultValue={sortMode}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                className="text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2"
              >
                <option value="selection">選書順</option>
                <option value="year-desc">出版年：新しい順</option>
                <option value="year-asc">出版年：古い順</option>
              </select>
            </form>
          </div>
        </div>

        <BookGrid
          books={books}
          emptyMessage={
            query ? `「${query}」に一致する本が見つかりませんでした。` : "該当する本が見つかりませんでした。"
          }
        />
      </div>
    </div>
  );
}
