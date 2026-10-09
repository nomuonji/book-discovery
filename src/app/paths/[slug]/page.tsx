import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPaths, getPathWithBooks, getBookBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const paths = getAllPaths();
  return paths.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = getPathWithBooks(slug);
  if (!path) return { title: "Not Found" };
  const firstCover = path.stepsWithBooks[0]?.book.coverUrl;
  return buildMetadata({
    title: `${path.titleJa} — 読書パス`,
    description: path.descriptionJa.slice(0, 120),
    path: `/paths/${path.slug}`,
    images: firstCover ? [{ url: firstCover, alt: path.titleJa }] : undefined,
  });
}

const difficultyLabels: Record<number, string> = { 1: "入門", 2: "中級", 3: "発展" };
const difficultyColors: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const postcolonialEntryMap = [
  {
    concern: "植民地化された共同体",
    form: "小説",
    bookSlug: "things-fall-apart",
    step: 1,
  },
  {
    concern: "内面化された支配",
    form: "理論",
    bookSlug: "black-skin-white-masks",
    step: 2,
  },
  {
    concern: "帰還と南北関係",
    form: "小説",
    bookSlug: "season-of-migration-to-the-north",
    step: 3,
  },
  {
    concern: "ディアスポラ／二重の帰属",
    form: "小説",
    bookSlug: "the-sympathizer",
    step: 4,
  },
  {
    concern: "世代記憶",
    form: "小説",
    bookSlug: "homegoing",
    step: 5,
  },
] as const;

export default async function PathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const enriched = getPathWithBooks(slug);
  if (!enriched) notFound();

  const { stepsWithBooks, ...path } = enriched;
  const entryMap =
    path.slug === "postcolonial-reading"
      ? postcolonialEntryMap.map((entry) => {
          const step = stepsWithBooks.find(
            (item) => item.order === entry.step && item.bookSlug === entry.bookSlug,
          );
          return step ? { ...entry, titleJa: step.book.titleJa } : null;
        })
      : null;
  const showEntryMap = entryMap?.every((entry) => entry !== null) ? entryMap : null;

  return (
    <div className="reading-interior reading-path-detail max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/paths/" className="hover:text-[var(--accent)] transition-colors">読書パス</Link>
        <span className="mx-2">/</span>
        <span>{path.titleJa}</span>
      </nav>

      {/* Header */}
      <header className="reading-interior-masthead reading-path-cover">
        <span>THE READING ROUTE / {String(stepsWithBooks.length).padStart(2, "0")} BOOKS</span>
        <h1>{path.titleJa}</h1>
        <p>{path.descriptionJa}</p>
        <nav aria-label="この読書パスの入口"><a href="#reading-steps">一冊目からたどる ↓</a><Link href="/paths/">ほかの読書パス ↗</Link></nav>
      </header>
      <nav className="reading-chapter-index" aria-labelledby="reading-chapter-index-heading">
        <div className="reading-chapter-index-heading">
          <span className="reading-interior-kicker">THE ROUTE AT A GLANCE / {difficultyLabels[path.difficulty]}</span>
          <h2 id="reading-chapter-index-heading">この道の目次。</h2>
          <p>各章の読みどころを確認して、気になる本からでも読み進められます。</p>
        </div>
        <ol>
          {stepsWithBooks.map((step) => (
            <li key={step.bookSlug}>
              <a href={`#step-${step.order}`}>
                <span>{String(step.order).padStart(2,"0")}</span>
                <strong>{step.book.titleJa}</strong>
                <small>{step.book.authorJa}</small>
                <span aria-hidden="true">↓</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {showEntryMap && (
        <section aria-labelledby="entry-map-heading" className="mb-10 bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 id="entry-map-heading" className="text-lg font-semibold mb-2">関心から最初の一冊を選ぶ</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
            小説は、植民地化や移動の経験を登場人物の物語としてたどる。理論書は、支配が精神や言葉の中に残る仕組みを説明する。下の5冊は一つの正解順ではなく、関心に近い入口から該当ステップへ進める。
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {showEntryMap.map((entry) => (
              <li key={entry.bookSlug}>
                <a
                  href={`#step-${entry.step}`}
                  className="block h-full rounded-lg border border-[var(--border)] p-3 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="block text-sm font-medium">{entry.concern}</span>
                  <span className="mt-1 block text-sm">
                    {entry.titleJa}
                    <span className="ml-2 text-xs text-[var(--muted)]">{entry.form}</span>
                  </span>
                  <span className="mt-2 block text-xs text-[var(--accent)]">ステップ{entry.step}へ</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      <div className="space-y-0 reading-steps" id="reading-steps">
        {stepsWithBooks.map((step, index) => (
          <div id={`step-${step.order}`} key={step.bookSlug} className="relative step-connector pb-8 pl-10 scroll-mt-6 reading-route-step">
            {/* Step number circle */}
            <div className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-[var(--accent)] bg-[var(--background)] flex items-center justify-center font-bold text-sm text-[var(--accent)] z-10">
              {step.order}
            </div>

            {/* Step content */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 reading-route-chapter">
              <span className="reading-interior-kicker">CHAPTER {String(index+1).padStart(2,"0")} / {index===0?"はじめの一冊":"ここまで読んだら"}</span>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Book card style */}
                <Link
                  href={`/books/${step.book.slug}/`}
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
                    href={`/books/${step.book.slug}/`}
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
            href="/paths/"
            className="text-sm px-4 py-2 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            他の読書パスを見る
          </Link>
          <Link
            href="/recommend/"
            className="text-sm px-4 py-2 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
          >
            おすすめを探す
          </Link>
        </div>
      </div>
    </div>
  );
}
