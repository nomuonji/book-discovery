/**
 * クライアントコンポーネント用 軽量データアクセス
 * Turbopack がクライアントバンドルで大量のJSONを処理するのを避けるため、
 * `@/lib/data` の代わりにこちらを使う。
 * JSONは直接インポートせず、Fetch または最小限のインポートのみ行う。
 */
import categoryIndex from "@/data/category-index.json";

export interface CategoryInfo {
  slug: string;
  label: string;
  description: string;
  order: number;
  count: number;
}

export function getAllCategories(): CategoryInfo[] {
  return (categoryIndex as CategoryInfo[]).sort((a, b) => a.order - b.order);
}
