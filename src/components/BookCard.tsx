import Image from "next/image";
import Link from "next/link";
import { Book } from "@/types";
import { getAmazonLink, getAmazonSearchLink, getAmazonComSearchLink } from "@/lib/amazon";

interface BookCardProps {
  book: Book;
  reason?: string;
  showAmazon?: boolean;
}

function authorSlug(author: string): string {
  return author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function BookCard({ book, reason, showAmazon = true }: BookCardProps) {
  return (
    <div className="group bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--card-hover)] transition-all duration-200 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <Link
          href={`/books/${book.slug}`}
          className="shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded overflow-hidden shadow-sm relative block"
        >
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.titleJa}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, 96px"
            />
          ) : (
            <div className="cover-placeholder w-full h-full flex items-center justify-center text-white/70 text-xs text-center p-1 leading-tight">
              {book.titleJa}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <Link href={`/books/${book.slug}`}>
              <h3 className="font-semibold text-sm sm:text-base leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                {book.titleJa}
              </h3>
            </Link>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {book.title} ({book.year})
            </p>
            <p className="text-xs text-[var(--muted)]">
              <Link
                href={`/authors/${authorSlug(book.author)}`}
                className="hover:text-[var(--accent)] transition-colors"
              >
                {book.authorJa}
              </Link>
              {" / "}
              <Link
                href={`/tags/${encodeURIComponent(book.country)}`}
                className="hover:text-[var(--accent)] transition-colors"
              >
                {book.country}
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {book.genre.slice(0, 2).map((g) => (
              <Link
                key={g}
                href={`/books?genre=${encodeURIComponent(g)}`}
                className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--border)]/40 text-[var(--muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors"
              >
                {g}
              </Link>
            ))}
          </div>
          {reason ? (
            <p className="text-xs text-[var(--accent)] mt-1.5 italic line-clamp-2">
              {reason}
            </p>
          ) : book.selectionReasonJa ? (
            <p className="text-[11px] text-[var(--muted)] mt-1.5 line-clamp-2 flex items-start gap-1">
              <span className="shrink-0">🏆</span>
              <span>{book.selectionReasonJa}</span>
            </p>
          ) : null}
        </div>
      </div>
      {showAmazon && (
        <div className="px-4 pb-3 space-y-1.5">
          <a
            href={
              book.asin
                ? getAmazonLink(book.asin)
                : getAmazonSearchLink(book.title, book.author, book.titleJa, book.authorJa)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            🛒 Amazonで探す
          </a>
          <a
            href={getAmazonComSearchLink(book.titleEn || book.title, book.author)}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] py-1.5 rounded-md border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            🌐 原書（英語版）
          </a>
        </div>
      )}
    </div>
  );
}
