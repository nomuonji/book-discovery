import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import {
  getBookBySlug,
  getPathsContainingBook,
  getRecommendationsFrom,
} from "@/lib/data";

export const metadata = buildMetadata({
  title: "海外文学おすすめ｜最初の一冊を6つの読書タイプから選ぶ",
  description:
    "海外文学を何から読めばいいか迷う人へ。読みたい体験から最初の一冊を6冊に絞り、その本の次に読む一冊や読書パスまで案内します。",
  path: "/guides/overseas-literature",
});

const STARTS = [
  {
    slug: "the-stranger",
    prompt: "余計な説明のない、鋭い作品から入りたい",
    reason:
      "『異邦人』は、社会の規範から少し外れた人物を通して世界の不条理を考える入口になります。思想小説に興味はあるけれど、まずは物語から入りたい人向けの出発点です。",
  },
  {
    slug: "my-brilliant-friend",
    prompt: "友情や人間関係に深く入り込みたい",
    reason:
      "『リナと私』は、二人の女性の友情と競争、成長を長い時間軸で追います。大きな思想より、人間関係の細部から現代文学へ入りたい人に向く一冊です。",
  },
  {
    slug: "the-vegetarian",
    prompt: "静かな違和感が残る現代文学を読みたい",
    reason:
      "『菜食主義者』は、ある選択をきっかけに家族や社会とのずれが広がっていく作品です。現代アジア文学の強度を一冊で感じたいときの入口になります。",
  },
  {
    slug: "one-hundred-years-of-solitude",
    prompt: "現実と幻想が混ざる大きな物語に浸りたい",
    reason:
      "『百年の孤独』は、一族の歴史を通して現実と神話が自然に交わる世界を描きます。ラテンアメリカ文学やマジックリアリズムへ進みたい人の中心点になる作品です。",
  },
  {
    slug: "klara-and-the-sun",
    prompt: "未来の設定から、人間とは何かを考えたい",
    reason:
      "『クララとお日さま』は、AIの視点を通して愛情や人間らしさを見つめます。文学としてのSFから世界文学へ入るルートを作りやすい一冊です。",
  },
  {
    slug: "the-great-gatsby",
    prompt: "20世紀の定番から、英語圏文学を広げたい",
    reason:
      "『華麗なるギャツビー』は、夢、階級、恋愛を一つの物語に凝縮したアメリカ文学の代表作です。ここから時代や国をずらしながら読み広げられます。",
  },
] as const;

function buildRoute(slug: string) {
  const book = getBookBySlug(slug);
  if (!book) return null;

  const next = getRecommendationsFrom(slug).find((rec) => rec.type !== "reading-path");
  const path = getPathsContainingBook(slug)[0];

  return { book, next, path };
}

export default function OverseasLiteratureGuidePage() {
  const routes = STARTS.map((start) => ({
    ...start,
    route: buildRoute(start.slug),
  })).filter((item) => item.route !== null);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      <header className="max-w-3xl mb-10">
        <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">
          FIRST BOOK GUIDE
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 leading-tight">
          海外文学のおすすめを、<br className="hidden sm:block" />
          「最初の一冊」まで絞る
        </h1>
        <p className="text-[var(--muted)] leading-relaxed">
          50冊、100冊のリストを見る前に、まず「いま何を読みたいか」から一冊だけ選びます。
          ここではランキングを作らず、6つの読書体験から入口を決め、その本を読み終えた後の
          <strong className="text-[var(--fg)]">次の一冊</strong>までつなぎます。
        </p>
      </header>

      <nav className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 mb-10" aria-label="海外文学の選び方">
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
            href="/paths/"
            className="inline-flex items-center px-5 py-2.5 border border-[var(--border)] rounded-lg font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            読書パスを見る
          </Link>
        </div>
      </section>
    </main>
  );
}
