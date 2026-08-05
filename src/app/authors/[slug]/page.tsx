import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { TagCluster } from "@/components/TagBadge";
import { getAuthorBySlug, getRecommendationsForAuthor, getAllAuthors, getAllBooks } from "@/lib/data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Not Found" };
  return {
    title: `${author.nameJa}（${author.name}）の紹介と著書`,
    description: `${author.nameJa}の著書一覧と、関連するおすすめ本。`,
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  // 著者の本のタグを集約
  const allTags = new Map<string, number>();
  for (const book of author.books) {
    for (const tag of book.tags) {
      allTags.set(tag, (allTags.get(tag) || 0) + 1);
    }
  }
  const topTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([slug, count]) => ({ slug, labelJa: slug, count }));

  // レコメンド
  const recs = getRecommendationsForAuthor(author.name);

  // 全著者の中から同じ国の著者を抽出
  const sameCountry = getAllAuthors()
    .filter((a) => a.country === author.country && a.slug !== slug)
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>{author.nameJa}</span>
      </nav>

      {/* Author Header */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">{author.nameJa}</h1>
        <p className="text-[var(--muted)]">
          {author.name} · 📍 {author.country} · 📖 {author.books.length}冊
        </p>

        {author.bioJa && (
          <div className="mt-4 p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-2">著者について</h2>
            <p className="text-sm leading-relaxed">{author.bioJa}</p>
          </div>
        )}
      </div>

      {/* Books by this author */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">著書</h2>
        <BookGrid books={author.books} showAmazon={true} emptyMessage="著書が登録されていません。" />
      </section>

      {/* Tags */}
      {topTags.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-3">関連テーマ</h2>
          <TagCluster tags={topTags} showCount />
        </section>
      )}

      {/* Same country authors */}
      {sameCountry.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-3">同じ国（{author.country}）の著者</h2>
          <div className="flex flex-wrap gap-2">
            {sameCountry.map((a) => (
              <Link
                key={a.slug}
                href={`/authors/${a.slug}`}
                className="text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {a.nameJa} ({a.bookCount}冊)
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations from this author */}
      {recs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{author.nameJa}が好きな人へのおすすめ</h2>
          <BookGrid books={recs.map((r) => r.book)} reasonMap={Object.fromEntries(recs.map((r) => [r.book.slug, r.reasonJa]))} />
        </section>
      )}
    </div>
  );
}
