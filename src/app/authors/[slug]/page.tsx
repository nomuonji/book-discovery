import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookGrid";
import { TagCluster } from "@/components/TagBadge";
import { getAuthorBySlug, getRecommendationsForAuthor, getAllAuthors, isIndexableAuthor } from "@/lib/data";
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
  return buildMetadata({
    title: `${author.nameJa}（${author.name}）の代表作・おすすめ本と著書一覧`,
    description: author.slug === "albert-camus"
      ? "アルベール・カミュとは、20世紀フランス語文学を代表する作家・思想家の一人。『異邦人』『シーシュポスの神話』『ペスト』から、読みたい入口別に最初の一冊を選べます。"
      : `${author.nameJa}の代表作と著書${author.books.length}冊の一覧。どれから読むかと関連するおすすめ本を紹介します。`,
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

  const camusStartHere = author.slug === "albert-camus"
    ? [
        { slug: "the-stranger", label: "小説から", reason: "短い小説で、不条理というカミュの中心テーマを物語としてつかみやすい入口。" },
        { slug: "the-myth-of-sisyphus", label: "思想から", reason: "「不条理」を哲学的エッセイとして正面から考えたい人向け。" },
        { slug: "the-plague", label: "感染症と連帯の物語から", reason: "封鎖された都市を舞台に、不条理の中で他者とどう行動するかを読む長編。" },
      ]
        .map((item) => ({ ...item, book: author.books.find((book) => book.slug === item.slug) }))
        .filter((item) => Boolean(item.book))
    : [];

  // 全著者の中から同じ国の著者を抽出
  const sameCountry = getAllAuthors()
    .filter((a) => a.country === author.country && a.slug !== slug)
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books/" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
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

      {camusStartHere.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-2">アルベール・カミュはどれから読む？</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            カミュは小説と思想書の両方から入れます。読みたいものに近い入口を選んでください。
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {camusStartHere.map((item) => item.book && (
              <Link
                key={item.book.slug}
                href={`/books/${item.book.slug}/`}
                className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors"
              >
                <span className="text-xs font-semibold text-[var(--accent)]">{item.label}</span>
                <h3 className="font-semibold mt-1 mb-2">{item.book.titleJa}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{item.reason}</p>
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
