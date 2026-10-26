import { PathCard } from "@/components/PathCard";
import { JsonLd } from "@/components/JsonLd";
import { getAllPaths, getBookBySlug } from "@/lib/data";
import { breadcrumbListNode, collectionPageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const TOTAL_PATHS = getAllPaths().length;

// 一覧の説明はメタ情報と構造化データで同じ文面を使う（ページに実在する内容だけ）。
const PATHS_DESCRIPTION = `全${TOTAL_PATHS}本の読書パス。実存主義からポストコロニアル、世界文学まで、テーマごとに読む順番と「なぜその順番か」の解説をまとめた一覧です。各ステップには、そこで掴むべき概念と読む理由を添えています。`;

export const metadata = buildMetadata({
  title: "読書パス",
  description: PATHS_DESCRIPTION,
  path: "/paths",
});

export default function PathsPage() {
  const paths = getAllPaths();

  return (
    <div className="reading-interior reading-paths-index max-w-5xl mx-auto px-4 py-8">
      <JsonLd
        data={[
          collectionPageNode({
            name: "読む順番に、意味がある。",
            description: PATHS_DESCRIPTION,
            path: "/paths",
            numberOfItems: paths.length,
          }),
          breadcrumbListNode([
            { name: "ホーム", path: "/" },
            { name: "読書パス", path: "/paths" },
          ]),
        ]}
      />
      <span className="reading-interior-kicker">THE READING ROUTES / 全{paths.length}ルート</span>
      <h1 className="text-2xl font-bold mb-2 reading-index-title">読む順番に、意味がある。</h1>
      <p className="text-[var(--muted)] mb-8 max-w-2xl">
        テーマに沿って順番に読むことで、思想や文学の流れが立体的に見えてくる。
        各ステップに「なぜこの順番か」「ここで何を掴むか」の解説付き。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reading-routes-index-grid">
        {paths.map((path) => {
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

      {paths.length === 0 && (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-lg">🗺️</p>
          <p>まだ読書パスが登録されていません。</p>
        </div>
      )}
    </div>
  );
}
