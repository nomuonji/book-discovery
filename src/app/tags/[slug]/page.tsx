import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { JsonLd } from "@/components/JsonLd";
import { TagCluster } from "@/components/TagBadge";
import { getBooksByTag, getAllTags, isIndexableTag } from "@/lib/data";
import { tagDescription } from "@/lib/descriptions";
import { breadcrumbListNode, collectionPageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  // Next.js が公開URLへエンコードするため、paramsはデータ上の生値を返す。
  // ここで encodeURIComponent すると静的export時に二重エンコードされ、
  // 日本語タグの本文が404フォールバックになる。
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const tag = getAllTags().find((candidate) => candidate.slug === decoded);
  if (!tag) return { title: "Not Found" };
  return buildMetadata({
    title: `「${decoded}」タグの本`,
    description: tagDescription(decoded, getBooksByTag(decoded)),
    path: `/tags/${encodeURIComponent(decoded)}`,
    robots: isIndexableTag(tag) ? undefined : { index: false, follow: true },
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
    <div className="reading-interior reading-tag-index max-w-5xl mx-auto px-4 py-8">
      <JsonLd
        data={[
          collectionPageNode({
            name: `タグ「${decoded}」の本`,
            description: `「${decoded}」のタグが付いた本の一覧。全${books.length}冊。`,
            path: `/tags/${encodeURIComponent(decoded)}`,
            numberOfItems: books.length,
          }),
          breadcrumbListNode([
            { name: "ホーム", path: "/" },
            { name: "本を探す", path: "/books" },
            { name: `#${decoded}`, path: `/tags/${encodeURIComponent(decoded)}` },
          ]),
        ]}
      />
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books/" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>#{decoded}</span>
      </nav>

      <span className="reading-interior-kicker">THEMATIC SHELF / {books.length} BOOKS</span>
      <h1 className="text-2xl font-bold mb-2 reading-index-title">
        タグ「<span className="text-[var(--accent)]">{decoded}</span>」の本
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">📚 {books.length}冊</p>

      {relatedTags.length > 0 && (
        <div className="mb-8 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg reading-tag-neighbors">
          <h2 className="text-xs font-medium text-[var(--muted)] mb-2">関連タグ</h2>
          <TagCluster tags={relatedTags} />
        </div>
      )}

      <div className="reading-tag-books"><BookGrid books={books} /></div>
      <nav className="reading-tag-end"><Link href="/books/">← すべての本を眺める</Link><Link href="/paths/">読む順番から探す ↗</Link></nav>
    </div>
  );
}
