import Link from "next/link";
import { BookGrid } from "@/components/BookGrid";
import { PathCard } from "@/components/PathCard";
import { CategoryNav } from "@/components/CategoryNav";
import { getAllPaths, getBookBySlug, getStats } from "@/lib/data";

export default function HomePage() {
  const paths = getAllPaths();
  const stats = getStats();

  const featuredSlugs = [
    "the-stranger", "my-brilliant-friend", "what-we-talk-about-when-we-talk-about-love",
    "the-vegetarian", "flights", "klara-and-the-sun",
  ];
  const featuredBooks = featuredSlugs
    .map((slug) => getBookBySlug(slug))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  return (
    <div>
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            世界の<span className="text-[var(--accent)]">名作</span>を、次の一冊に
          </h1>
          <p className="text-[var(--muted)] text-base sm:text-lg mb-4 max-w-lg mx-auto leading-relaxed">
            文学史に残る古典から現代の受賞作まで、<strong className="text-[var(--fg)]">厳選した世界の名作だけ</strong>を収録。
            「村上春樹が好きならこれも」——名作との新しい出会いを。
          </p>
          <div className="flex justify-center gap-4 text-sm text-[var(--muted)] mb-8">
            <span>📚 {stats.totalBooks}冊</span>
            <span>👤 {stats.totalAuthors}名</span>
            <span>🌍 {stats.totalCountries}カ国</span>
            <span>🗺️ {stats.totalPaths}パス</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/recommend" className="inline-flex items-center justify-center px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
              🎯 おすすめを探す
            </Link>
            <Link href="/paths" className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-medium">
              🗺️ 読書パスを見る
            </Link>
            <Link href="/books" className="inline-flex items-center justify-center px-6 py-3 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-medium">
              📚 本を探す
            </Link>
          </div>
        </div>
      </section>

      {/* Curation Policy */}
      <section className="border-y border-[var(--border)] bg-[var(--card)]/50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-center mb-8">なぜ「名作」だけ？</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-semibold text-sm mb-1">受賞作・文学史の古典</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                ノーベル賞・ブッカー賞・ピューリッツァー賞などの受賞作と、
                時代を超えて読み継がれてきた古典を中心に選書。
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-sm mb-1">一冊ごとに選書理由</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                収録されたすべての本に「なぜ選んだか」の理由を明記。
                本当に読む価値があるか、迷わず判断できます。
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌍</div>
              <h3 className="font-semibold text-sm mb-1">世界の文学の地図</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                西洋古典からアジア・アフリカ・ラテンアメリカの現代文学まで。
                名作を通じて、世界の文学が見渡せる。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Overview */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-2">カテゴリから探す</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          6つのカテゴリであなたの興味に合った本を見つける
        </p>
        <CategoryNav />
      </section>

      {/* Reading Paths */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">読書パス</h2>
            <p className="text-sm text-[var(--muted)] mt-1">順番に読むことで理解が深まるテーマ別ガイド</p>
          </div>
          <Link href="/paths" className="text-sm text-[var(--accent)] hover:underline shrink-0">すべて見る →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.slice(0, 6).map((path) => {
            const firstBook = path.steps.length > 0 ? getBookBySlug(path.steps[0].bookSlug) : undefined;
            return (
              <PathCard key={path.slug} slug={path.slug} titleJa={path.titleJa} descriptionJa={path.descriptionJa}
                difficulty={path.difficulty} stepCount={path.steps.length} representativeBook={firstBook} />
            );
          })}
        </div>
      </section>

      {/* Pickup Books */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">ピックアップ</h2>
            <p className="text-sm text-[var(--muted)] mt-1">世界中で評価されている、まず手に取りたい6冊</p>
          </div>
          <Link href="/books" className="text-sm text-[var(--accent)] hover:underline shrink-0">すべて見る →</Link>
        </div>
        <BookGrid books={featuredBooks} />
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">「好きな作家」から次の一冊を</h2>
          <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
            「村上春樹」「カミュ」「ハン・ガン」——好きな作家や本の名前を入れると、AIが厳選したおすすめを表示します。
          </p>
          <Link href="/recommend" className="inline-flex items-center px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
            おすすめを探してみる →
          </Link>
        </div>
      </section>
    </div>
  );
}
