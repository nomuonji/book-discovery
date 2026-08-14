import { buildMetadata } from "@/lib/seo";

// /recommend はクライアントコンポーネントのため metadata を直接 export できない。
// セグメントレイアウトで OGP・canonical を提供する。
export const metadata = buildMetadata({
  title: "おすすめを探す",
  description: "好きな作家や本を入れると、AIが厳選した「あなたに合う次の一冊」をおすすめします。",
  path: "/recommend",
});

export default function RecommendLayout({ children }: { children: React.ReactNode }) {
  return children;
}
