import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  linkable?: boolean;
  active?: boolean;
  count?: number;
}

export function TagBadge({ tag, linkable = true, active, count }: TagBadgeProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
        active
          ? "bg-[var(--accent)] text-[var(--background)]"
          : "bg-[var(--border)]/30 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
      }`}
    >
      {tag}
      {count !== undefined && (
        <span className="text-[10px]">{count}</span>
      )}
    </span>
  );

  if (!linkable) return content;

  return (
    <Link href={`/tags/${tag}`} className="inline-block">
      {content}
    </Link>
  );
}

/** Tag cluster component */
export function TagCluster({ tags, limit, showCount }: { tags: { slug: string; labelJa: string; count: number }[]; limit?: number; showCount?: boolean }) {
  const displayed = limit ? tags.slice(0, limit) : tags;
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayed.map((tag) => (
        <TagBadge key={tag.slug} tag={tag.labelJa} count={showCount ? tag.count : undefined} />
      ))}
      {limit && tags.length > limit && (
        <span className="text-xs text-[var(--muted)] self-center ml-1">
          ...他 {tags.length - limit}件
        </span>
      )}
    </div>
  );
}
