import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPaths, getPathWithBooks, getBookBySlug } from "@/lib/data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const paths = getAllPaths();
  return paths.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const paths = getAllPaths();
  const path = paths.find((p) => p.slug === slug);
  if (!path) return { title: "Not Found" };
  return {
    title: path.titleJa,
    description: path.descriptionJa.slice(0, 120),
  };
}

const difficultyLabels: Record<number, string> = { 1: "入門", 2: "中級", 3: "発展" };
const difficultyColors: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default async function PathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const enriched = getPathWithBooks(slug);
  if (!enriched) notFound();

  const { stepsWithBooks, ...path } = enriched;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/paths" className="hover:text-[var(--accent)] transition-colors">読書パス</Link>
        <span className="mx-2">/</span>
        <span>{path.titleJa}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{path.titleJa}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColors[path.difficulty]}`}>
            {difficultyLabels[path.difficulty]}
          </span>
        </div>
        <p className="text-[var(--muted)] max-w-2xl leading-relaxed">{path.descriptionJa}</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          📖 全{stepsWithBooks.length}冊 · 順番に読むことをおすすめします
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {stepsWithBooks.map((step, index) => (
          <div key={step.bookSlug} className="relative step-connector pb-8 pl-10">
            {/* Step number circle */}
            <div className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-[var(--accent)] bg-[var(--background)] flex items-center justify-center font-bold text-sm text-[var(--accent)] z-10">
              {step.order}
            </div>

            {/* Step content */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Book card style */}
                <Link
                  href={`/books/${step.book.slug}`}
                  className="shrink-0 w-16 h-22 sm:w-20 sm:h-28 rounded overflow-hidden shadow-sm hover:ring-2 ring-[var(--accent)] transition-all relative"
                >
                  {step.book.coverUrl ? (
                    <Image
                      src={step.book.coverUrl}
                      alt={step.book.titleJa}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  ) : (
                    <div className="cover-placeholder w-full h-full flex items-center justify-center text-white/60 text-[10px] text-center p-1 leading-tight">
                      {step.book.titleJa}
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/books/${step.book.slug}`}
                    className="font-semibold hover:text-[var(--accent)] transition-colors"
                  >
                    {step.book.titleJa}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {step.book.authorJa} · {step.book.title} ({step.book.year})
                  </p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-[var(--accent)]">📝 ここでの読みどころ</span>
                      <p className="text-sm text-[var(--muted)] mt-0.5">{step.noteJa}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[var(--accent)]">🔑 掴むべき概念</span>
                      <p className="text-sm text-[var(--muted)] mt-0.5">{step.keyConceptJa}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Related recommendations at the bottom */}
      <div className="mt-12 p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-center">
        <p className="text-[var(--muted)] text-sm">
          この読書パスを終えたら、関連する別のパスや個別のレコメンドもチェックしてみてください。
        </p>
        <div className="flex gap-3 justify-center mt-3">
          <Link
            href="/paths"
            className="text-sm px-4 py-2 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            他の読書パスを見る
          </Link>
          <Link
            href="/recommend"
            className="text-sm px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            おすすめを探す
          </Link>
        </div>
      </div>
    </div>
  );
}
