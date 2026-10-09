import Link from "next/link";
import { BookGrid } from "@/components/BookGrid";
import { PathCard } from "@/components/PathCard";
import { CategoryNav } from "@/components/CategoryNav";
import { getAllPaths, getBookBySlug, getStats } from "@/lib/data";

export default function HomePage() {
  const paths = getAllPaths();
  const stats = getStats();
  // Demonstrate an existing editorial connection, rather than inventing a recommendation.
  const examplePath = paths.find((path) => path.slug === "existentialism-to-modern-thought");
  const exampleSteps = examplePath?.steps.slice(0, 2).flatMap((step) => {
    const book = getBookBySlug(step.bookSlug);
    return book ? [{ step, book }] : [];
  }) ?? [];

  const featuredSlugs = [
    "the-stranger", "my-brilliant-friend", "what-we-talk-about-when-we-talk-about-love",
    "the-vegetarian", "flights", "klara-and-the-sun",
  ];
  const featuredBooks = featuredSlugs
    .map((slug) => getBookBySlug(slug))
    .filter((book): book is NonNullable<typeof book> => book !== undefined);

  return (
    <div>
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">READING DISCOVERY</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mt-3 mb-4 leading-tight">
            次に読む一冊を、<br className="hidden sm:block" />
            <span className="text-[var(--accent)]">いま好きな本</span>から見つける
          </h1>
          <p className="text-[var(--muted)] text-base sm:text-lg mb-5 max-w-xl mx-auto leading-relaxed">
            本を並べるだけのデータベースではなく、好きな本・作家・テーマから
            「次にどこへ進むか」を選ぶための読書案内です。
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[var(--muted)] mb-8">
            <span>📚 {stats.totalBooks}冊の選書</span>
            <span>🔗 {stats.totalRecommendations}件の推薦関係</span>
            <span>🗺️ {stats.totalPaths}本の読書パス</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/recommend/" className="inline-flex items-center justify-center px-6 py-3 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium">
              🎯 次の一冊を探す
            </Link>
            <Link href="/paths/" className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-medium">
              🗺️ 読む順番から探す
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]/50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-center mb-2">3つの入口から選ぶ</h2>
          <p className="text-sm text-[var(--muted)] text-center mb-8">タイトルを知っていても、知らなくても始められます。</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/recommend/" className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 hover:border-[var(--accent)] transition-colors">
              <div className="text-2xl mb-3">📖</div>
              <h3 className="font-semibold mb-1">好きな本・作家から</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                「これが好き」を起点に、雰囲気・テーマ・影響関係がつながる次の候補へ。
              </p>
            </Link>
            <Link href="/recommend/" className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 hover:border-[var(--accent)] transition-colors">
              <div className="text-2xl mb-3">💭</div>
              <h3 className="font-semibold mb-1">今読みたいテーマから</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                孤独、恋愛、哲学、家族、SFなど、いまの関心から候補を見つける。
              </p>
            </Link>
            <Link href="/paths/" className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 hover:border-[var(--accent)] transition-colors">
              <div className="text-2xl mb-3">🗺️</div>
              <h3 className="font-semibold mb-1">読む順番から</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                一冊ずつ意味のある順番で進み、文学や思想のつながりごと読む。
              </p>
            </Link>
          </div>
        </div>
      </section>

      {examplePath && exampleSteps.length === 2 && (
        <section aria-labelledby="reading-trail-title" className="max-w-5xl mx-auto px-4 py-10">
          <div className="border-y-2 border-[var(--accent)] py-8 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] mb-2">TWO BOOKS / ONE THREAD</p>
                <h2 id="reading-trail-title" className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">一冊のあとに、もう一冊。</h2>
                <p className="text-[var(--muted)] max-w-xl leading-relaxed">
                  次に何を読むかは、似たジャンルだけでは決まらない。
                  実際の読書パスから、二冊のあいだにある理由をひとつ紹介します。
                </p>
              </div>
              <Link href={`/paths/${examplePath.slug}/`} className="text-sm text-[var(--accent)] hover:underline shrink-0">
                この読書パスを全部読む →
              </Link>
            </div>
            <ol className="grid gap-4 md:grid-cols-2">
              {exampleSteps.map(({ step, book }, index) => (
                <li key={book.slug} className="relative border-l-4 border-[var(--accent)] bg-[var(--card)] px-5 py-5 sm:px-7">
                  <p className="text-xs font-semibold text-[var(--accent)] mb-2">
                    {index === 0 ? "01 / ここから" : "02 / その次に"}
                  </p>
                  <h3 className="font-bold text-lg mb-1">
                    <Link href={`/books/${book.slug}/`} className="hover:underline">{book.titleJa}</Link>
                  </h3>
                  <p className="text-xs text-[var(--muted)] mb-3">{book.authorJa}</p>
                  <p className="text-sm leading-relaxed">{step.noteJa}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">読書パス</h2>
            <p className="text-sm text-[var(--muted)] mt-1">「何を、どの順番で読むか」まで決めたい人へ</p>
          </div>
          <Link href="/paths/" className="text-sm text-[var(--accent)] hover:underline shrink-0">{paths.length}本すべて見る →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.slice(0, 6).map((path) => {
            const firstBook = path.steps.length > 0 ? getBookBySlug(path.steps[0].bookSlug) : undefined;
            return (
              <PathCard
                key={path.slug}
                slug={path.slug}
                titleJa={path.titleJa}
                descriptionJa={path.descriptionJa}
                difficulty={path.difficulty}
                stepCount={path.steps.length}
                representativeBook={firstBook}
              />
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] mb-1">START HERE</p>
            <h2 className="font-bold text-lg">海外文学、最初の一冊で迷っているなら</h2>
            <p className="text-sm text-[var(--muted)] mt-1">100冊のリストではなく、読みたい体験を6つに分けて一冊まで絞ります。</p>
          </div>
          <Link href="/guides/overseas-literature/" className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline">
            海外文学ガイドを見る →
          </Link>
        </div>

        <h2 className="text-xl font-bold mb-2">広く眺めたいときは</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          6つの大きなカテゴリから選書全体を見渡せます。細かい条件の絞り込みは「本を探す」で使えます。
        </p>
        <CategoryNav />
        <div className="mt-4">
          <Link href="/books/" className="text-sm text-[var(--accent)] hover:underline">
            全{stats.totalBooks}冊を検索・絞り込み →
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">入口にしやすい6冊</h2>
            <p className="text-sm text-[var(--muted)] mt-1">ここから推薦をたどって、次の一冊へ進めます。</p>
          </div>
          <Link href="/books/" className="text-sm text-[var(--accent)] hover:underline shrink-0">本を探す →</Link>
        </div>
        <BookGrid books={featuredBooks} />
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">本の名前が一冊浮かべば、そこから始められます</h2>
          <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
            収録済みの推薦関係には「なぜ次にこの本なのか」の理由があります。
            作家名やテーマしか浮かばない場合も、そのまま入力できます。
          </p>
          <Link href="/recommend/" className="inline-flex items-center px-6 py-3 bg-[var(--accent)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium">
            次の一冊を探してみる →
          </Link>
        </div>
      </section>
    </div>
  );
}
