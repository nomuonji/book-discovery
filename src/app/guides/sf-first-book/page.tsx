import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import {
  getBookBySlug,
  getPathsContainingBook,
  getRecommendationsFrom,
} from "@/lib/data";

export const metadata = buildMetadata({
  title: "SF小説の最初の一冊｜読みたい体験から選ぶ固定ガイド",
  description:
    "SF小説を何から読めばいいか迷う人へ。読みたい体験と読書負荷から最初の一冊を6つに絞り、次の一冊や読書パスまで案内します。",
  path: "/guides/sf-first-book",
});

const STARTS = [
  {
    slug: "stories-of-your-life-and-others",
    prompt: "短い話から、SFの思考実験を味わいたい",
    reason:
      "『あなたの人生の物語』は、言語学や物理学をモチーフにした短編で、映画『メッセージ』の原作も含みます。長いシリーズに入る前に、SFが「世界の見え方を変える」感覚を一編ずつ確認したい人の入口です。",
    friction:
      "短編なので完結は早いですが、各話の設定を丁寧に追う必要があります。物語のスピードよりアイデアの精度を楽しむ読み方になります。",
  },
  {
    slug: "the-city-and-the-city",
    prompt: "ミステリのように都市の謎から入りたい",
    reason:
      "『都市と都市』は、重なり合う二つの都市を舞台にした世界SF賞受賞作です。SFの設定をミステリの調査として読むことで、初めてのSFでも「何が起きているか」を追う楽しみが得られます。",
    friction:
      "二つの都市のルールを最初に把握する必要があります。読み始めは少し混乱するかもしれませんが、ルールが分かると一気に引き込まれます。",
  },
  {
    slug: "fahrenheit-451",
    prompt: "ディストピアの緊張感から入りたい",
    reason:
      "『華氏451度』は、本が禁じられた社会で消防士が本を燃やす古典です。短い分量で「社会がどう変わると本がなくなるか」を考えさせ、ディストピアSFの入口として読みやすい一冊です。",
    friction:
      "1950年代の作品なので、現代の監視社会とは異なる部分もあります。当時の文脈を少し意識すると、より深く読めます。",
  },
  {
    slug: "dune",
    prompt: "壮大な宇宙と政治のスケールを味わいたい",
    reason:
      "『デューン』は、砂漠の惑星アラキスを舞台にした権力と生態系の物語です。世界の広さと複雑な勢力を一冊で感じたい人に向きますが、用語が多いので最初はゆっくり進めるのがおすすめです。",
    friction:
      "人名や用語が多く、最初の100ページは世界観の把握に集中します。付録や用語集を活用すると負担が減ります。",
  },
  {
    slug: "solaris",
    prompt: "哲学的な問いと未知の接触を考えたい",
    reason:
      "『ソラリス』は、理解できない海の惑星と人間の接触を描いたポーランドの古典です。アクションより「人間が何を理解できないか」を考える読み方で、SFの哲学的な側面を最初に味わいたい人に向きます。",
    friction:
      "展開がゆっくりで、内面の描写が中心です。ストーリーのスピードより、思索の深さを楽しむ必要があります。",
  },
  {
    slug: "the-martian",
    prompt: "科学と生存のリアリティから入りたい",
    reason:
      "『火星の人』は、火星に取り残された宇宙飛行士の生存記録です。科学的な問題解決を一つずつ追うことで、ハードSFの楽しみを短めの分量で体験できます。",
    friction:
      "技術的な説明が続く場面があります。科学の詳細より「どうやって生き延びるか」の工夫に焦点を当てると読みやすくなります。",
  },
] as const;

function buildRoute(slug: string) {
  const book = getBookBySlug(slug);
  if (!book) return null;

  const next = getRecommendationsFrom(slug).find((rec) => rec.type !== "reading-path");
  const path = getPathsContainingBook(slug)[0];

  return { book, next, path };
}

export default function SfFirstBookGuidePage() {
  const routes = STARTS.map((start) => ({
    ...start,
    route: buildRoute(start.slug),
  })).filter((item) => item.route !== null);

  return (
    <main className="reading-interior reading-literary-guide max-w-5xl mx-auto px-4 py-10 sm:py-14">
      <header className="max-w-3xl mb-10">
        <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">
          FIRST BOOK GUIDE
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 leading-tight">
          SF小説の最初の一冊を、<br className="hidden sm:block" />
          読みたい体験から選ぶ
        </h1>
        <p className="text-[var(--muted)] leading-relaxed">
          大量の作品名を眺める前に、まず「どんな体験を読みたいか」から一冊だけ選びます。
          ここではランキングを作らず、6つの読書体験から入口を決め、その本を読み終えた後の
          <strong className="text-[var(--fg)]">次の一冊</strong>までつなぎます。
        </p>
      </header>

      <nav className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 mb-10" aria-label="SFの選び方">
        <p className="text-sm font-semibold mb-3">いま近いものを選ぶ</p>
        <div className="flex flex-wrap gap-2">
          {routes.map((item, index) => (
            <a
              key={item.slug}
              href={`#route-${index + 1}`}
              className="text-sm px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {item.prompt}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-7">
        {routes.map((item, index) => {
          const { book, next, path } = item.route!;
          return (
            <section
              key={item.slug}
              id={`route-${index + 1}`}
              className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)] text-sm font-bold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--accent)] font-medium mb-1">{item.prompt}</p>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    <Link href={`/books/${book.slug}/`} className="hover:text-[var(--accent)] transition-colors">
                      『{book.titleJa}』
                    </Link>
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-1">{book.authorJa}</p>
                </div>
              </div>

              <p className="mt-5 leading-relaxed">{item.reason}</p>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                読書負荷の目安：{item.friction}
              </p>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                このサイトでの選書理由：{book.selectionReasonJa}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {next && (
                  <Link
                    href={`/books/${next.book.slug}/`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 hover:border-[var(--accent)] transition-colors"
                  >
                    <span className="text-[11px] font-semibold tracking-wider text-[var(--accent)]">NEXT BOOK</span>
                    <p className="font-semibold mt-1">次は『{next.book.titleJa}』へ</p>
                    <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">{next.reasonJa}</p>
                  </Link>
                )}
                {path && (
                  <Link
                    href={`/paths/${path.slug}/`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 hover:border-[var(--accent)] transition-colors"
                  >
                    <span className="text-[11px] font-semibold tracking-wider text-[var(--accent)]">READING PATH</span>
                    <p className="font-semibold mt-1">順番に広げる</p>
                    <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">{path.titleJa}</p>
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-12 border-t border-[var(--border)] pt-8">
        <h2 className="text-xl font-bold mb-3">まだ決められないなら</h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-5">
          ここにない本が好きでも大丈夫です。Book Discoveryの推薦ツールでは、
          好きな本・作家・テーマを入力して、収録済みの推薦関係から次の候補を探せます。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/recommend/"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] rounded-lg font-medium hover:opacity-90"
          >
            次の一冊を探す
          </Link>
          <Link
            href="/tags/SF/"
            className="inline-flex items-center px-5 py-2.5 border border-[var(--border)] rounded-lg font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            SFの棚を見る
          </Link>
        </div>
      </section>
    </main>
  );
}
