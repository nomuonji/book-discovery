import Link from "next/link";
import { getAllCategories } from "@/lib/data";

interface CategoryNavProps {
  current?: string;
}

export function CategoryNav({ current }: CategoryNavProps) {
  const categories = getAllCategories();

  return (
    <nav className="flex flex-wrap gap-1.5">
      <Link
        href="/books"
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
          !current
            ? "bg-[var(--accent)] text-white"
            : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }`}
      >
        すべて
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            current === cat.slug
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          }`}
        >
          {cat.label} ({cat.count})
        </Link>
      ))}
    </nav>
  );
}
