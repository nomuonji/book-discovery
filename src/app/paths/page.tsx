import { PathCard } from "@/components/PathCard";
import { getAllPaths, getBookBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "読書パス",
  description: "テーマに沿って順番に読むことで理解が深まる、厳選された読書ガイド。実存主義から現代思想、世界文学まで。",
  path: "/paths",
});

export default function PathsPage() {
  const paths = getAllPaths();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">読書パス</h1>
      <p className="text-[var(--muted)] mb-8 max-w-2xl">
        テーマに沿って順番に読むことで、思想や文学の流れが立体的に見えてくる。
        各ステップに「なぜこの順番か」「ここで何を掴むか」の解説付き。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
