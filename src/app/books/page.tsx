import { Suspense } from "react";
import { BooksPageClient } from "./BooksPageClient";
import { AllBooksIndex } from "./AllBooksIndex";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "本を探す",
  description: "ジャンル、国、年代から——あなたの次の一冊を見つける。海外の現代作家・思想哲学書を日本語で紹介。",
  path: "/books",
});

// フィルタリングは searchParams に依存するため、静的エクスポートではクライアント側で行う
// （BooksPageClient 参照）。useSearchParams() の利用には Suspense 境界が必須。
// 一覧本体がクライアント描画だと静的HTMLに書籍リンクが残らないので、
// 書名順の索引をサーバー側で併設する（AllBooksIndex 参照）。
export default function BooksPage() {
  return (
    <>
      <Suspense>
        <BooksPageClient />
      </Suspense>
      <AllBooksIndex />
    </>
  );
}
