import { buildMetadata } from "@/lib/seo";

// /recommend はクライアントコンポーネントのため metadata を直接 export できない。
// セグメントレイアウトで OGP・canonical を提供する。
export const metadata = buildMetadata({
  title: "おすすめを探す",
  description: "好きな本・作家・テーマから、推薦関係と選書理由をたどって次に読む一冊を見つけます。",
  path: "/recommend",
});

export default function RecommendLayout({ children }: { children: React.ReactNode }) {
  return children;
}
