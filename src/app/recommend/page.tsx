"use client";

import { useMemo, useState } from "react";
import { BookCard } from "@/components/BookCard";
import {
  searchBooks,
  getRecommendationsForAuthor,
  getRecommendationsFrom,
} from "@/lib/data";
import { Book } from "@/types";

type DiscoveryResult = Book & { reasonJa: string };

const AUTHOR_STARTERS = [
  "村上春樹",
  "カミュ",
  "カズオ・イシグロ",
  "ハン・ガン",
  "カート・ヴォネガット",
  "トカルチュク",
];

const THEME_STARTERS = [
  "孤独",
  "恋愛",
  "家族",
  "哲学",
  "フェミニズム",
  "SF",
  "実存主義",
  "歴史",
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function RecommendPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [resultHeading, setResultHeading] = useState("");

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchBooks(query).slice(0, 8);
  }, [query]);

  const handleSearch = (input?: string) => {
    const q = (input ?? query).trim();
    if (!q) return;

    const normalized = normalize(q);
    const matches = searchBooks(q);
    const exactBook = matches.find(
      (book) =>
        normalize(book.titleJa) === normalized ||
        normalize(book.title) === normalized ||
        normalize(book.titleEn || "") === normalized
    );

    if (exactBook) {
      const recs = getRecommendationsFrom(exactBook.slug)
        .filter((rec) => rec.type !== "reading-path")
        .slice(0, 6)
        .map((rec) => ({ ...rec.book, reasonJa: rec.reasonJa }));

      setResults(recs);
      setResultHeading(
        recs.length > 0
          ? `『${exactBook.titleJa}』が好きなら、次はこの${recs.length}冊`
          : `『${exactBook.titleJa}』からの推薦はまだ準備中です`
      );
      setSearched(true);
      setQuery("");
      return;
    }

    const authorRecs = getRecommendationsForAuthor(q);
    if (authorRecs.length > 0) {
      const seen = new Set<string>();
      const books: DiscoveryResult[] = [];
      for (const rec of authorRecs) {
        if (seen.has(rec.toSlug)) continue;
        seen.add(rec.toSlug);
        books.push({ ...rec.book, reasonJa: rec.reasonJa });
        if (books.length === 6) break;
      }
      setResults(books);
      setResultHeading(`「${q}」が好きなら、次はこの${books.length}冊`);
      setSearched(true);
      setQuery("");
      return;
    }

    if (matches.length > 0) {
      const books = matches.slice(0, 6).map((book) => ({
        ...book,
        reasonJa: book.selectionReasonJa || book.whyReadJa,
      }));
      setResults(books);
      setResultHeading(`「${q}」を読みたいときの候補 ${books.length}冊`);
      setSearched(true);
      setQuery("");
      return;
    }

    setResults([]);
    setResultHeading(`「${q}」に合う候補はまだ見つかりませんでした`);
    setSearched(true);
    setQuery("");
  };

  return (
    <div className="reading-interior reading-recommend max-w-5xl mx-auto px-4 py-8">
      <div className="max-w-2xl mb-9">
        <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">NEXT BOOK FINDER</span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-3 reading-index-title">読んだ本を、<br />次の本の地図に。</h1>
        <p className="text-[var(--muted)] leading-relaxed">
          好きな本・作家、または今読みたいテーマを入力してください。
          収録本どうしの推薦関係と選書データから、次の候補と「なぜつながるか」を表示します。
        </p>
      </div>

      <div className="relative max-w-2xl mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              placeholder="本・作家・テーマを入力 例：異邦人、村上春樹、孤独"
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-10">
                {suggestions.map((book) => (
                  <button
                    key={book.slug}
                    type="button"
                    onClick={() => handleSearch(book.titleJa)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--card-hover)] transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="font-medium">{book.titleJa}</span>
                    <span className="text-[var(--muted)] text-xs truncate">{book.authorJa}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="px-5 sm:px-6 py-3 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            探す
          </button>
        </div>
      </div>

      {!searched && (
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="font-semibold mb-1">好きな作家から</h2>
            <p className="text-xs text-[var(--muted)] mb-4">その作家の収録作品から、雰囲気・テーマ・影響関係で次へ進む。</p>
            <div className="flex flex-wrap gap-2">
              {AUTHOR_STARTERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSearch(name)}
                  className="text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="font-semibold mb-1">今読みたいテーマから</h2>
            <p className="text-xs text-[var(--muted)] mb-4">タイトルを知らなくても、気分や関心から候補を絞る。</p>
            <div className="flex flex-wrap gap-2">
              {THEME_STARTERS.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => handleSearch(theme)}
                  className="text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {theme}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {searched && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold">{resultHeading}</h2>
            <button
              type="button"
              onClick={() => {
                setSearched(false);
                setResults([]);
                setResultHeading("");
              }}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              別の入口から探す
            </button>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((book) => (
                <BookCard key={book.slug} book={book} reason={book.reasonJa} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
              <p className="mb-2">まだ推薦グラフに十分な接続がありません。</p>
              <p className="text-sm">別の本・作家・テーマを試すか、読書パスから探してください。</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
