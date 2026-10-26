import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { JsonLd } from "@/components/JsonLd";
import { TagCluster } from "@/components/TagBadge";
import { getAuthorBySlug, getRecommendationsForAuthor, getAllAuthors, isIndexableAuthor } from "@/lib/data";
import { authorDescription } from "@/lib/descriptions";
import { breadcrumbListNode, profilePageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

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
  // サイト名の接尾辞（" | 読書の羅針盤" = 9文字）を足して70字を超えないよう、
  // 長い名前では原綴りの括弧を落とす（2026-10-27: ゲーテのページが71字だった）。
  const tail = "の代表作・おすすめ本と著書一覧";
  const withLatin = `${author.nameJa}（${author.name}）${tail}`;
  const withoutLatin = `${author.nameJa}${tail}`;
  const title =
    [...withLatin].length <= 61
      ? withLatin
      : [...withoutLatin].length <= 61
        ? withoutLatin
        : `${author.nameJa}の著書一覧`;
  return buildMetadata({
    title,
    description: authorDescription(author),
    path: `/authors/${author.slug}`,
    robots: isIndexableAuthor(author) ? undefined : { index: false, follow: true },
  });
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

  const startHere = (author.readingPaths ?? [])
    .map((item) => ({ ...item, book: author.books.find((book) => book.slug === item.bookSlug) }))
    .filter((item) => Boolean(item.book));

  // 全著者の中から同じ国の著者を抽出
  const sameCountry = getAllAuthors()
    .filter((a) => a.country === author.country && a.slug !== slug)
    .slice(0, 5);

  return (
    <div className="reading-interior reading-author-detail max-w-5xl mx-auto px-4 py-8">
      <JsonLd
        data={[
          profilePageNode({
            name: author.nameJa,
            path: `/authors/${author.slug}`,
            personName: author.name,
            alternateName: author.nameJa,
            // ページの説明は meta description と同じ戻り値
            description: authorDescription(author),
            // Person 自身の説明は、画面に出している著者紹介
            personDescription: author.bioJa || undefined,
            country: author.country,
          }),
          breadcrumbListNode([
            { name: "ホーム", path: "/" },
            { name: "本を探す", path: "/books" },
            { name: author.nameJa, path: `/authors/${author.slug}` },
          ]),
        ]}
      />
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books/" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>{author.nameJa}</span>
      </nav>

      {/* Author Header */}
      <div className="mb-10">
        <span className="reading-interior-kicker">WRITER'S SHELF / {author.country}</span><h1 className="text-2xl sm:text-3xl font-bold mb-1 reading-index-title">{author.nameJa}</h1>
        <p className="text-[var(--muted)]">
          {author.name} · 📍 {author.country} · 📖 {author.books.length}冊
        </p>

        {author.bioJa && (
          <div className="mt-4 p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-2">著者について</h2>
            <p className="text-sm leading-relaxed">{author.bioJa}</p>
            {author.sourceNotesJa && author.sourceNotesJa.length > 0 && (
              <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">出典: {author.sourceNotesJa.join(" ")}</p>
            )}
          </div>
        )}
      </div>

      {startHere.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-2">{author.nameJa}はどれから読む？</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            カミュは小説と思想書の両方から入れます。読みたいものに近い入口を選んでください。
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {startHere.map((item) => item.book && (
              <Link
                key={item.book.slug}
                href={`/books/${item.book.slug}/`}
                className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors"
              >
                <span className="text-xs font-semibold text-[var(--accent)]">{item.label}</span>
                <h3 className="font-semibold mt-1 mb-2">{item.book.titleJa}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{item.reasonJa}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

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
                href={`/authors/${a.slug}/`}
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
