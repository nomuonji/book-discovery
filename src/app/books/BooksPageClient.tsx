"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { TagCluster } from "@/components/TagBadge";
import { getAllBooks, getAllGenres, getAllCountries, getAllDecades, getAllTags, searchBooks } from "@/lib/data";

// output: "export" では searchParams をサーバーで読めない（リクエスト時の値が無い）ため、
// クライアント側で useSearchParams() を使ってフィルタリングする。
// lib/data.ts は fs を使わず静的JSON importのみなので、クライアントバンドルに含めて問題ない。
export function BooksPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || undefined;
  const genreFilter = searchParams.get("genre") || undefined;

  let books = getAllBooks();
  let activeFilter = "";

  if (query) {
    books = searchBooks(query);
    activeFilter = `「${query}」の検索結果`;
  }

  if (genreFilter) {
    books = books.filter((b) => b.genre.includes(genreFilter));
    activeFilter = activeFilter ? `${activeFilter} · ${genreFilter}` : genreFilter;
  }

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

      {/* Search */}
      <div className="mb-8 max-w-md">
        <form action="/books" method="GET" className="relative">
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
            <a href="/books" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] hover:text-[var(--accent)]">
              ✕
            </a>
          )}
        </form>
      </div>

      {/* Category Navigation */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">カテゴリ</h2>
        <CategoryNav />
      </div>

      {/* Genre & Country Filter */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">ジャンル（{genres.length}）</h2>
          <div className="flex flex-wrap gap-1.5">
            {genreFilter && (
              <a
                href="/books"
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent)] text-white transition-colors"
              >
                ✕ クリア
              </a>
            )}
            {genres.map((g) => (
              <a
                key={g.slug}
                href={`/books?genre=${encodeURIComponent(g.slug)}`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  genreFilter === g.slug
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {g.labelJa} <span className="opacity-50">{g.count}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">国・地域（{countries.length}）</h2>
          <div className="flex flex-wrap gap-1.5">
            {countries.map((c) => (
              <Link
                key={c}
                href={`/tags/${encodeURIComponent(c)}`}
                className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Decade Filter */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">年代</h2>
        <div className="flex flex-wrap gap-1.5">
          {decades.map((d) => (
            <a
              key={d}
              href={`/tags/${encodeURIComponent(d + "年代")}`}
              className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {d}年代
            </a>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-[var(--muted)] mb-2">よく使われるタグ</h2>
        <TagCluster tags={topTags} showCount />
      </div>

      {/* Book Grid */}
      <div className="border-t border-[var(--border)] pt-8">
        <h2 className="text-lg font-semibold mb-4">
          {activeFilter ? (
            <span>
              {activeFilter} <span className="text-sm text-[var(--muted)] font-normal">（{books.length}冊）</span>
            </span>
          ) : (
            `全${books.length}冊`
          )}
        </h2>
        <BookGrid books={books} emptyMessage={
          query ? `「${query}」に一致する本が見つかりませんでした。` : "該当する本が見つかりませんでした。"
        } />
      </div>
    </div>
  );
}
