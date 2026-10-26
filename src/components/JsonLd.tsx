import type { JsonLdNode } from "@/lib/jsonld";

/**
 * JSON-LD を <script type="application/ld+json"> としてそのまま出力する。
 *
 * 記事ページ（src/app/books/[slug]/page.tsx）が使っているのと同じ形。
 * 複数ノードを渡すときは配列にまとめて1つの script に入れる。
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
