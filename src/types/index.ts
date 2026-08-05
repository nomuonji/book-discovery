// ============================================================
// 型定義 - 洋書発見サイト「読書の羅針盤」
// ============================================================

/** 本 */
export interface Book {
  slug: string;
  title: string;          // 原語タイトル
  titleJa: string;        // 邦題または直訳
  titleEn?: string;       // 英語版タイトル（原書名・将来対応、任意）
  author: string;         // 原語著者名
  authorJa: string;       // 日本語表記
  country: string;        // 国・地域
  year: number;           // 出版年
  genre: string[];        // ジャンル
  coverUrl: string;       // 書影URL（プレースホルダー可）
  asin?: string;           // Amazon ASIN（アフィリエイトリンク用）
  descriptionJa: string;  // AI生成の紹介文（日本語）
  descriptionEn?: string; // AI生成の紹介文（英語・将来対応、任意）
  whyReadJa: string;      // なぜ読むべきか（日本語）
  whyReadEn?: string;     // なぜ読むべきか（英語・将来対応、任意）
  selectionReasonJa?: string; // この本を選んだ理由（キュレーション方針の根拠・日本語、任意）
  selectionReasonEn?: string; // この本を選んだ理由（英語・将来対応、任意）
  tags: string[];         // テーマタグ
}

/** レコメンド */
export interface Recommendation {
  fromSlug: string;
  toSlug: string;
  reasonJa: string;
  reasonEn?: string;      // 推薦理由（英語・将来対応、任意）
  type: "similar-vibe" | "similar-theme" | "if-you-like-author" | "reading-path";
}

/** 読書パスのステップ */
export interface ReadingStep {
  order: number;
  bookSlug: string;
  noteJa: string;         // この本をここで読む理由（日本語）
  noteEn?: string;        // この本をここで読む理由（英語・将来対応、任意）
  keyConceptJa: string;   // 掴むべき概念（日本語）
  keyConceptEn?: string;  // 掴むべき概念（英語・将来対応、任意）
}

/** 読書パス */
export interface ReadingPath {
  slug: string;
  titleJa: string;
  titleEn?: string;       // パス名（英語・将来対応、任意）
  descriptionJa: string;
  descriptionEn?: string; // 概要（英語・将来対応、任意）
  difficulty: 1 | 2 | 3;  // 1:入門 2:中級 3:発展
  steps: ReadingStep[];
}

/** 著者 */
export interface AuthorPage {
  slug: string;
  name: string;
  nameJa: string;
  bioJa: string;
  bioEn?: string;         // 著者紹介（英語・将来対応、任意）
  country: string;
  similarAuthors?: { slug: string; reasonJa: string }[];
}

/** ジャンル定義 */
export interface Genre {
  slug: string;
  labelJa: string;
}
