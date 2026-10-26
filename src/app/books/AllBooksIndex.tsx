import Link from "next/link";
import { getAllBooks } from "@/lib/data";

/**
 * 全冊索引（サーバー描画）。
 *
 * /books/ の一覧本体は searchParams に依存するためクライアント側で描画され、
 * 静的HTMLには書籍リンクが1本も出ない。クローラから見ると「すべての本」の
 * ハブが空ページになるので、書名順の索引だけをサーバー側で出しておく。
 */
export function AllBooksIndex() {
  const books = [...getAllBooks()].sort((a, b) =>
    a.titleJa.localeCompare(b.titleJa, "ja")
  );

  return (
    <section
      className="max-w-5xl mx-auto px-4 pb-16"
      aria-labelledby="all-books-index"
    >
      <div className="border-t border-[var(--border)] pt-8">
        <h2 id="all-books-index" className="text-lg font-semibold mb-1">
          全{books.length}冊の索引
        </h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          書名の五十音順です。各ページで、この本の輪郭と、読み終えた次に読む一冊を書いています。
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
          {books.map((book) => (
            <li key={book.slug} className="leading-6">
              <Link
                href={`/books/${book.slug}/`}
                className="hover:text-[var(--accent)] transition-colors"
              >
                {book.titleJa}
              </Link>
              <span className="text-[var(--muted)] text-xs ml-1.5">
                {book.authorJa}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
