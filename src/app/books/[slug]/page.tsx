import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { FilterNavButton } from "@/components/FilterNavButton";
import { getBookBySlug, getRecommendationsFrom, getPathsContainingBook, getAllBooks } from "@/lib/data";
import { getAmazonLink, getAmazonSearchLink, getAmazonComSearchLink, AMAZON_DISCLAIMER } from "@/lib/amazon";
import { buildMetadata } from "@/lib/seo";
import { ReadingPath } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const books = getAllBooks();
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Not Found" };
  const title = book.editionNoteJa
    ? `${book.title}（${book.authorJa}）`
    : `${book.titleJa}（${book.authorJa}）`;
  const description = book.editionNoteJa
    ? book.editionNoteJa.slice(0, 120)
    : book.descriptionJa.slice(0, 120);
  return buildMetadata({
    title,
    description,
    path: `/books/${book.slug}`,
    type: "book",
    bookAuthors: [book.authorJa],
    images: book.coverUrl
      ? [{ url: book.coverUrl, alt: `${book.title}の書影` }]
      : undefined,
  });
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const recommendations = getRecommendationsFrom(slug);
  const paths = getPathsContainingBook(slug);
  const structuredName = book.editionNoteJa ? book.title : book.titleJa;

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: structuredName,
    alternateName: book.editionNoteJa ? book.titleJa : book.title,
    inLanguage: book.editionNoteJa ? "en" : undefined,
    author: { "@type": "Person", name: book.authorJa },
    datePublished: String(book.year),
    genre: book.genre,
    image: book.coverUrl || undefined,
    description: book.editionNoteJa || book.descriptionJa,
  };

  return (
    <div className="reading-interior reading-book-detail max-w-5xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/books/" className="hover:text-[var(--accent)] transition-colors">本を探す</Link>
        <span className="mx-2">/</span>
        <span>{book.title}</span>
      </nav>

      <div className="reading-interior-masthead">
        <span>BOOK RECORD / {book.year} / {book.country}</span>
        <strong>一冊を、次の一冊につなぐ。</strong>
        <p>この本の輪郭、読む理由、そして読み終えた先へ。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reading-book-detail-layout">
        <div className="md:col-span-1 reading-book-detail-aside">
          <div className="sticky top-20">
            <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-md mb-4 relative">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              ) : (
                <div className="cover-placeholder w-full h-full flex items-center justify-center text-white/80 p-4 text-center text-sm">
                  {book.title}
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--muted)] text-xs">原題</span>
                <p className="font-medium">{book.title}</p>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs">著者</span>
                <p className="font-medium">
                  {book.authorJa}
                  <span className="text-[var(--muted)] ml-1">({book.author})</span>
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs">国・出版年</span>
                <p>{book.country} / {book.year}年</p>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs">ジャンル</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.genre.map((g) => (
                    <FilterNavButton
                      key={g}
                      href={`/books/?genre=${encodeURIComponent(g)}`}
                      className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      ariaLabel={`${g}で本を絞り込む`}
                    >
                      {g}
                    </FilterNavButton>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs">テーマ</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)]/30 text-[var(--muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--border)]">
                <a
                  href={
                    book.asin
                      ? getAmazonLink(book.asin)
                      : getAmazonSearchLink(book.title, book.author, book.titleJa, book.authorJa)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-sm py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium transition-colors"
                >
                  {book.editionNoteJa ? "🛒 Amazon.co.jpで英語版を探す" : "🛒 Amazonで見る（日本語版）"}
                </a>
                <a
                  href={getAmazonComSearchLink(book.titleEn || book.title, book.author)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-sm py-2.5 mt-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--muted)] font-medium transition-colors"
                >
                  🌐 原書をAmazon.comで探す（英語版）
                </a>
                <p className="text-[10px] text-[var(--muted)] mt-2 leading-relaxed">
                  {AMAZON_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 reading-book-detail-text">
          <div>
            <span className="reading-interior-kicker">THIS BOOK / 作品案内</span>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{book.editionNoteJa ? book.title : book.titleJa}</h1>
            <p className="text-[var(--muted)]">
              {book.authorJa} / {book.country} / {book.year}年
            </p>
          </div>

          {book.editionNoteJa && (
            <section className="border-l-4 border-[var(--accent)] bg-[var(--card)] rounded-r-lg px-4 py-3">
              <h2 className="text-xs font-bold text-[var(--accent)] mb-1">日本語版の有無</h2>
              <p className="text-sm leading-relaxed">{book.editionNoteJa}</p>
            </section>
          )}

          {book.selectionReasonJa && (
            <section className="border-l-4 border-[var(--accent)] bg-[var(--card)] rounded-r-lg px-4 py-3">
              <h2 className="text-xs font-bold text-[var(--accent)] mb-1 flex items-center gap-1">
                <span>🏆</span> 選書理由
              </h2>
              <p className="text-sm leading-relaxed">{book.selectionReasonJa}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>📖</span> この本について
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">{book.descriptionJa}</p>
          </section>

          <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>💡</span> なぜ読むべきか
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">{book.whyReadJa}</p>
          </section>

          {book.sources && book.sources.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-2">出典・参考</h2>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                {book.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {paths.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🗺️</span> この本が含まれる読書パス
              </h2>
              <div className="space-y-3">
                {paths.map((path) => (
                  <PathInline key={path.slug} path={path} currentBookSlug={slug} />
                ))}
              </div>
            </section>
          )}

          {recommendations.length > 0 && (
            <section className="reading-next-book-feature" aria-labelledby="reading-next-book-heading">
              <span className="reading-interior-kicker">A BOOK AFTER THIS ONE</span>
              <h2 id="reading-next-book-heading">読み終えたら、次は。</h2>
              <Link href={"/books/" + recommendations[0].book.slug + "/"} className="reading-next-link">
                <span className="reading-next-link-figure">02 <small>ANOTHER BOOK</small></span>
                <span className="reading-next-link-copy"><strong>{recommendations[0].book.titleJa}</strong><small>{recommendations[0].book.authorJa}</small><span>{recommendations[0].reasonJa}</span></span>
                <span aria-hidden="true">↗</span>
              </Link>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🎯</span> この本が好きな人へのおすすめ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.slice(1).map((rec) => (
                  <BookCard key={rec.toSlug} book={rec.book} reason={rec.reasonJa} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function PathInline({ path, currentBookSlug }: { path: ReadingPath; currentBookSlug: string }) {
  const currentStepIndex = path.steps.findIndex((s) => s.bookSlug === currentBookSlug);
  const difficultyLabels: Record<number, string> = { 1: "入門", 2: "中級", 3: "発展" };

  return (
    <Link
      href={`/paths/${path.slug}/`}
      className="block bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg p-4 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm hover:text-[var(--accent)] transition-colors">
          {path.titleJa}
        </h3>
        <span className="shrink-0 ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          {difficultyLabels[path.difficulty]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <span>{path.steps.length}冊の読書パス</span>
        {currentStepIndex >= 0 && (
          <>
            <span>·</span>
            <span className="text-[var(--accent)] font-medium">
              この本は {currentStepIndex + 1} 冊目
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
