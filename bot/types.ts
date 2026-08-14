/**
 * bot 共通型定義
 */

export type PostType = "book" | "recommend" | "path" | "author";
export type PlatformName = "x" | "threads" | "instagram";

export interface PostContent {
  /** 投稿タイプ */
  type: PostType;
  /** 主対象のスラッグ（book/path/author のスラッグ） */
  slug: string;
  /** 投稿本文（ハッシュタグ込み・文字数上限にフィット済み。リンクは含めない） */
  text: string;
  /** 添付画像URL（任意） */
  imageUrl?: string;
  /**
   * 記事へのリンク（任意）。
   * 本文には含めず、翌スロットに「前回投稿への時差コメント」として付与する。
   * 本文・直後のコメントにリンクを置くとリーチが絞られるため、本文と分離して持つ。
   */
  link?: string;
  /** UTM キャンペーン名 */
  campaign: string;
  /** 重複チェック用キー（例: "book:norwegian-wood"） */
  dedupeKey: string;
}

export interface PostResult {
  ok: boolean;
  platform: PlatformName;
  /** 投稿ID（成功時） */
  id?: string;
  /** 投稿URL（成功時・Xのみ） */
  url?: string;
  error?: string;
}

export interface Publisher {
  readonly name: PlatformName;
  publish(content: PostContent): Promise<PostResult>;
}
