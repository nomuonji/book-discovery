/**
 * データ構造化スクリプト
 * books.json を category 別に分割し、taxonomy, authors を自動生成する
 * 実行: npx tsx src/data/split.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname);
const CATEGORIES_DIR = path.join(DATA_DIR, "categories");

// ---- カテゴリ定義 ----
const CATEGORY_RULES: Record<string, { label: string; description: string; order: number; match: (book: any) => boolean }> = {
  philosophy: {
    label: "哲学・思想・批評理論",
    description: "実存主義からポストコロニアル理論まで、世界の見え方を変える思想書群。",
    order: 1,
    match: (b) => b.genre.some((g: string) => ["哲学", "フェミニズム", "政治学", "文化批評", "経済学"].includes(g)) ||
                 ["フランス哲学", "ドイツ哲学", "現代思想", "実存主義", "ポストコロニアル", "資本主義批判", "ナショナリズム"].some((t: string) => b.tags.includes(t)),
  },
  "world-fiction": {
    label: "世界文学",
    description: "アフリカ、アジア、ラテンアメリカ、中東、東欧——英語圏を超えた文学の地図。",
    order: 2,
    match: (b) => b.genre.some((g: string) => ["ラテンアメリカ文学", "アフリカ文学", "アジア文学", "東欧文学"].includes(g)) ||
                 ["アラブ文学", "トルコ文学", "韓国文学", "中国文学", "ノルウェー文学"].some((t: string) => b.tags.includes(t)),
  },
  "contemporary-fiction": {
    label: "現代小説",
    description: "2000年以降の世界の文学シーンを牽引する作家たち。ブッカー賞、全米図書賞、ピューリッツァー賞受賞作を中心に。",
    order: 3,
    match: (b) => b.genre.some((g: string) => ["小説", "実験小説", "恋愛", "女性文学"].includes(g)) &&
                 b.year >= 2000 &&
                 !b.genre.some((g: string) => ["ラテンアメリカ文学", "アフリカ文学", "アジア文学", "東欧文学", "SF", "ファンタジー"].includes(g)),
  },
  "classic-fiction": {
    label: "古典・20世紀文学",
    description: "1900年代から1990年代まで、世界文学の基盤を築いた名作群。",
    order: 4,
    match: (b) => b.genre.some((g: string) => ["小説", "実験小説", "短編集"].includes(g)) &&
                 b.year < 2000 &&
                 !b.genre.some((g: string) => ["哲学", "ラテンアメリカ文学", "アフリカ文学", "アジア文学", "東欧文学", "SF", "ファンタジー"].includes(g)),
  },
  nonfiction: {
    label: "ノンフィクション・批評",
    description: "人類史から心理学、環境問題、文化批評まで——世界の見え方を更新する知の傑作群。",
    order: 5,
    match: (b) => b.genre.some((g: string) => ["ノンフィクション", "エッセイ", "科学", "自伝", "歴史", "心理学", "社会学", "口述史"].includes(g)),
  },
  "sf-fantasy": {
    label: "SF・幻想文学",
    description: "想像力で現実を書き換える——ヒューゴー賞、ネビュラ賞から世界のSF・幻想小説まで。",
    order: 6,
    match: (b) => b.genre.some((g: string) => ["SF", "ファンタジー", "ホラー"].includes(g)),
  },
};

// ---- メイン処理 ----
function main() {
  // 既存データ読み込み
  const booksRaw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "books.json"), "utf-8"));
  const books: any[] = booksRaw.books;

  console.log(`📚 ${books.length}冊の本を読み込みました`);

  // カテゴリディレクトリ作成
  if (!fs.existsSync(CATEGORIES_DIR)) fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

  // 本をカテゴリに振り分け
  const categorized: Record<string, any[]> = {};
  const uncategorized: any[] = [];

  for (const book of books) {
    let assigned = false;
    for (const [catKey, catRule] of Object.entries(CATEGORY_RULES)) {
      if (catRule.match(book)) {
        if (!categorized[catKey]) categorized[catKey] = [];
        categorized[catKey].push(book);
        assigned = true;
        break; // 最初にマッチしたカテゴリに入れる
      }
    }
    if (!assigned) uncategorized.push(book);
  }

  // カテゴリファイル書き出し
  for (const [catKey, catRule] of Object.entries(CATEGORY_RULES)) {
    const catBooks = categorized[catKey] || [];
    const catData = {
      category: catKey,
      label: catRule.label,
      description: catRule.description,
      order: catRule.order,
      books: catBooks,
    };
    const filePath = path.join(CATEGORIES_DIR, `${catKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(catData, null, 2), "utf-8");
    console.log(`  ✅ ${catRule.label}: ${catBooks.length}冊 → categories/${catKey}.json`);
  }

  if (uncategorized.length > 0) {
    console.log(`  ⚠️ 未分類: ${uncategorized.length}冊`);
    for (const b of uncategorized) {
      console.log(`     - ${b.slug} (${b.titleJa}) genre=${b.genre.join(",")}`);
    }
  }

  // ---- taxonomy.json 生成 ----
  const allGenres = new Set<string>();
  const allTags = new Set<string>();
  for (const book of books) {
    book.genre.forEach((g: string) => allGenres.add(g));
    book.tags.forEach((t: string) => allTags.add(t));
  }

  const taxonomy = {
    genres: Array.from(allGenres).sort().map((g) => ({ slug: g, labelJa: g })),
    tags: Array.from(allTags).sort().map((t) => ({ slug: t, labelJa: t })),
  };
  fs.writeFileSync(path.join(DATA_DIR, "taxonomy.json"), JSON.stringify(taxonomy, null, 2), "utf-8");
  console.log(`\n🏷️ taxonomy.json: ${taxonomy.genres.length}ジャンル, ${taxonomy.tags.length}タグ`);

  // ---- authors.json 生成 ----
  const authorMap = new Map<string, any>();
  for (const book of books) {
    const key = book.author;
    if (!authorMap.has(key)) {
      authorMap.set(key, {
        slug: book.author.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        name: book.author,
        nameJa: book.authorJa,
        country: book.country,
        bioJa: "",
        books: [book.slug],
      });
    } else {
      authorMap.get(key)!.books.push(book.slug);
    }
  }

  const authors = { authors: Array.from(authorMap.values()) };
  fs.writeFileSync(path.join(DATA_DIR, "authors.json"), JSON.stringify(authors, null, 2), "utf-8");
  console.log(`👤 authors.json: ${authors.authors.length}名の著者`);

  // ---- カテゴリ別インデックス生成 ----
  const categoryIndex = Object.entries(CATEGORY_RULES).map(([key, rule]) => ({
    slug: key,
    label: rule.label,
    description: rule.description,
    order: rule.order,
    count: (categorized[key] || []).length,
  }));
  fs.writeFileSync(path.join(DATA_DIR, "category-index.json"), JSON.stringify(categoryIndex, null, 2), "utf-8");

  console.log("\n✅ 構造化完了！");
  console.log("次のステップ:");
  console.log("  1. data/index.ts を新しい統合ローダーに更新");
  console.log("  2. categories/*.json の著者 bioJa を充実");
  console.log("  3. authors.json の bioJa を充実");
}

main();
