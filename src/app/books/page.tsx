import { Suspense } from "react";
import { BooksPageClient } from "./BooksPageClient";
import { AllBooksIndex } from "./AllBooksIndex";
import { JsonLd } from "@/components/JsonLd";
import { getAllBooks } from "@/lib/data";
import { breadcrumbListNode, collectionPageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const TOTAL_BOOKS = getAllBooks().length;

// 一覧の説明はメタ情報と構造化データで同じ文面を使う（ページに実在する内容だけ）。
const BOOKS_DESCRIPTION = `全${TOTAL_BOOKS}冊の書名索引と、カテゴリ・ジャンル・国・出版年による絞り込み。古典から現代の受賞作まで、収録した海外文学と思想書を五十音順に並べた一覧です。各冊のページでは、読む理由と次に読む一冊を案内しています。`;

export const metadata = buildMetadata({
  title: "本を探す",
  description: BOOKS_DESCRIPTION,
  path: "/books",
});

// フィルタリングは searchParams に依存するため、静的エクスポートではクライアント側で行う
// （BooksPageClient 参照）。useSearchParams() の利用には Suspense 境界が必須。
// クライアント描画の中にしか無かった見出しは、静的なHTMLにも h1 を残すためここへ移した。
// 一覧本体がクライアント描画だと静的HTMLに書籍リンクが残らないので、
// 書名順の索引をサーバー側で併設する（AllBooksIndex 参照）。
export default function BooksPage() {
  return (
    <>
      <div className="reading-interior reading-books-catalog max-w-5xl mx-auto px-4 py-8">
        <JsonLd
          data={[
            collectionPageNode({
              name: "本を並べる、理由をたどる。",
              description: BOOKS_DESCRIPTION,
              path: "/books",
              numberOfItems: TOTAL_BOOKS,
              itemListOrder: "ascending",
            }),
            breadcrumbListNode([
              { name: "ホーム", path: "/" },
              { name: "本を探す", path: "/books" },
            ]),
          ]}
        />
        <span className="reading-interior-kicker">THE OPEN SHELF / THE CATALOG</span>
        <h1 className="text-2xl font-bold mb-2 reading-index-title">本を並べる、<br />理由をたどる。</h1>
        <p className="text-[var(--muted)] mb-6">
          全{TOTAL_BOOKS}冊から、カテゴリ・ジャンル・国・年代で絞り込み。
        </p>
        <Suspense>
          <BooksPageClient />
        </Suspense>
      </div>
      <AllBooksIndex />
    </>
  );
}
