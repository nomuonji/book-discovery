import Link from "next/link";

interface AuthorCardProps {
  slug: string;
  name: string;
  nameJa: string;
  country: string;
  bookCount: number;
  representativeBook?: {
    slug: string;
    titleJa: string;
    coverUrl?: string;
  };
}

export function AuthorCard({ slug, name, nameJa, country, bookCount, representativeBook }: AuthorCardProps) {
  return (
    <Link
      href={`/authors/${slug}`}
      className="group block bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--card-hover)] transition-all duration-200 p-4"
    >
      <div className="flex items-start gap-3">
        {representativeBook?.coverUrl && (
          <div className="shrink-0 w-12 h-16 rounded overflow-hidden shadow-sm">
            <img src={representativeBook.coverUrl} alt={representativeBook.titleJa} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors">
            {nameJa}
          </h3>
          <p className="text-xs text-[var(--muted)]">{name}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--muted)]">
            <span>📍 {country}</span>
            <span>📖 {bookCount}冊</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
