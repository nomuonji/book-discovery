"use client";

import { useState, useMemo } from "react";
import { BookCard } from "@/components/BookCard";
import { searchBooks, getRecommendationsForAuthor, getRecommendationsFrom, getAllRecommendations, getBookBySlug } from "@/lib/data";
import { Book } from "@/types";

export default function RecommendPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Book & { reasonJa: string })[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  // 全著者と本の候補リスト
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return searchBooks(query).slice(0, 8);
  }, [query]);

  const handleSearch = (input?: string) => {
    const q = (input || query).trim();
    if (!q) return;

    setSelectedLabel(q);
    setQuery("");

    // 検索ロジック: まず著者名で探し、なければ個別の本で探す
    const authorRecs = getRecommendationsForAuthor(q);

    if (authorRecs.length > 0) {
      const seen = new Set<string>();
      const books: (Book & { reasonJa: string })[] = [];
      for (const rec of authorRecs) {
        if (!seen.has(rec.toSlug)) {
          seen.add(rec.toSlug);
          books.push({ ...rec.book, reasonJa: rec.reasonJa });
        }
      }
      setResults(books.slice(0, 6));
    } else {
      // 本のタイトルから検索
      const foundBooks = searchBooks(q);
      if (foundBooks.length > 0) {
        const recs = getRecommendationsFrom(foundBooks[0].slug);
        const books = recs.map((r) => ({ ...r.book, reasonJa: r.reasonJa }));
        setResults(books.slice(0, 6));
      } else {
        setResults([]);
      }
    }
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">おすすめを探す</h1>
      <p className="text-[var(--muted)] mb-8 max-w-2xl">
        好きな作家名や本のタイトルを入力してください。
        AIが厳選した「あなたに合う次の一冊」をおすすめします。
      </p>

      {/* Search Input */}
      <div className="relative max-w-xl mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例: 村上春樹, カミュ, フェッランテ..."
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
            />
            {/* Autocomplete dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-10">
                {suggestions.map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => {
                      setQuery(s.authorJa);
                      handleSearch(s.authorJa);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--card-hover)] transition-colors flex items-center gap-3"
                  >
                    <span className="font-medium">{s.authorJa}</span>
                    <span className="text-[var(--muted)] text-xs">{s.titleJa}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            検索
          </button>
        </div>
      </div>

      {/* Quick picks */}
      {!searched && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">よく検索される作家</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "村上春樹",
              "カミュ",
              "カズオ・イシグロ",
              "ハン・ガン",
              "カート・ヴォネガット",
              "トカルチュク",
            ].map((name) => (
              <button
                key={name}
                onClick={() => {
                  setQuery(name);
                  handleSearch(name);
                }}
                className="text-sm px-4 py-2 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-[var(--card)] transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {results.length > 0
              ? `「${selectedLabel}」が好きなあなたに—— ${results.length}冊のおすすめ`
              : `「${selectedLabel}」に一致するおすすめが見つかりませんでした`}
          </h2>

          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((book) => (
                <BookCard key={book.slug} book={book} reason={book.reasonJa} />
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-12 text-[var(--muted)]">
              <p className="text-lg mb-2">🔍</p>
              <p className="mb-4">別の作家名やキーワードで試してみてください。</p>
              <p className="text-sm">
                ヒント: 村上春樹、カミュ、サルトル、フーコー、カーヴァー、イシグロなど
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setSearched(false);
              setQuery("");
              setSelectedLabel("");
            }}
            className="mt-6 text-sm text-[var(--accent)] hover:underline"
          >
            ← 別の作家を検索する
          </button>
        </div>
      )}
    </div>
  );
}
