import { JsonLd } from "@/components/JsonLd";
import { getAllBooks } from "@/lib/data";
import { breadcrumbListNode, webPageNode } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const TOTAL_BOOKS = getAllBooks().length;

// /recommend はクライアントコンポーネントのため metadata を直接 export できない。
// セグメントレイアウトで OGP・canonical・構造化データを提供する。
const RECOMMEND_DESCRIPTION = `好きな本・作家、または今読みたいテーマを入力すると、収録${TOTAL_BOOKS}冊の推薦関係と選書理由から次の一冊を提案します。作家名からは、その作家の収録作品につながる次の本も表示します。候補のカードには、なぜつながるかの理由を添えています。`;

export const metadata = buildMetadata({
  title: "おすすめを探す",
  description: RECOMMEND_DESCRIPTION,
  path: "/recommend",
});

export default function RecommendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          webPageNode({
            name: "読んだ本を、次の本の地図に。",
            description: RECOMMEND_DESCRIPTION,
            path: "/recommend",
          }),
          breadcrumbListNode([
            { name: "ホーム", path: "/" },
            { name: "おすすめを探す", path: "/recommend" },
          ]),
        ]}
      />
      {children}
    </>
  );
}
