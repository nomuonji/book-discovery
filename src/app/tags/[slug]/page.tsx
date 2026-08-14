import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { TagCluster } from "@/components/TagBadge";
import { getBooksByTag, getAllTags, getAllBooks } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  // Next.js は slug に URL-safe な値のみ許可
  return tags.map((t) => ({ slug: encodeURIComponent(t.slug) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return buildMetadata({
    title: `「${decoded}」タグの本`,
    description: `「${decoded}」に関連する洋書・思想書の一覧。`,
    path: `/tags/${encodeURIComponent(decoded)}`,
  });
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const books = getBooksByTag(decoded);

  if (books.length === 0) notFound();

  const allTags = getAllTags();
  const relatedTags = allTags.filter((t) => t.slug !== decoded && books.some((b) => b.tags.includes(t.slug))).slice(0, 20);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>#{decoded}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2">
        タグ「<span className="text-[var(--accent)]">{decoded}</span>」の本
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">📚 {books.length}冊</p>

      {relatedTags.length > 0 && (
        <div className="mb-8 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">関連タグ</h2>
          <TagCluster tags={relatedTags} />
        </div>
      )}

      <BookGrid books={books} />
    </div>
  );
}
