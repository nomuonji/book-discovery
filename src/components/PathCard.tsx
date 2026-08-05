import Link from "next/link";
import { Book } from "@/types";

interface PathCardProps {
  slug: string;
  titleJa: string;
  descriptionJa: string;
  difficulty: 1 | 2 | 3;
  stepCount: number;
  representativeBook?: Book;
}

const difficultyLabels: Record<number, string> = {
  1: "入門",
  2: "中級",
  3: "発展",
};

const difficultyColors: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function PathCard({ slug, titleJa, descriptionJa, difficulty, stepCount, representativeBook }: PathCardProps) {
  return (
    <Link
      href={`/paths/${slug}`}
      className="group block bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--card-hover)] transition-all duration-200 p-5"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-base group-hover:text-[var(--accent)] transition-colors">
          {titleJa}
        </h3>
        <span
          className={`shrink-0 ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColors[difficulty]}`}
        >
          {difficultyLabels[difficulty]}
        </span>
      </div>
      <p className="text-sm text-[var(--muted)] line-clamp-2 mb-3">
        {descriptionJa}
      </p>
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span>📖 {stepCount}冊</span>
        {representativeBook && (
          <span className="truncate">
            🏷 {representativeBook.authorJa} ほか
          </span>
        )}
      </div>
    </Link>
  );
}
